// supabase/functions/create-razorpay-order/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Load pricing from DB — single source of truth
async function loadPricing(supabase: any) {
  const { data } = await supabase
    .from('pricing_config')
    .select('key, value')

  const defaults = {
    free_contact_limit:  1000,
    single_base_price:   2999,
    multiple_base_price: 2999,
    multiple_extra_vs:   2249,
    gst_rate:            18,
  }

  if (!data?.length) return defaults
  return { ...defaults, ...Object.fromEntries(data.map((r: any) => [r.key, Number(r.value)])) }
}

function calcAmount(pricing: any, plan: string, vsCount: number, discountPct: number) {
  let base = plan === 'single'
    ? pricing.single_base_price
    : pricing.multiple_base_price + Math.max(0, vsCount - 1) * pricing.multiple_extra_vs

  const disc    = Math.round(base * discountPct / 100)
  const after   = base - disc
  const gst     = Math.round(after * pricing.gst_rate / 100)
  const total   = after + gst
  return { base, discount: disc, afterDiscount: after, gst, total, totalPaise: total * 100 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { plan, vsCount, discountPct = 0, couponCode, customerId } = await req.json()

    // Load live pricing from DB
    const pricing = await loadPricing(supabase)

    // Validate coupon
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
        if (coupon.discount_pct === 100) {
          return new Response(JSON.stringify({
            orderId:    'FREE_' + crypto.randomUUID(),
            amount:     0,
            currency:   'INR',
            isFree:     true,
            freeMonths: coupon.free_months || 1,
            couponCode,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }
    }

    const amounts = calcAmount(pricing, plan, vsCount, finalDiscount)

    // Create Razorpay order
    const RAZORPAY_KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID')!
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const receipt = `rcpt_${customerId.slice(0,8)}_${Date.now()}`

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount:   amounts.totalPaise,
        currency: 'INR',
        receipt,
        notes: { plan, vs_count: vsCount, customer_id: customerId },
      }),
    })

    if (!rzpResponse.ok) {
      const err = await rzpResponse.json()
      throw new Error(err.error?.description || 'Razorpay order creation failed')
    }

    const rzpOrder = await rzpResponse.json()

    // Save pending billing record
    await supabase.from('billing_history').insert({
      customer_id:       customerId,
      razorpay_order_id: rzpOrder.id,
      plan,
      vs_count:          vsCount,
      amount_base:       amounts.base * 100,
      amount_gst:        amounts.gst * 100,
      amount_total:      amounts.totalPaise,
      discount_pct:      finalDiscount,
      coupon_used:       couponCode || null,
      status:            'pending',
    })

    return new Response(JSON.stringify({
      orderId:   rzpOrder.id,
      amount:    rzpOrder.amount,
      currency:  rzpOrder.currency,
      receipt:   rzpOrder.receipt,
      breakdown: amounts,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})