// supabase/functions/verify-razorpay-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      additionalVS,   // how many NEW VSs were bought in this payment
      customerId,
      isAnnual = false,
      isFree   = false,
    } = await req.json()

    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const supabase   = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Verify signature ──────────────────────────────────────────────────
    const body     = razorpay_order_id + '|' + razorpay_payment_id
    const expected = createHmac('sha256', KEY_SECRET).update(body).digest('hex')

    // Skip signature check for free orders (100% coupon)
    if (!isFree && expected !== razorpay_signature) {
      throw new Error('Payment signature verification failed')
    }

    // ── Get current customer ──────────────────────────────────────────────
    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('paid_vs_count, plan')
      .eq('id', customerId)
      .single()

    if (fetchErr) throw fetchErr

    const prevPaidVs = customer?.paid_vs_count || 0
    const newPaidVs  = prevPaidVs + additionalVS  // cumulative total

    // ── Activate plan ─────────────────────────────────────────────────────
    const planExpiry = new Date()
    planExpiry.setMonth(planExpiry.getMonth() + 1)

    // Lock billing cycle on first payment — cannot change later
    const billingCycleUpdate = prevPaidVs === 0
      ? { billing_cycle: isAnnual ? 'annual' : 'monthly' }
      : {}  // already locked — don't change

    // Set expiry based on billing cycle
    if (isAnnual) planExpiry.setMonth(planExpiry.getMonth() + 11)  // +12 total

    const { error: updateErr } = await supabase
      .from('customers')
      .update({
        plan:          'premium',
        plan_status:   'active',
        plan_expiry:   planExpiry.toISOString(),
        paid_vs_count: newPaidVs,
        ...billingCycleUpdate,
      })
      .eq('id', customerId)

    if (updateErr) throw updateErr

    // ── Mark billing paid ─────────────────────────────────────────────────
    await supabase
      .from('billing_history')
      .update({
        razorpay_payment_id,
        status:   'paid',
        paid_at:  new Date().toISOString(),
        vs_count: additionalVS,
      })
      .eq('razorpay_order_id', razorpay_order_id)

    // ── Update coupon usage ───────────────────────────────────────────────
    const { data: billing } = await supabase
      .from('billing_history')
      .select('coupon_used')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle()

    if (billing?.coupon_used) {
      await supabase
        .from('coupons')
        .update({ used_count: supabase.rpc('increment', { x: 1 }) })
        .eq('code', billing.coupon_used)
    }

    return new Response(JSON.stringify({
      success:     true,
      plan:        'premium',
      prevPaidVs,
      additionalVS,
      newPaidVs,
      message:     `Premium activated! You now have ${newPaidVs} VS available.`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
