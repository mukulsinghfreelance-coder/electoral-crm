// src/components/UpgradeModal.jsx
// Clean payment module — Free → Premium / Premium → Add more VS
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { PLANS as DEFAULT_PLANS, BILLING } from '../config'
import { validateCoupon, initiatePayment } from '../lib/razorpay'
import { useAuth } from '../context/AuthContext'

const C = {
  primary:'#6C63FF', primaryD:'#4F46E5', accent:'#A78BFA',
  bg:'#16152A', bg2:'#1C1B35', border:'rgba(255,255,255,0.1)',
  border2:'rgba(255,255,255,0.2)', white:'#FFFFFF',
  gray:'#9CA3AF', gray2:'#6B7280', success:'#10B981',
  red:'#EF4444', gold:'#F59E0B', text:'#F1F0FF',
}
const font = "system-ui,-apple-system,'Segoe UI',sans-serif"

// ── Pricing calculator ────────────────────────────────────────────────────────
// Rule:
//   First VS ever = basePrice (₹2,999)
//   All subsequent VS = extraVS (₹2,249)
//
// additionalVS = how many NEW VSs customer is buying now
// paidVsCount  = how many VSs customer has already paid for (cumulative)
//
// if paidVsCount === 0 (first payment ever):
//   amount = basePrice + (additionalVS - 1) × extraVS
// else (already premium, buying more):
//   amount = additionalVS × extraVS
//
function calcPayment({ paidVsCount, additionalVS, basePrice, extraVS, gstRate, discountPct = 0, isAnnual = false, annualDiscount = 20 }) {
  // Base amount before discount
  let base
  if (paidVsCount === 0) {
    // First payment — first VS at full price, rest at discount
    base = basePrice + Math.max(0, additionalVS - 1) * extraVS
  } else {
    // Subsequent payment — all VSs at discounted rate
    base = additionalVS * extraVS
  }

  // Annual discount
  if (isAnnual) base = Math.round(base * (1 - annualDiscount / 100))

  // Coupon discount
  const discount    = Math.round(base * discountPct / 100)
  const afterDisc   = base - discount
  const gst         = Math.round(afterDisc * gstRate)
  const monthly     = afterDisc + gst
  const total       = isAnnual ? monthly * 12 : monthly
  const totalPaise  = total * 100

  return { base, discount, afterDiscount: afterDisc, gst, monthly, total, totalPaise, isAnnual }
}

export default function UpgradeModal({ onClose, triggerReason = '', initialPlan = null }) {
  // ── ALL HOOKS FIRST ───────────────────────────────────────────────────────
  const { customer, livePlans, paidVsCount, annualBillingEnabled, annualDiscountPct } = useAuth()

  const currentCycle = customer?.billing_cycle || 'monthly'

  const [additionalVS,  setAdditionalVS]  = useState(1)
  // Lock billing cycle after first payment
  const isFirstPayment   = paidVsCount === 0
  const lockedToAnnual   = !isFirstPayment && customer?.billing_cycle === 'annual'
  const [isAnnual, setIsAnnual] = useState(
    isFirstPayment ? false : customer?.billing_cycle === 'annual'
  )
  const [coupon,        setCoupon]        = useState('')
  const [couponResult,  setCouponResult]  = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [payLoading,    setPayLoading]    = useState(false)
  const [payError,      setPayError]      = useState('')
  const [paySuccess,    setPaySuccess]    = useState(false)

  // ── COMPUTED ──────────────────────────────────────────────────────────────
  const PLANS      = livePlans || DEFAULT_PLANS
  const premium    = PLANS.premium || DEFAULT_PLANS.premium
  const basePrice  = premium.basePrice  || 2999
  const extraVS    = premium.extraVS    || 2249
  const gstRate    = livePlans?.gstRate ?? BILLING.gstRate
  const annualDisc = annualDiscountPct  ?? 20
  const discPct    = couponResult?.valid ? couponResult.discountPct : 0

  const breakdown = calcPayment({
    paidVsCount,
    additionalVS,
    basePrice,
    extraVS,
    gstRate,
    discountPct: discPct,
    isAnnual,
    annualDiscount: annualDisc,
  })

  const newTotalVS = paidVsCount + additionalVS
  const isFree     = breakdown.total === 0 || couponResult?.freeMonths > 0

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  const handleCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true); setCouponResult(null)
    const result = await validateCoupon(coupon, 'premium')
    setCouponResult(result)
    setCouponLoading(false)
  }

  const handlePay = async () => {
    setPayError(''); setPayLoading(true)
    await initiatePayment({
      customer,
      additionalVS,   // how many NEW VSs being bought
      discountPct: discPct,
      couponCode:  coupon,
      isAnnual,
      onLoading:   setPayLoading,
      onSuccess:   () => {
        setPaySuccess(true)
        setTimeout(() => { onClose(); window.location.reload() }, 2000)
      },
      onFailure: (msg) => {
        setPayError(msg || 'Payment failed. Please try again.')
        setPayLoading(false)
      },
    })
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (paySuccess) return createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999 }}>
      <div style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:20, padding:40, textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
        <div style={{ fontSize:20, fontWeight:800, color:C.white, marginBottom:8 }}>Payment Successful!</div>
        <div style={{ fontSize:14, color:C.gray, lineHeight:1.7 }}>
          You now have <strong style={{ color:C.accent }}>{newTotalVS} VS</strong> available.
          <br/>Redirecting to dashboard…
        </div>
      </div>
    </div>,
    document.body
  )

  // ── MAIN MODAL ────────────────────────────────────────────────────────────
  return createPortal(
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999, padding:20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:20, padding:28, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', fontFamily:font }}
      >
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:C.white }}>
              {paidVsCount === 0 ? '⚡ Upgrade to Premium' : '➕ Add More Constituencies'}
            </div>
            {triggerReason
              ? <div style={{ fontSize:12, color:C.gold, marginTop:3 }}>{triggerReason}</div>
              : <div style={{ fontSize:12, color:C.gray, marginTop:3 }}>
                  {paidVsCount === 0
                    ? 'Get unlimited contacts and multiple constituencies'
                    : `Currently have ${paidVsCount} paid VS — add more below`}
                </div>
            }
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', color:C.gray, fontSize:16, fontFamily:font, flexShrink:0 }}>✕</button>
        </div>

        {/* Billing cycle — toggle on first payment, locked info on subsequent */}
        {annualBillingEnabled && isFirstPayment && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, color:C.white, fontWeight:500 }}>Annual billing</div>
              <div style={{ fontSize:11, color:C.success }}>Save {annualDisc}% vs monthly — locked for all future payments</div>
            </div>
            <div
              onClick={() => setIsAnnual(a => !a)}
              style={{ width:44, height:24, borderRadius:12, background: isAnnual ? C.primary : 'rgba(255,255,255,0.15)', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}
            >
              <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: isAnnual ? 23 : 3, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}/>
            </div>
          </div>
        )}
        {!isFirstPayment && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, color:C.white, fontWeight:500 }}>
                📅 Billing cycle: <span style={{ color:C.accent }}>{isAnnual ? 'Annual' : 'Monthly'}</span>
              </div>
              <div style={{ fontSize:11, color:C.gray2 }}>
                Locked from your first payment · Contact support to change
              </div>
            </div>
            <span style={{ fontSize:10, background: isAnnual ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.08)', color: isAnnual ? C.accent : C.gray, padding:'3px 10px', borderRadius:20, fontWeight:700, border:`1px solid ${isAnnual ? 'rgba(108,99,255,0.3)' : C.border}` }}>
              🔒 {isAnnual ? 'Annual' : 'Monthly'}
            </span>
          </div>
        )}

        {/* VS selector */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:12, padding:'16px', marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.white }}>
              {paidVsCount === 0 ? 'How many constituencies?' : 'How many to add?'}
            </div>
            {paidVsCount > 0 && (
              <div style={{ fontSize:11, color:C.gray2 }}>Currently {paidVsCount} paid VS</div>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <button
              onClick={() => setAdditionalVS(v => Math.max(1, v - 1))}
              disabled={additionalVS <= 1}
              style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${C.border2}`, background:'transparent', color: additionalVS <= 1 ? C.gray2 : C.white, fontSize:20, cursor: additionalVS <= 1 ? 'not-allowed' : 'pointer', fontFamily:font, display:'flex', alignItems:'center', justifyContent:'center' }}
            >−</button>
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:36, fontWeight:800, color:C.white, lineHeight:1 }}>{additionalVS}</div>
              <div style={{ fontSize:11, color:C.gray2, marginTop:4 }}>
                {additionalVS === 1 ? 'Vidhan Sabha' : 'Vidhan Sabhas'}
                {paidVsCount > 0 && (
                  <span style={{ color:C.success, marginLeft:6 }}>
                    → Total: {newTotalVS} VS
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setAdditionalVS(v => v + 1)}
              style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${C.border2}`, background:'transparent', color:C.white, fontSize:20, cursor:'pointer', fontFamily:font, display:'flex', alignItems:'center', justifyContent:'center' }}
            >+</button>
          </div>

          {/* Pricing hint */}
          <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, fontSize:12, color:C.gray2 }}>
            {paidVsCount === 0 ? (
              additionalVS === 1
                ? `₹${basePrice.toLocaleString('en-IN')} for your first constituency`
                : `₹${basePrice.toLocaleString('en-IN')} first + ₹${extraVS.toLocaleString('en-IN')} × ${additionalVS - 1} additional`
            ) : (
              `₹${extraVS.toLocaleString('en-IN')} × ${additionalVS} VS (discounted rate)`
            )}
          </div>
        </div>

        {/* Coupon */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:C.gray, marginBottom:8, fontWeight:500 }}>Have a coupon code?</div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              type="text" placeholder="Enter coupon code"
              value={coupon}
              onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponResult(null) }}
              style={{ flex:1, padding:'10px 12px', fontSize:13, background:'rgba(255,255,255,0.05)', border:`1px solid ${couponResult?.valid ? C.success : couponResult ? C.red : C.border}`, borderRadius:8, color:C.white, fontFamily:font, outline:'none' }}
            />
            <button
              onClick={handleCoupon}
              disabled={couponLoading || !coupon.trim()}
              style={{ padding:'10px 16px', fontSize:13, fontWeight:600, background:'rgba(108,99,255,0.2)', border:`1px solid ${C.border2}`, borderRadius:8, color:C.accent, cursor:'pointer', fontFamily:font }}
            >
              {couponLoading ? '…' : 'Apply'}
            </button>
          </div>
          {couponResult && (
            <div style={{ fontSize:12, marginTop:6, color: couponResult.valid ? C.success : C.red, fontWeight:500 }}>
              {couponResult.valid ? '✓ ' : '✗ '}{couponResult.message}
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.white, marginBottom:12 }}>Price Breakdown</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

            {/* Line items */}
            {paidVsCount === 0 ? (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.gray }}>
                  <span>First VS (Premium)</span>
                  <span>₹{basePrice.toLocaleString('en-IN')}</span>
                </div>
                {additionalVS > 1 && (
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.gray }}>
                    <span>{additionalVS - 1} additional VS × ₹{extraVS.toLocaleString('en-IN')}</span>
                    <span>₹{((additionalVS - 1) * extraVS).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.gray }}>
                <span>{additionalVS} VS × ₹{extraVS.toLocaleString('en-IN')} (discounted)</span>
                <span>₹{(additionalVS * extraVS).toLocaleString('en-IN')}</span>
              </div>
            )}

            {isAnnual && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.success }}>
                <span>Annual discount ({annualDisc}%)</span>
                <span>−{annualDisc}%</span>
              </div>
            )}

            {breakdown.discount > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.success }}>
                <span>Coupon discount ({discPct}%)</span>
                <span>−₹{breakdown.discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.gray }}>
              <span>GST ({Math.round(gstRate * 100)}%)</span>
              <span>₹{breakdown.gst.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ height:1, background:C.border, margin:'4px 0' }}/>

            <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:800, color:C.white }}>
              <span>{isAnnual ? 'Total (12 months)' : 'Total / month'}</span>
              <span style={{ color:C.accent }}>
                ₹{breakdown.total.toLocaleString('en-IN')}
              </span>
            </div>

            {isAnnual && (
              <div style={{ fontSize:11, color:C.gray2, textAlign:'right' }}>
                ₹{breakdown.monthly.toLocaleString('en-IN')}/month × 12
              </div>
            )}
          </div>
        </div>

        {payError && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13, color:C.red }}>
            ⚠ {payError}
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={payLoading}
          style={{
            width:'100%', padding:'14px', fontSize:15, fontWeight:700,
            background: payLoading ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${C.primary},${C.primaryD})`,
            border:'none', borderRadius:12,
            color: payLoading ? C.gray : C.white,
            cursor: payLoading ? 'not-allowed' : 'pointer',
            fontFamily:font,
            boxShadow: payLoading ? 'none' : '0 8px 24px rgba(108,99,255,0.4)',
          }}
        >
          {payLoading
            ? '⏳ Processing…'
            : isFree
              ? '🎁 Activate Free'
              : isAnnual
                ? `Pay ₹${breakdown.total.toLocaleString('en-IN')} for 12 months →`
                : `Pay ₹${breakdown.total.toLocaleString('en-IN')}/month →`
          }
        </button>

        <div style={{ fontSize:11, color:C.gray2, textAlign:'center', marginTop:12, lineHeight:1.6 }}>
          🔒 Secured by Razorpay · GST invoice sent to {customer?.email}
        </div>
      </div>
    </div>,
    document.body
  )
}
