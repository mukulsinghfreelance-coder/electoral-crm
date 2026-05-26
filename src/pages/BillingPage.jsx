// src/pages/BillingPage.jsx — Payment History
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { PLANS as DEFAULT_PLANS } from '../config'
import { fetchBillingHistory, formatPaise } from '../lib/razorpay'

const C = {
  bg:'#0F0E1A', bgCard:'#16152A', bgCard2:'#1C1B35',
  border:'rgba(255,255,255,0.08)', border2:'rgba(255,255,255,0.15)',
  primary:'#6C63FF', accent:'#A78BFA', white:'#FFFFFF',
  gray:'#9CA3AF', gray2:'#6B7280', success:'#10B981',
  red:'#EF4444', gold:'#F59E0B', text:'#F1F0FF',
}
const font = "system-ui,-apple-system,'Segoe UI',sans-serif"

const STATUS_STYLE = {
  paid:    { bg:'rgba(16,185,129,0.15)',  cl:'#10B981', label:'Paid' },
  pending: { bg:'rgba(245,158,11,0.15)',  cl:'#F59E0B', label:'Pending' },
  failed:  { bg:'rgba(239,68,68,0.15)',   cl:'#EF4444', label:'Failed' },
  refunded:{ bg:'rgba(107,114,128,0.15)', cl:'#9CA3AF', label:'Refunded' },
}

export default function PaymentHistory({ onBack }) {
  const { customer, plan, planLimits, livePlans, paidVsCount } = useAuth()
  const PLANS    = livePlans || DEFAULT_PLANS
  const isGifted = plan === 'free_forever'

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customer?.id) return
    fetchBillingHistory(customer.id)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [customer?.id])

  const planConfig = PLANS[plan] || PLANS.free
  const expiry     = customer?.plan_expiry ? new Date(customer.plan_expiry) : null
  const daysLeft   = expiry ? Math.ceil((expiry - new Date()) / 86400000) : null

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:font, color:C.text, padding:'0 0 60px' }}>

      {/* Header */}
      <div style={{ padding:'20px 20px 0', maxWidth:800, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${C.primary},#4F46E5)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📜</div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:C.white }}>Payment History</div>
              <div style={{ fontSize:11, color:C.accent }}>Sampark.AI</div>
            </div>
          </div>
          <button onClick={onBack} style={{ padding:'8px 16px', fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.08)', border:`1px solid ${C.border}`, borderRadius:8, color:C.gray, cursor:'pointer', fontFamily:font }}>
            ← Back
          </button>
        </div>

        {/* Current plan summary */}
        <div style={{ background:C.bgCard, border:`1px solid ${C.border2}`, borderRadius:16, padding:20, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:C.gray, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Current Plan</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:22, fontWeight:800, color:C.white }}>{planConfig.label}</div>
                {isGifted && (
                  <span style={{ background:'rgba(245,158,11,0.2)', color:C.gold, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(245,158,11,0.3)' }}>
                    🎁 Free Forever
                  </span>
                )}
                {plan === 'premium' && (
                  <span style={{ background:'rgba(16,185,129,0.15)', color:C.success, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                    Active
                  </span>
                )}
              </div>
              {isGifted && customer?.gifted_note && (
                <div style={{ fontSize:12, color:C.gray, fontStyle:'italic', marginTop:4 }}>"{customer.gifted_note}"</div>
              )}
              {plan === 'premium' && expiry && (
                <div style={{ fontSize:12, color: daysLeft <= 7 ? C.gold : C.gray, marginTop:4 }}>
                  {daysLeft > 0 ? `Renews in ${daysLeft} days (${expiry.toLocaleDateString('en-IN')})` : '⚠ Plan expired'}
                </div>
              )}
              {plan === 'free' && (
                <div style={{ fontSize:12, color:C.gray, marginTop:4 }}>
                  {Number(planLimits?.contacts || 500).toLocaleString('en-IN')} contact limit
                </div>
              )}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
                {[
                  ['Constituencies', paidVsCount || (isGifted ? '≤10' : plan === 'free' ? 1 : 0)],
                  ['Contacts', planLimits?.contacts === Infinity ? 'Unlimited' : Number(planLimits?.contacts || 500).toLocaleString('en-IN')],
                ].map(([label, value]) => (
                  <div key={label} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:700, color:C.white }}>{value}</div>
                    <div style={{ fontSize:10, color:C.gray2, marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.white, marginBottom:16 }}>Payment History</div>

          {loading ? (
            <div style={{ textAlign:'center', color:C.gray, padding:30 }}>⏳ Loading...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign:'center', padding:40 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📄</div>
              <div style={{ fontSize:15, fontWeight:600, color:C.white, marginBottom:6 }}>No payments yet</div>
              <div style={{ fontSize:13, color:C.gray2 }}>Your payment records will appear here</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {history.map(h => {
                const ss = STATUS_STYLE[h.status] || STATUS_STYLE.pending
                const planLabel = h.plan === 'premium' ? 'Premium' : h.plan === 'free_forever' ? 'Free Forever' : 'Free'
                return (
                  <div key={h.id} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.white }}>
                          {planLabel} Plan
                          {h.vs_count > 0 && ` · ${h.vs_count} VS`}
                        </div>
                        <span style={{ background:ss.bg, color:ss.cl, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{ss.label}</span>
                        {h.coupon_used && (
                          <span style={{ background:'rgba(167,139,250,0.15)', color:C.accent, fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>
                            🏷 {h.coupon_used}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:C.gray2 }}>
                        {h.paid_at
                          ? new Date(h.paid_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                          : new Date(h.created_at).toLocaleDateString('en-IN')}
                        {h.razorpay_payment_id && (
                          <span style={{ marginLeft:8, color:'rgba(255,255,255,0.2)', fontFamily:'monospace', fontSize:10 }}>{h.razorpay_payment_id}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:16, fontWeight:800, color: h.status==='paid' ? C.success : C.white }}>
                        {formatPaise(h.amount_total || 0)}
                      </div>
                      {h.discount_pct > 0 && (
                        <div style={{ fontSize:10, color:C.accent }}>{h.discount_pct}% discount applied</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
