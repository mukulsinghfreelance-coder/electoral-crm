// ─── src/lib/razorpay.js ──────────────────────────────────────────────────────
// Razorpay Orders API integration
// All payment creation goes through Supabase Edge Function (server-side)
// to keep KEY_SECRET safe

import { supabase } from './supabase'
import { BILLING, PLANS } from '../config'

// ── Load Razorpay script dynamically ─────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ── Validate coupon code ──────────────────────────────────────────────────────
export async function validateCoupon(code, plan) {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('active', true)
    .maybeSingle()

  if (error || !data) return { valid: false, message: 'Invalid coupon code' }

  // Check expiry
  if (data.valid_until && new Date(data.valid_until) < new Date()) {
    return { valid: false, message: 'Coupon has expired' }
  }

  // Check usage limit
  if (data.max_uses !== -1 && data.used_count >= data.max_uses) {
    return { valid: false, message: 'Coupon usage limit reached' }
  }

  // Check plan lock
  if (data.plan_lock && data.plan_lock !== plan) {
    return { valid: false, message: `This coupon is only valid for the ${PLANS[data.plan_lock]?.label} plan` }
  }

  return {
    valid:       true,
    discountPct: data.discount_pct,
    freeMonths:  data.free_months,
    message:     data.discount_pct === 100
      ? `${data.free_months || 1} month(s) free!`
      : `${data.discount_pct}% discount applied!`,
    data,
  }
}

// ── Create Razorpay order via Supabase Edge Function ─────────────────────────
export async function createOrder({ plan, vsCount, discountPct, couponCode, customerId }) {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { plan, vsCount, discountPct, couponCode, customerId }
  })
  if (error) throw new Error(error.message || 'Failed to create order')
  return data  // { orderId, amount, currency, receipt }
}

// ── Open Razorpay checkout ────────────────────────────────────────────────────
export async function openRazorpayCheckout({ order, customer, plan, vsCount, onSuccess, onFailure }) {
  const loaded = await loadRazorpayScript()
  if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection.')

  const options = {
    key:         BILLING.razorpayKeyId,
    amount:      order.amount,        // in paise
    currency:    order.currency || 'INR',
    name:        'Sampark.AI',
    description: `${PLANS[plan]?.label} Plan — ${vsCount} VS`,
    image:       '/logo.png',
    order_id:    order.orderId,
    prefill: {
      name:    customer.name  || '',
      email:   customer.email || '',
      contact: customer.phone || '',
    },
    notes: {
      plan,
      vs_count:    vsCount,
      customer_id: customer.id,
    },
    theme: { color: '#6C63FF' },
    modal: {
      ondismiss: () => onFailure?.('Payment cancelled'),
    },
    handler: async (response) => {
      // Verify payment via Edge Function
      try {
        const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
          body: {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            plan,
            vsCount,
            customerId: customer.id,
          }
        })
        if (error) throw new Error(error.message)
        onSuccess?.(data)
      } catch(e) {
        onFailure?.(e.message || 'Payment verification failed')
      }
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.on('payment.failed', (response) => {
    onFailure?.(response.error?.description || 'Payment failed')
  })
  rzp.open()
}

// ── Full payment flow (create order + open checkout) ─────────────────────────
export async function initiatePayment({ customer, plan, vsCount, discountPct = 0, couponCode = '', onSuccess, onFailure, onLoading }) {
  try {
    onLoading?.(true)

    // Create order on server
    const order = await createOrder({
      plan,
      vsCount,
      discountPct,
      couponCode,
      customerId: customer.id,
    })

    onLoading?.(false)

    // Open Razorpay checkout
    await openRazorpayCheckout({
      order,
      customer,
      plan,
      vsCount,
      onSuccess,
      onFailure,
    })
  } catch(e) {
    onLoading?.(false)
    onFailure?.(e.message || 'Payment initiation failed')
  }
}

// ── Fetch billing history for a customer ─────────────────────────────────────
export async function fetchBillingHistory(customerId) {
  const { data, error } = await supabase
    .from('billing_history')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── Format paise to rupees display ───────────────────────────────────────────
export function formatPaise(paise) {
  const rupees = paise / 100
  return `₹${rupees.toLocaleString('en-IN')}`
}
