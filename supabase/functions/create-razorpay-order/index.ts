// supabase/functions/create-razorpay-order/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Load pricing from DB ──────────────────────────────────────────────────────
async function loadPricing(supabase: any) {
  const { data } = await supabase.from('pricing_config').select('key, value')
  const p: any = {}
  for (const row of data || []) p[row.key] = Number(row.value)
  return {
    basePrice:   p.premium_base_price  ?? 2999,
    extraVS:     p.premium_extra_vs    ?? 2249,
    gstRate:     p.gst_rate            ?? 18,
    annualDisc:  p.annual_discount_pct ?? 20,
  }
}

// ── Calculate amount ──────────────────────────────────────────────────────────
// Rule:
//   paidVsCount === 0 → first payment ever
//     amount = basePrice + (additionalVS - 1) × extraVS
//   paidVsCount > 0 → adding more VSs
//     amount = additionalVS × extraVS
//
function calcAmount(
  pricing: any,
  paidVsCount: number,
  additionalVS: number,
  discountPct: number,
  isAnnual: boolean
) {
  let base: number
  if (paidVsCount === 0) {
    base = pricing.basePrice + Math.max(0, additionalVS - 1) * pricing.extraVS
  } else {
    base = additionalVS * pricing.extraVS
  }

  if (isAnnual) base = Math.round(base * (1 - pricing.annualDisc / 100))

  const discount   = Math.round(base * discountPct / 100)
  const afterDisc  = base - discount
  const gst        = Math.round(afterDisc * pricing.gstRate / 100)
  const monthly    = afterDisc + gst
  const total      = isAnnual ? monthly * 12 : monthly

  return { base, discount, afterDiscount: afterDisc, gst, monthly, total, totalPaise: total * 100 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const {
      customerId,
      additionalVS = 1,   // how many NEW VSs being bought
      discountPct  = 0,
      couponCode   = '',
      isAnnual     = false,
    } = await req.json()

    // ── Get customer's current paid_vs_count ──────────────────────────────
    const { data: customer } = await supabase
      .from('customers')
      .select('paid_vs_count, email')
      .eq('id', customerId)
      .single()

    const paidVsCount = customer?.paid_vs_count || 0

    // ── Load pricing ──────────────────────────────────────────────────────
    const pricing = await loadPricing(supabase)

    // ── Validate coupon ───────────────────────────────────────────────────
    let finalDiscount = discountPct
    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .maybeSingle()

      if (coupon) {
        finalDiscount = coupon.discount_pct
        // 100% off = free months
        if (coupon.discount_pct === 100) {
          return new Response(JSON.stringify({
            orderId:       'FREE_' + crypto.randomUUID(),
            amount:        0,
            currency:      'INR',
            isFree:        true,
            freeMonths:    coupon.free_months || 1,
            additionalVS,
            newPaidVsCount: paidVsCount + additionalVS,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }
    }

    // ── Calculate amount ──────────────────────────────────────────────────
    const amounts = calcAmount(pricing, paidVsCount, additionalVS, finalDiscount, isAnnual)

    // ── Create Razorpay order ─────────────────────────────────────────────
    const KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID')!
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const receipt    = `rcpt_${customerId.slice(0,8)}_${Date.now()}`

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Basic ' + btoa(`${KEY_ID}:${KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount:   amounts.totalPaise,
        currency: 'INR',
        receipt,
        notes: {
          customer_id:    customerId,
          additional_vs:  additionalVS,
          paid_vs_before: paidVsCount,
          is_annual:      isAnnual,
        },
      }),
    })

    if (!rzpRes.ok) {
      const err = await rzpRes.json()
      throw new Error(err.error?.description || 'Razorpay order creation failed')
    }

    const rzpOrder = await rzpRes.json()

    // ── Save pending billing record ───────────────────────────────────────
    await supabase.from('billing_history').insert({
      customer_id:       customerId,
      razorpay_order_id: rzpOrder.id,
      plan:              'premium',
      vs_count:          additionalVS,
      amount_base:       amounts.base * 100,
      amount_gst:        amounts.gst * 100,
      amount_total:      amounts.totalPaise,
      discount_pct:      finalDiscount,
      coupon_used:       couponCode || null,
      status:            'pending',
    })

    return new Response(JSON.stringify({
      orderId:       rzpOrder.id,
      amount:        rzpOrder.amount,
      currency:      rzpOrder.currency,
      paidVsCount,
      additionalVS,
      newPaidVsCount: paidVsCount + additionalVS,
      breakdown:     amounts,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
