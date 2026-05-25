// ═══════════════════════════════════════════════════════════════════════════════
// ContactBook Electoral Manager — CENTRAL CONFIG
// ───────────────────────────────────────────────
// This is the ONE file to edit for:
//   • Branding (app name, tagline, logo emoji)
//   • Subscription plans & pricing
//   • Feature limits
//   • Super admin email
//   • Contact limits, VS limits
// ═══════════════════════════════════════════════════════════════════════════════

// ─── BRANDING ─────────────────────────────────────────────────────────────────
export const APP = {
  name:     'ContactBook',
  tagline:  'Electoral Manager',
  emoji:    '📋',
  country:  'India',
  currency: '₹',
  domain:   'contactbook.in',   // update when you have a domain
}

// ─── SUPER ADMIN ──────────────────────────────────────────────────────────────
// Also set VITE_SUPER_ADMIN_EMAIL in your .env file
export const SUPER_ADMIN_EMAIL = 'mukulsingh.freelance@gmail.com'

// ─── SUBSCRIPTION PLANS ───────────────────────────────────────────────────────
// label      → Display name shown in UI
// vs         → Max Vidhan Sabhas allowed (Infinity = no limit)
// contacts   → Max contacts allowed across all VSs (Infinity = no limit)
// basePrice  → Monthly price for the plan (in ₹, for first VS)
// extraVS    → Price per additional VS beyond the first (0 = not applicable)
// highlight  → Show as recommended plan in pricing table
// description→ Short marketing line shown on landing page

export const PLANS = {
  free: {
    label:       'Free',
    vs:          1,
    contacts:    1000,
    basePrice:   0,
    extraVS:     0,
    highlight:   false,
    description: 'Get started with 1 constituency',
    badge:       { bg: '#F3F4F6', cl: '#4B5563' },
  },
  single: {
    label:       'Single',
    vs:          1,
    contacts:    Infinity,
    basePrice:   2999,
    extraVS:     0,
    highlight:   false,
    description: '1 constituency, unlimited contacts',
    badge:       { bg: '#D1FAE5', cl: '#065F46' },
  },
  multiple: {
    label:       'Multiple',
    vs:          Infinity,
    contacts:    Infinity,
    basePrice:   2999,      // price for first VS
    extraVS:     2249,      // 25% discount on subsequent VSs (2999 × 0.75 = 2249.25 ≈ 2249)
    highlight:   true,      // shown as "Most Popular"
    description: 'Multiple constituencies, unlimited contacts',
    badge:       { bg: '#EEF2FF', cl: '#3730A3' },
  },
}

// ─── PRICING HELPERS ──────────────────────────────────────────────────────────
// Calculate monthly bill for a customer based on plan + number of VSs
export function calcMonthlyPrice(plan, vsCount = 1) {
  const p = PLANS[plan]
  if (!p || p.basePrice === 0) return 0
  if (plan === 'single')   return p.basePrice
  if (plan === 'multiple') return p.basePrice + Math.max(0, vsCount - 1) * p.extraVS
  return 0
}

// Format price for display  e.g. 2999 → "₹2,999/mo"
export function formatPrice(amount, suffix = '/mo') {
  if (amount === 0) return `${APP.currency}0`
  return `${APP.currency}${amount.toLocaleString('en-IN')}${suffix}`
}

// Get plan limits object (used in AuthContext / enforcement)
export function getPlanLimits(plan) {
  const p = PLANS[plan] || PLANS.free
  return { vs: p.vs, contacts: p.contacts, label: p.label }
}

// ─── TAX & BILLING ────────────────────────────────────────────────────────────
export const BILLING = {
  gstRate:        0.18,   // 18% GST — change if rate changes
  currency:       'INR',
  currencySymbol: '₹',
  // Razorpay
  razorpayKeyId:  import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  // Plan renewal
  billingCycle:   'monthly',   // monthly only for now
  gracePeriodDays: 3,          // days after expiry before restricting access
}

// Calculate price breakdown for a given plan + VS count
export function calcPriceBreakdown(plan, vsCount = 1, discountPct = 0) {
  const base    = calcMonthlyPrice(plan, vsCount)  // in rupees
  const disc    = Math.round(base * discountPct / 100)
  const after   = base - disc
  const gst     = Math.round(after * BILLING.gstRate)
  const total   = after + gst
  return {
    base,           // ₹ before discount
    discount: disc, // ₹ discount
    afterDiscount: after,
    gst,            // ₹ GST
    total,          // ₹ total to pay
    // in paise (Razorpay uses paise)
    totalPaise: total * 100,
  }
}

// ─── FEATURE FLAGS ────────────────────────────────────────────────────────────
export const FEATURES = {
  googleAuth:       true,    // enable Google OAuth login
  otpAuth:          true,    // enable OTP email login
  razorpay:         true,    // enable Razorpay payment
  superAdminPanel:  true,    // enable super admin panel for your email
  volunteerModule:  true,    // enable volunteer management
  sheetsSync:       true,    // enable Google Sheets sync
  excelImport:      true,    // enable Excel import
}

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
export const DEFAULTS = {
  state:     'Bihar',
  lokSabha:  'Patna Sahib',
  vs:        'Bankipur',
  adminPin:  '1234',
  parties:   ['BJP+', 'Congress+', 'Others+'],
  elections: ['Election 2015', 'Election 2020', 'Election 2024'],
  castes:    ['Yadav', 'Brahmin', 'Kurmi', 'Bhumihar', 'Rajput', 'Muslim', 'Koeri', 'Dusadh'],
  labels: {
    mandal:     'Mandal',
    panchayat:  'Panchayat',
    booth:      'Booth',
    village:    'Village',
    boothName:  'Booth Name',
    caste:      'Caste',
    tag:        'Tag',
    contacts:   'Contacts',
    karyakarta: 'Karyakarta',
    whatsapp:   'WhatsApp No.',
  },
}

// ─── CONTACT TAGS ─────────────────────────────────────────────────────────────
export const CONTACT_TAGS = [
  'Key Voter', 'Karyakarta', 'Supporter', 'Opponent',
  'Champion', 'Partner', 'Padadhikari', 'Neutral',
]

// ─── QUICK REFERENCE ──────────────────────────────────────────────────────────
// To change pricing:
//   1. Edit PLANS.single.basePrice       ← Single plan price
//   2. Edit PLANS.multiple.basePrice     ← Multiple plan first VS price
//   3. Edit PLANS.multiple.extraVS       ← Multiple plan per-additional-VS price
//
// To change contact limits:
//   1. Edit PLANS.free.contacts          ← Free plan contact cap
//
// To change VS limits:
//   1. PLANS.free.vs and PLANS.single.vs are already 1
//   2. PLANS.multiple.vs = Infinity (open-ended) — change to a number to cap
//
// To add a new plan:
//   1. Add it to PLANS object above
//   2. Update the DB CHECK constraint: ALTER TABLE customers DROP CONSTRAINT customers_plan_check;
//      ALTER TABLE customers ADD CONSTRAINT customers_plan_check CHECK (plan IN ('free','single','multiple','newplan'));
