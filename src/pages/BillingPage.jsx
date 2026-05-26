// ─── src/pages/BillingPage.jsx ────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { PLANS as DEFAULT_PLANS, calcPriceBreakdown } from '../config'
import { fetchBillingHistory, formatPaise } from '../lib/razorpay'
import UpgradeModal from '../components/UpgradeModal'

const C = {
  bg:'#0F0E1A', bgCard:'#16152A', bgCard2:'#1C1B35',
  border:'rgba(255,255,255,0.08)', border2:'rgba(255,255,255,0.15)',
  primary:'#6C63FF', accent:'#A78BFA', white:'#FFFFFF',
  gray:'#9CA3AF', gray2:'#6B7280', success:'#10B981',
  red:'#EF4444', gold:'#F59E0B', text:'#F1F0FF',
}
const font = "system-ui,-apple-system,'Segoe UI',sans-serif"

const STATUS_STYLE = {
  paid:    { bg:'rgba(16,185,129,0.15)', cl:'#10B981', label:'Paid' },
  pending: { bg:'rgba(245,158,11,0.15)', cl:'#F59E0B', label:'Pending' },
  failed:  { bg:'rgba(239,68,68,0.15)',  cl:'#EF4444', label:'Failed' },
  refunded:{ bg:'rgba(107,114,128,0.15)',cl:'#9CA3AF', label:'Refunded' },
}

export default function BillingPage({ onBack, workspaceCount = 1 }) {
  const { customer, plan, planLimits, livePlans } = useAuth()
  const activePlanConfig = (livePlans || {})[plan] || planLimits
  const [history,       setHistory]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showUpgrade,   setShowUpgrade]   = useState(false)

  useEffect(() => {
    if (!customer?.id) return
    fetchBillingHistory(customer.id)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [customer?.id])

  const isGifted   = customer?.gifted_forever
  const PLANS      = livePlans || DEFAULT_PLANS
  const planConfig = PLANS[plan] || PLANS.free
  const expiry     = customer?.plan_expiry ? new Date(customer.plan_expiry) : null
  const daysLeft   = expiry ? Math.ceil((expiry - new Date()) / 86400000) : null

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:font, color:C.text, padding:'0 0 60px' }}>

      {/* Header */}
      <div style={{ padding:'20px 20px 0', maxWidth:800, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${C.primary},#4F46E5)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>💳</div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:C.white }}>Billing & Subscription</div>
              <div style={{ fontSize:11, color:C.accent }}>Sampark.AI</div>
            </div>
          </div>
          <button onClick={onBack} style={{ padding:'8px 16px', fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.08)', border:`1px solid ${C.border}`, borderRadius:8, color:C.gray, cursor:'pointer', fontFamily:font }}>
            ← Back
          </button>
        </div>

        {/* Current plan card */}
        <div style={{ background:C.bgCard, border:`1px solid ${C.border2}`, borderRadius:16, padding:24, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:12, color:C.gray, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Current Plan</div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <div style={{ fontSize:24, fontWeight:800, color:C.white }}>{planConfig.label}</div>
                {isGifted && (
                  <span style={{ background:'rgba(245,158,11,0.2)', color:C.gold, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(245,158,11,0.3)' }}>
                    🎁 Gifted Forever
                  </span>
                )}
                {!isGifted && plan !== 'free' && (
                  <span style={{ background:'rgba(16,185,129,0.15)', color:C.success, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                    Active
                  </span>
                )}
              </div>
              {isGifted && customer?.gifted_note && (
                <div style={{ fontSize:12, color:C.gray, fontStyle:'italic' }}>"{customer.gifted_note}"</div>
              )}
              {!isGifted && expiry && (
                <div style={{ fontSize:12, color: daysLeft <= 7 ? C.gold : C.gray }}>
                  {daysLeft > 0 ? `Renews in ${daysLeft} days (${expiry.toLocaleDateString('en-IN')})` : 'Plan expired'}
                </div>
              )}
              {plan === 'free' && !isGifted && (
                <div style={{ fontSize:12, color:C.gray }}>
                  {planLimits?.contacts === Infinity ? 'Unlimited' : Number(planLimits?.contacts || 0).toLocaleString('en-IN')} contact limit · Upgrade to unlock unlimited
                </div>
              )}
            </div>
            <div style={{ textAlign:'right' }}>
              {!isGifted && (
                <>
                  <div style={{ fontSize:28, fontWeight:800, color:C.white }}>
                    {plan === 'free' ? '₹0' : `₹${calcPriceBreakdown(plan, workspaceCount).total.toLocaleString('en-IN')}`}
                  </div>
                  <div style={{ fontSize:11, color:C.gray2 }}>
                    {plan === 'free' ? 'Free forever' : `incl. GST · ${workspaceCount} VS`}
                  </div>
                </>
              )}
              {isGifted && (
                <div style={{ fontSize:22, fontWeight:800, color:C.gold }}>₹0</div>
              )}
            </div>
          </div>

          {/* Plan features */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
            {[
              ['Vidhan Sabhas', planConfig.vs === Infinity ? 'Unlimited' : planConfig.vs],
              ['Contacts', planConfig.contacts === Infinity ? 'Unlimited' : Number(planConfig.contacts || 0).toLocaleString('en-IN')],
              ['Billing', isGifted ? 'Gifted' : plan === 'free' ? 'Free' : 'Monthly'],
            ].map(([label, value]) => (
              <div key={label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.white }}>{value}</div>
                <div style={{ fontSize:11, color:C.gray2, marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Upgrade button */}
          {!isGifted && plan === 'free' && (
            <button onClick={() => setShowUpgrade(true)} style={{ marginTop:16, width:'100%', padding:'11px', fontSize:14, fontWeight:700, background:`linear-gradient(135deg,${C.primary},#4F46E5)`, border:'none', borderRadius:10, color:'#fff', cursor:'pointer', fontFamily:font }}>
              ⚡ Upgrade Plan
            </button>
          )}
        </div>

        {/* Billing history */}
        <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.white, marginBottom:16 }}>Billing History</div>

          {loading ? (
            <div style={{ textAlign:'center', color:C.gray, padding:30 }}>⏳ Loading...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign:'center', padding:30 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
              <div style={{ fontSize:14, color:C.gray }}>No billing history yet</div>
              <div style={{ fontSize:12, color:C.gray2, marginTop:4 }}>Your payment records will appear here</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {history.map(h => {
                const ss = STATUS_STYLE[h.status] || STATUS_STYLE.pending
                return (
                  <div key={h.id} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.white }}>
                          {h.plan === 'premium' ? 'Premium' : h.plan === 'free_forever' ? 'Free Forever' : 'Free'} Plan
                          {h.vs_count > 1 && ` (${h.vs_count} VS)`}
                        </div>
                        <span style={{ background:ss.bg, color:ss.cl, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{ss.label}</span>
                        {h.coupon_used && (
                          <span style={{ background:'rgba(167,139,250,0.15)', color:C.accent, fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>
                            🏷 {h.coupon_used}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:C.gray2 }}>
                        {h.paid_at ? new Date(h.paid_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : new Date(h.created_at).toLocaleDateString('en-IN')}
                        {h.razorpay_payment_id && ` · ${h.razorpay_payment_id}`}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:15, fontWeight:800, color: h.status==='paid' ? C.success : C.white }}>
                        {formatPaise(h.amount_total || 0)}
                      </div>
                      {h.discount_pct > 0 && (
                        <div style={{ fontSize:10, color:C.accent }}>{h.discount_pct}% off applied</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          currentVSCount={workspaceCount}
        />
      )}
    </div>
  )
}
