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
      vsCount,      // total VSs customer is paying for
      customerId,
    } = await req.json()

    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const supabase   = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── VERIFY SIGNATURE ──────────────────────────────────────────────────────
    const body     = razorpay_order_id + '|' + razorpay_payment_id
    const expected = createHmac('sha256', KEY_SECRET).update(body).digest('hex')

    if (expected !== razorpay_signature) {
      throw new Error('Payment signature verification failed')
    }

    // ── GET CURRENT CUSTOMER ──────────────────────────────────────────────────
    const { data: customer } = await supabase
      .from('customers')
      .select('plan, paid_vs_count')
      .eq('id', customerId)
      .single()

    const currentPaidVs = customer?.paid_vs_count || 0
    // vsCount = total VSs paid for after this payment
    const newPaidVs = Math.max(vsCount, currentPaidVs + 1)

    // ── ACTIVATE PLAN ─────────────────────────────────────────────────────────
    const planExpiry = new Date()
    planExpiry.setMonth(planExpiry.getMonth() + 1)

    const { error: updateErr } = await supabase
      .from('customers')
      .update({
        plan:          'premium',
        plan_status:   'active',
        plan_expiry:   planExpiry.toISOString(),
        paid_vs_count: newPaidVs,   // ← KEY: update paid VS count
      })
      .eq('id', customerId)

    if (updateErr) throw updateErr

    // ── UPDATE BILLING RECORD ─────────────────────────────────────────────────
    await supabase
      .from('billing_history')
      .update({
        razorpay_payment_id,
        status:  'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)

    // ── UPDATE COUPON USAGE ───────────────────────────────────────────────────
    const { data: billing } = await supabase
      .from('billing_history')
      .select('coupon_used')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle()

    if (billing?.coupon_used) {
      await supabase.rpc('increment_coupon_usage', { coupon_code: billing.coupon_used })
    }

    return new Response(JSON.stringify({
      success:     true,
      plan:        'premium',
      paidVsCount: newPaidVs,
      message:     `Premium plan activated! You now have ${newPaidVs} VS(s).`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
