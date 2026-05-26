// src/components/UpgradeModal.jsx
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

export default function UpgradeModal({ onClose, currentVSCount = 1, triggerReason = '', initialPlan = null }) {
  // ── ALL HOOKS FIRST — no functions before hooks ───────────────────────────
  const { customer, livePlans } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || 'single')
  const [coupon,       setCoupon]       = useState('')
  const [couponResult, setCouponResult] = useState(null)
  const [couponLoading,setCouponLoading]= useState(false)
  const [payLoading,   setPayLoading]   = useState(false)
  const [payError,     setPayError]     = useState('')
  const [paySuccess,   setPaySuccess]   = useState(false)
  const [vsCount,      setVsCount]      = useState(1)
  const [isAnnual,     setIsAnnual]     = useState(false)

  useEffect(() => {
    setVsCount(selectedPlan === 'multiple' ? Math.max(currentVSCount, 2) : 1)
  }, [selectedPlan, currentVSCount])

  // ── HELPERS (after hooks) ─────────────────────────────────────────────────
  const PLANS   = livePlans || DEFAULT_PLANS
  const gstRate = livePlans?.gstRate ?? BILLING.gstRate

  const ANNUAL_DISCOUNT = 20  // 20% off for annual

  const calcBreakdown = (plan, vsCnt, discPct) => {
    const p = PLANS[plan]
    if (!p || p.basePrice === 0) return { base:0, discount:0, afterDiscount:0, gst:0, total:0, totalPaise:0 }
    const monthly = plan === 'single' ? p.basePrice : p.basePrice + Math.max(0, vsCnt - 1) * p.extraVS
    // Annual: 20% off monthly rate
    const base    = isAnnual ? Math.round(monthly * (1 - ANNUAL_DISCOUNT/100)) : monthly
    const disc    = Math.round(base * discPct / 100)
    const after   = base - disc
    const gst     = Math.round(after * gstRate)
    const total   = after + gst
    return { base, monthly, discount:disc, afterDiscount:after, gst, total, totalPaise: isAnnual ? total * 12 * 100 : total * 100, isAnnual }
  }

  const discountPct = couponResult?.valid ? couponResult.discountPct : 0
  const breakdown   = calcBreakdown(selectedPlan, vsCount, discountPct)
  const isFree      = breakdown.total === 0 || (couponResult?.freeMonths > 0)

  const handleCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true); setCouponResult(null)
    const result = await validateCoupon(coupon, selectedPlan)
    setCouponResult(result)
    setCouponLoading(false)
  }

  const handlePay = async () => {
    setPayError(''); setPayLoading(true)
    await initiatePayment({
      customer,
      plan:        selectedPlan,
      vsCount,
      discountPct,
      couponCode:  coupon,
      onLoading:   setPayLoading,
      onSuccess:   () => {
        setPaySuccess(true)
        setTimeout(() => { onClose(); window.location.reload() }, 2000)
      },
      onFailure: (msg) => {
        let err = msg || 'Payment failed'
        if (err.includes('Failed to fetch') || err.includes('network')) err = '🌐 Network error — check your internet connection'
        setPayError(err)
        setPayLoading(false)
      },
    })
  }

  // ── SUCCESS STATE ─────────────────────────────────────────────────────────
  if (paySuccess) return createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999 }}>
      <div style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:20, padding:40, textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
        <div style={{ fontSize:20, fontWeight:800, color:C.white, marginBottom:8 }}>Plan Activated!</div>
        <div style={{ fontSize:14, color:C.gray }}>Your {PLANS[selectedPlan]?.label} plan is now active. Reloading...</div>
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
        style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:20, padding:28, width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto', fontFamily:font }}
      >
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:C.white }}>⚡ Upgrade Plan</div>
            {triggerReason && <div style={{ fontSize:12, color:C.gold, marginTop:3 }}>{triggerReason}</div>}
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', color:C.gray, fontSize:16, fontFamily:font }}>✕</button>
        </div>

        {/* Billing cycle toggle */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:20, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 14px' }}>
          <span style={{ fontSize:13, color: !isAnnual ? C.white : C.gray, fontWeight: !isAnnual ? 600 : 400 }}>Monthly</span>
          <div
            onClick={() => setIsAnnual(a => !a)}
            style={{ width:44, height:24, borderRadius:12, background: isAnnual ? C.primary : 'rgba(255,255,255,0.15)', cursor:'pointer', position:'relative', transition:'background .2s' }}
          >
            <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: isAnnual ? 23 : 3, transition:'left .2s' }}/>
          </div>
          <span style={{ fontSize:13, color: isAnnual ? C.white : C.gray, fontWeight: isAnnual ? 600 : 400 }}>
            Annual <span style={{ background:'rgba(16,185,129,0.2)', color:C.success, fontSize:10, padding:'2px 6px', borderRadius:10, fontWeight:700, marginLeft:4 }}>Save 20%</span>
          </span>
        </div>

        {/* Plan selector */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {Object.entries(PLANS).filter(([k, v]) => ['single','multiple'].includes(k) && typeof v === 'object').map(([key, p]) => (
            <div
              key={key}
              onClick={() => setSelectedPlan(key)}
              style={{
                border:`2px solid ${selectedPlan===key ? C.primary : C.border}`,
                borderRadius:12, padding:'14px 16px', cursor:'pointer',
                background: selectedPlan===key ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.03)',
                position:'relative',
              }}
            >
              {p.highlight && (
                <div style={{ position:'absolute', top:-10, right:12, background:C.primary, color:'#fff', fontSize:9, fontWeight:700, padding:'2px 10px', borderRadius:20 }}>MOST POPULAR</div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:C.white }}>{p.label}</div>
                    {selectedPlan===key && <span style={{ fontSize:10, background:'rgba(108,99,255,0.3)', color:C.accent, padding:'2px 8px', borderRadius:20 }}>Selected</span>}
                  </div>
                  <div style={{ fontSize:12, color:C.gray }}>{p.description}</div>
                  <div style={{ fontSize:11, color:C.gray2, marginTop:6 }}>
                    {p.vs === Infinity ? 'Unlimited' : p.vs} VS · {p.contacts === Infinity ? 'Unlimited' : Number(p.contacts).toLocaleString('en-IN')} contacts
                    {p.extraVS > 0 && ` · +₹${Number(p.extraVS).toLocaleString('en-IN')}/mo per extra VS`}
                  </div>
                </div>
                <div style={{ textAlign:'right', minWidth:90, paddingLeft:12 }}>
                  <div style={{ fontSize:18, fontWeight:800, color: selectedPlan===key ? C.accent : C.white }}>
                    ₹{isAnnual ? Math.round(Number(p.basePrice) * 0.8).toLocaleString('en-IN') : Number(p.basePrice).toLocaleString('en-IN')}
                  </div>
                  {isAnnual
                    ? <div style={{ fontSize:10, color:C.success }}>per month (annual)</div>
                    : <div style={{ fontSize:10, color:C.gray2 }}>/month</div>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* VS count for Multiple */}
        {selectedPlan === 'multiple' && (
          <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ fontSize:13, color:C.gray, marginBottom:10 }}>Number of Vidhan Sabhas</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={() => setVsCount(v => Math.max(2, v-1))} style={{ width:32, height:32, borderRadius:'50%', border:`1px solid ${C.border2}`, background:'transparent', color:C.white, fontSize:18, cursor:'pointer', fontFamily:font }}>−</button>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:800, color:C.white }}>{vsCount}</div>
                <div style={{ fontSize:11, color:C.gray2 }}>Vidhan Sabhas</div>
              </div>
              <button onClick={() => setVsCount(v => v+1)} style={{ width:32, height:32, borderRadius:'50%', border:`1px solid ${C.border2}`, background:'transparent', color:C.white, fontSize:18, cursor:'pointer', fontFamily:font }}>+</button>
            </div>
          </div>
        )}

        {/* Coupon */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:C.gray, marginBottom:8, fontWeight:500 }}>Have a coupon code?</div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              type="text" placeholder="Enter coupon code"
              value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponResult(null) }}
              style={{ flex:1, padding:'10px 12px', fontSize:13, background:'rgba(255,255,255,0.05)', border:`1px solid ${couponResult?.valid ? C.success : couponResult ? C.red : C.border}`, borderRadius:8, color:C.white, fontFamily:font, outline:'none' }}
            />
            <button onClick={handleCoupon} disabled={couponLoading || !coupon.trim()} style={{ padding:'10px 16px', fontSize:13, fontWeight:600, background:'rgba(108,99,255,0.2)', border:`1px solid ${C.border2}`, borderRadius:8, color:C.accent, cursor:'pointer', fontFamily:font }}>
              {couponLoading ? '...' : 'Apply'}
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
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.gray }}>
              <span>{PLANS[selectedPlan]?.label} Plan {selectedPlan==='multiple' ? `(${vsCount} VS)` : ''}</span>
              <span>₹{Number(breakdown.base).toLocaleString('en-IN')}</span>
            </div>
            {breakdown.discount > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.success }}>
                <span>Discount ({discountPct}%)</span>
                <span>−₹{Number(breakdown.discount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.gray }}>
              <span>GST ({Math.round(gstRate * 100)}%)</span>
              <span>₹{Number(breakdown.gst).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ height:'1px', background:C.border, margin:'6px 0' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:800, color:C.white }}>
              <span>Total</span>
              <span style={{ color:C.accent }}>
                {isFree ? '₹0' : `₹${Number(breakdown.total).toLocaleString('en-IN')}`}
                <span style={{ fontSize:11, fontWeight:400, color:C.gray2 }}>/month</span>
              </span>
            </div>
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
            background: payLoading ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg,${C.primary},${C.primaryD})`,
            border:'none', borderRadius:12,
            color: payLoading ? C.gray : C.white,
            cursor: payLoading ? 'not-allowed' : 'pointer',
            fontFamily:font,
            boxShadow: payLoading ? 'none' : `0 8px 24px rgba(108,99,255,0.4)`,
          }}
        >
          {payLoading ? '⏳ Processing...' : isFree ? '🎁 Activate Free Plan' : isAnnual ? `Pay ₹${Number(breakdown.totalPaise/100).toLocaleString('en-IN')} for 12 months →` : `Pay ₹${Number(breakdown.total).toLocaleString('en-IN')}/month →`}
        </button>

        <div style={{ fontSize:11, color:C.gray2, textAlign:'center', marginTop:12, lineHeight:1.6 }}>
          🔒 Secured by Razorpay · GST invoice will be sent to {customer?.email}
        </div>
      </div>
    </div>,
    document.body
  )
}
