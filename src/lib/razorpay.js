// src/lib/razorpay.js
import { supabase } from './supabase'

// ── Load Razorpay script ──────────────────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script      = document.createElement('script')
    script.src        = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload     = () => resolve(true)
    script.onerror    = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ── Validate coupon ───────────────────────────────────────────────────────────
export async function validateCoupon(code, plan) {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('active', true)
    .maybeSingle()

  if (error || !data) return { valid: false, message: 'Invalid coupon code' }

  if (data.valid_until && new Date(data.valid_until) < new Date())
    return { valid: false, message: 'Coupon has expired' }

  if (data.max_uses !== -1 && data.used_count >= data.max_uses)
    return { valid: false, message: 'Coupon usage limit reached' }

  if (data.plan_lock && data.plan_lock !== plan)
    return { valid: false, message: `This coupon is only valid for the ${data.plan_lock} plan` }

  return {
    valid:       true,
    discountPct: data.discount_pct,
    freeMonths:  data.free_months,
    message:     data.discount_pct === 100
      ? `${data.free_months || 1} month(s) free!`
      : `${data.discount_pct}% discount applied!`,
  }
}

// ── Create Razorpay order via Edge Function ───────────────────────────────────
export async function createOrder({ customerId, additionalVS, discountPct, couponCode, isAnnual }) {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { customerId, additionalVS, discountPct, couponCode, isAnnual }
  })
  if (error) throw new Error(error.message || 'Failed to create order')
  return data
}

// ── Open Razorpay checkout ────────────────────────────────────────────────────
export async function openRazorpayCheckout({ order, customer, additionalVS, onSuccess, onFailure }) {
  const loaded = await loadRazorpayScript()
  if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection.')

  const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (!rzpKey) {
    onFailure?.('Razorpay API key is not configured.')
    return
  }

  const options = {
    key:         rzpKey,
    amount:      order.amount,
    currency:    order.currency || 'INR',
    name:        'Sampark.AI',
    description: `Premium Plan — ${additionalVS} VS`,
    image:       '/logo.png',
    order_id:    order.orderId,
    prefill: {
      name:    customer.name  || '',
      email:   customer.email || '',
      contact: customer.phone || '',
    },
    notes: {
      customer_id:   customer.id,
      additional_vs: additionalVS,
    },
    theme: { color: '#6C63FF' },
    modal: {
      ondismiss: () => onFailure?.('Payment cancelled'),
    },
    handler: async (response) => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
          body: {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            additionalVS,
            customerId: customer.id,
            isAnnual,
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
  rzp.on('payment.failed', (res) => {
    onFailure?.(res.error?.description || 'Payment failed')
  })
  rzp.open()
}

// ── Full payment flow ─────────────────────────────────────────────────────────
export async function initiatePayment({
  customer,
  additionalVS = 1,
  discountPct  = 0,
  couponCode   = '',
  isAnnual     = false,
  onSuccess,
  onFailure,
  onLoading,
}) {
  try {
    onLoading?.(true)

    const order = await createOrder({
      customerId:  customer.id,
      additionalVS,
      discountPct,
      couponCode,
      isAnnual,
    })

    // Handle 100% coupon (free)
    if (order.isFree) {
      onLoading?.(false)
      // Activate directly via verify endpoint with free order
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          razorpay_order_id:   order.orderId,
          razorpay_payment_id: 'free_' + Date.now(),
          razorpay_signature:  'free',
          additionalVS,
          customerId: customer.id,
          isAnnual,
          isFree:     true,
        }
      })
      if (error) throw new Error(error.message)
      onSuccess?.(data)
      return
    }

    onLoading?.(false)

    await openRazorpayCheckout({
      order,
      customer,
      additionalVS,
      onSuccess,
      onFailure,
    })
  } catch(e) {
    onLoading?.(false)
    onFailure?.(e.message || 'Payment initiation failed')
  }
}

// ── Fetch billing history ─────────────────────────────────────────────────────
export async function fetchBillingHistory(customerId) {
  const { data, error } = await supabase
    .from('billing_history')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── Format paise to rupees ────────────────────────────────────────────────────
export function formatPaise(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}
