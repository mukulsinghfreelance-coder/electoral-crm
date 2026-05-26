import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { PLANS } from '../config'
import { supabase } from '../lib/supabase'
import {
  adminFetchAllCustomers,
  adminFetchCustomerWorkspaces,
  adminUpdateCustomerPlan,
  adminDeleteWorkspace,
  adminPurgeCustomer,
  adminGiftCustomer,
  adminRevokeGift,
  adminFetchCoupons,
  adminCreateCoupon,
  adminToggleCoupon,
} from '../lib/supabase'

const C = {
  primary:'#4F46E5', primaryDark:'#3730A3', primaryLight:'#EEF2FF',
  success:'#059669', successLight:'#D1FAE5',
  red:'#DC2626', redLight:'#FEE2E2',
  amber:'#D97706', amberLight:'#FEF3C7', gold:'#F59E0B',
  gray100:'#F3F4F6', gray200:'#E5E7EB', gray400:'#9CA3AF',
  gray600:'#4B5563', gray900:'#111827', white:'#FFFFFF',
}

const PLAN_COLORS = {
  free:         { bg:'#F3F4F6', cl:'#4B5563' },
  premium:      { bg:'#EEF2FF', cl:'#3730A3' },
  free_forever: { bg:'#FEF3C7', cl:'#92400E' },
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, subtext, onConfirm, onCancel, danger }) {
  return createPortal(
    <div onClick={onCancel} style={{
      position:'fixed', inset:0, background:'rgba(17,24,39,.7)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:99999, padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:C.white, borderRadius:16, padding:'28px 24px',
        maxWidth:380, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,.25)',
        textAlign:'center',
      }}>
        <div style={{ fontSize:40, marginBottom:12 }}>{danger ? '⚠️' : '❓'}</div>
        <div style={{ fontSize:16, fontWeight:800, color:C.gray900, marginBottom:8 }}>{message}</div>
        {subtext && <div style={{ fontSize:13, color:C.gray600, marginBottom:20, lineHeight:1.6 }}>{subtext}</div>}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:'11px', fontSize:14, fontWeight:600,
            background:C.gray100, border:'none', borderRadius:10,
            cursor:'pointer', fontFamily:'inherit', color:C.gray600,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex:1, padding:'11px', fontSize:14, fontWeight:700,
            background: danger ? C.red : C.primary,
            color:C.white, border:'none', borderRadius:10,
            cursor:'pointer', fontFamily:'inherit',
          }}>{danger ? 'Yes, Delete' : 'Confirm'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}


// ─── CUSTOMER ROW (expanded detail) ──────────────────────────────────────────
function CustomerDetail({ customer, onPlanChanged, onWSDeleted, onPurged, me }) {
  const [workspaces, setWorkspaces] = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [confirm,    setConfirm]    = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    setLoading(true)
    adminFetchCustomerWorkspaces(customer.id)
      .then(ws => setWorkspaces(ws || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [customer.id])

  const [giftNote, setGiftNote] = useState('')
  const [showGiftNote, setShowGiftNote] = useState(false)

  const handleGift = async () => {
    if (customer.plan === 'free_forever') {
      // Revoke gift
      setConfirm({
        message: `Revoke Free Forever for ${customer.name || customer.email}?`,
        subtext: 'Their plan will drop back to Free.',
        danger: true,
        onConfirm: async () => {
          try {
            await adminRevokeGift(customer.id)
            onPlanChanged(customer.id, 'free')
            customer.plan = 'free'
            customer.gifted_forever = false
          } catch(e) { setDeleteError(e.message) }
          setConfirm(null)
        }
      })
    } else {
      setShowGiftNote(true)
    }
  }

  const confirmGift = async () => {
    try {
      await adminGiftCustomer(customer.id, giftNote, me?.email)
      onPlanChanged(customer.id, 'free_forever')
      customer.plan = 'free_forever'
      customer.gifted_forever = true
      setShowGiftNote(false)
      setGiftNote('')
    } catch(e) { setDeleteError(e.message) }
  }

  const handleDeleteWS = (ws) => {
    setConfirm({
      type: 'ws',
      message: `Remove ${ws.vs}?`,
      subtext: `This will permanently delete all contacts, booths and settings for ${ws.vs}. This cannot be undone.`,
      onConfirm: async () => {
        try {
          await adminDeleteWorkspace(ws.id)
          setWorkspaces(prev => prev.filter(w => w.id !== ws.id))
          onWSDeleted(customer.id, ws.id)
          setConfirm(null)
          // Reload workspaces from DB to ensure fresh data
          const fresh = await adminFetchCustomerWorkspaces(customer.id)
          setWorkspaces(fresh || [])
        } catch(e) {
          console.error('Delete WS error:', e)
          setConfirm(null)
          let msg = e?.message || 'Failed to delete'
          if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
            msg = '🌐 Network error — please check your internet connection.'
          }
          setDeleteError(msg)
        }
      }
    })
  }

  const handlePurge = () => {
    setConfirm({
      type: 'purge',
      message: `Purge ${customer.name || customer.email}?`,
      subtext: `This will permanently delete the customer and ALL their data — every constituency, contact, booth. Cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        try {
          await adminPurgeCustomer(customer.id)
          onPurged(customer.id)
        } catch(e) {
          console.error('Purge error:', e)
          setConfirm(null)
          let msg = e?.message || 'Purge failed'
          if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
            msg = '🌐 Network error — please check your internet connection.'
          }
          setDeleteError(msg)
        }
      }
    })
  }

  const pc = PLAN_COLORS[customer.plan] || PLAN_COLORS.free

  return (
    <div style={{ borderTop:`1px solid ${C.gray100}`, padding:'16px 20px', background:'#FAFAFA' }}>

      {/* Plan + actions row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ background:pc.bg, color:pc.cl, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>
            {PLANS[customer.plan]?.label || customer.plan}
          </span>
          <span style={{ fontSize:12, color:C.gray400 }}>
            Joined {new Date(customer.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
          </span>
        </div>
        <div style={{ display:'flex', gap:8 }}>

          {/* Gift Forever only for Free accounts */}
          {(customer.plan === 'free' || customer.plan === 'free_forever') && (
            <button onClick={handleGift} style={{
              padding:'6px 14px', fontSize:12, fontWeight:700,
              background: customer.plan === 'free_forever' ? C.amberLight : C.successLight,
              color: customer.plan === 'free_forever' ? C.amber : C.success,
              border:`1px solid ${customer.plan === 'free_forever' ? C.amber : C.success}33`,
              borderRadius:8, cursor:'pointer', fontFamily:'inherit',
            }}>
              {customer.plan === 'free_forever' ? '🎁 Revoke Gift' : '🎁 Gift Forever'}
            </button>
          )}
          {/* Don't show Purge for gifted/free_forever accounts */}
          {customer.plan !== 'free_forever' && (
            <button onClick={handlePurge} style={{
              padding:'6px 14px', fontSize:12, fontWeight:700,
              background:C.redLight, color:C.red,
              border:`1px solid ${C.red}33`, borderRadius:8, cursor:'pointer', fontFamily:'inherit',
            }}>
              🗑️ Purge User
            </button>
          )}
        </div>
      </div>

      {/* Workspaces */}
      {deleteError && (
        <div style={{ background:'#FEE2E2', borderRadius:8, padding:'10px 12px', marginBottom:12, fontSize:12, color:'#991B1B', fontWeight:500 }}>
          ⚠ {deleteError}
          <button onClick={() => setDeleteError('')} style={{ float:'right', background:'none', border:'none', cursor:'pointer', color:'#991B1B', fontSize:14 }}>✕</button>
        </div>
      )}
      <div style={{ fontSize:11, fontWeight:700, color:C.gray400, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
        Constituencies ({workspaces?.length || 0})
      </div>

      {loading ? (
        <div style={{ fontSize:12, color:C.gray400, padding:'8px 0' }}>⏳ Loading…</div>
      ) : workspaces?.length === 0 ? (
        <div style={{ fontSize:12, color:C.gray400, padding:'8px 0' }}>No constituencies added yet</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {workspaces?.map(ws => (
            <div key={ws.id} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              background:C.white, border:`1px solid ${C.gray200}`, borderRadius:10,
              padding:'10px 14px',
            }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.gray900 }}>🏛️ {ws.vs}</div>
                <div style={{ fontSize:11, color:C.gray400, marginTop:2 }}>{ws.ls} · {ws.state}</div>
              </div>
              <button onClick={() => handleDeleteWS(ws)} style={{
                padding:'5px 12px', fontSize:11, fontWeight:700,
                background:C.redLight, color:C.red,
                border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit',
              }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {showGiftNote && createPortal(
        <div onClick={() => setShowGiftNote(false)} style={{ position:'fixed', inset:0, background:'rgba(17,24,39,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999, padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:380, width:'100%' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#111', marginBottom:6 }}>🎁 Gift Forever</div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:16 }}>
              Gifting <strong>{customer.name || customer.email}</strong> unlimited Multiple plan access permanently.
            </div>
            <input
              placeholder="Note (e.g. Campaign partner - 6 months)"
              value={giftNote} onChange={e => setGiftNote(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1px solid #E5E7EB', borderRadius:8, fontFamily:'inherit', boxSizing:'border-box', marginBottom:16 }}
            />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowGiftNote(false)} style={{ flex:1, padding:10, background:'#F3F4F6', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Cancel</button>
              <button onClick={confirmGift} style={{ flex:1, padding:10, background:'#10B981', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700 }}>Confirm Gift</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          subtext={confirm.subtext}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}


    </div>
  )
}


// ─── PRICING PANEL ────────────────────────────────────────────────────────────
function PricingPanel() {
  const [pricing, setPricing] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(null)
  const [saved,   setSaved]   = useState(null)

  const LABELS = {
    free_contact_limit:    { label:'Free Plan — Contact Limit',      unit:'contacts',     desc:'Max contacts for Free users',                  type:'number' },
    premium_base_price:    { label:'Premium — First VS Price',       unit:'₹/month',      desc:'Price for first paid constituency',             type:'number' },
    premium_extra_vs:      { label:'Premium — Extra VS Price',       unit:'₹/month',      desc:'Price per additional constituency',             type:'number' },
    premium_extra_pct:     { label:'Premium — Extra VS Discount',    unit:'%',            desc:'Discount % shown to customers (display only)', type:'number' },
    gst_rate:              { label:'GST Rate',                       unit:'%',            desc:'GST on all paid plans',                        type:'number' },
    free_forever_vs_limit: { label:'Free Forever — Max VS',          unit:'Vidhan Sabha', desc:'Max constituencies for gifted accounts',       type:'number' },
    annual_billing_enabled:{ label:'Annual Billing — Enable',        unit:'toggle',       desc:'Show annual billing toggle to customers',      type:'toggle' },
    annual_discount_pct:   { label:'Annual Billing — Discount',      unit:'%',            desc:'Discount for annual billing',                  type:'number' },
  }

  useEffect(() => {
    supabase.from('pricing_config').select('*').order('key')
      .then(({ data }) => { setPricing(data || []); setLoading(false) })
  }, [])

  const handleSave = async (key, value) => {
    setSaving(key); setSaved(null)
    const { error } = await supabase
      .from('pricing_config')
      .update({ value: Number(value), updated_at: new Date().toISOString() })
      .eq('key', key)
    if (!error) {
      // Update local state so toggle re-renders immediately
      setPricing(prev => prev.map(p => p.key === key ? { ...p, value: Number(value) } : p))
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    }
    setSaving(null)
  }

  if (loading) return <div style={{ textAlign:'center', color:'#9CA3AF', padding:30 }}>⏳ Loading...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {pricing.map(p => {
        const meta = LABELS[p.key] || { label:p.key, unit:'', desc:'' }
        return (
          <div key={p.key} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:2 }}>{meta.label}</div>
                <div style={{ fontSize:12, color:'#6B7280' }}>{meta.desc}</div>
              </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {meta.type === 'toggle' ? (
                  <div
                    onClick={() => handleSave(p.key, p.value === 1 ? 0 : 1)}
                    style={{ width:48, height:26, borderRadius:13, background: p.value === 1 ? '#4F46E5' : '#E5E7EB', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}
                  >
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: p.value === 1 ? 25 : 3, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                  </div>
                ) : (
                  <input
                    type="number"
                    defaultValue={p.value}
                    onBlur={e => handleSave(p.key, e.target.value)}
                    style={{ width:90, padding:'7px 10px', fontSize:14, fontWeight:600, border:'1px solid #E5E7EB', borderRadius:8, textAlign:'right', fontFamily:'inherit', outline:'none' }}
                  />
                )}
                {meta.unit !== 'toggle' && (
                  <span style={{ fontSize:12, color:'#6B7280', minWidth:50 }}>{meta.unit}</span>
                )}
                {saving === p.key && <span style={{ fontSize:12, color:'#6B7280' }}>⏳</span>}
                {saved  === p.key && <span style={{ fontSize:12, color:'#10B981' }}>✓ Saved</span>}
              </div>
            </div>
          </div>
        )
      })}
      <div style={{ fontSize:12, color:'#6B7280', textAlign:'center', marginTop:8 }}>
        Changes take effect immediately for new payments. Existing subscriptions are not affected.
      </div>
    </div>
  )
}

// ─── MAIN SUPER ADMIN PAGE ────────────────────────────────────────────────────
export default function SuperAdminPage({ onBack }) {
  const { customer: me } = useAuth()
  const [customers,   setCustomers]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [search,      setSearch]      = useState('')
  const [expanded,    setExpanded]    = useState(null)
  const [filterPlan,  setFilterPlan]  = useState('all')
  const [activeTab,   setActiveTab]   = useState('customers')  // customers | pricing | coupons

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminFetchAllCustomers()
      setCustomers(data || [])
    } catch(e) {
      console.error('Admin load error:', e)
      setError(e.message || 'Failed to load customers')
    }
    setLoading(false)
  }

  const handlePlanChanged = (customerId, newPlan) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, plan: newPlan } : c))
  }

  const handleWSDeleted = (customerId, wsId) => {
    // Just refresh — workspace count will update on next expand
  }

  const handlePurged = (customerId) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId))
    setExpanded(null)
  }

  // Filter
  const filtered = customers.filter(c => {
    const matchSearch = !search ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.name?.toLowerCase().includes(search.toLowerCase())
    const matchPlan = filterPlan === 'all' || c.plan === filterPlan
    return matchSearch && matchPlan
  })

  // Stats
  const stats = {
    total:        customers.length,
    free:         customers.filter(c => c?.plan === 'free').length,
    premium:      customers.filter(c => c?.plan === 'premium').length,
    free_forever: customers.filter(c => c?.plan === 'free_forever').length,
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4F46E5 100%)',
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
      padding:'0 0 60px',
    }}>

      {/* ── HEADER ── */}
      <div style={{ padding:'20px 20px 0', maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🛡️</div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>Super Admin</div>
              <div style={{ fontSize:11, color:'#A5B4FC' }}>ContactBook Control Panel</div>
            </div>
          </div>
          <button onClick={onBack} style={{
            padding:'8px 16px', fontSize:12, fontWeight:600,
            background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)',
            borderRadius:8, color:'#C7D2FE', cursor:'pointer', fontFamily:'inherit',
          }}>
            ← Back to Dashboard
          </button>
        </div>

        {/* ── STATS CARDS ── */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24,
        }}>
          {[
            ['Total',        stats.total,        '#818CF8', '👥'],
            ['Free',         stats.free,         '#9CA3AF', '🆓'],
            ['Premium',      stats.premium,      '#A78BFA', '⭐'],
            ['Free Forever', stats.free_forever, '#F59E0B', '🎁'],
          ].map(([label, val, color, icon]) => (
            <div key={label} style={{
              background:'rgba(255,255,255,.1)', backdropFilter:'blur(10px)',
              border:'1px solid rgba(255,255,255,.2)', borderRadius:14,
              padding:'16px', textAlign:'center',
            }}>
              <div style={{ fontSize:10, color:'#A5B4FC', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{icon} {label}</div>
              <div style={{ fontSize:28, fontWeight:800, color:'#fff' }}>{loading ? '…' : val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 20px', marginBottom:0 }}>
        <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.06)', borderRadius:12, padding:4, marginBottom:20 }}>
          {[
            { key:'customers', label:'👥 Customers' },
            { key:'pricing',   label:'💰 Pricing'   },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex:1, padding:'9px', fontSize:13, fontWeight:600, border:'none', borderRadius:9,
              background: activeTab===tab.key ? '#fff' : 'transparent',
              color: activeTab===tab.key ? '#111827' : '#A5B4FC',
              cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Pricing tab */}
        {activeTab === 'pricing' && <PricingPanel/>}
      </div>

      {/* ── CUSTOMER LIST ── */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 20px', display: activeTab==='customers' ? 'block' : 'none' }}>

        {/* Search + filter */}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <input
            placeholder="🔍 Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex:1, padding:'10px 14px', fontSize:13,
              border:'none', borderRadius:10, outline:'none',
              fontFamily:'inherit', color:C.gray900,
            }}
          />
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            style={{
              padding:'10px 14px', fontSize:13, border:'none',
              borderRadius:10, outline:'none', fontFamily:'inherit',
              color:C.gray900, cursor:'pointer', background:C.white,
            }}
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="single">Single</option>
            <option value="multiple">Multiple</option>
          </select>
        </div>

        {/* Customer cards */}
        {error ? (
          <div style={{ background:'#FEE2E2', borderRadius:12, padding:24, textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:8 }}>⚠️</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#991B1B', marginBottom:4 }}>Failed to load customers</div>
            <div style={{ fontSize:12, color:'#DC2626', marginBottom:16 }}>{error}</div>
            <button onClick={loadCustomers} style={{ padding:'8px 20px', fontSize:13, fontWeight:600, background:'#DC2626', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit' }}>
              Retry
            </button>
          </div>
        ) : loading ? (
          <div style={{ textAlign:'center', color:'#A5B4FC', padding:60 }}>⏳ Loading customers…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', color:'#A5B4FC', padding:60 }}>No customers found</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(c => {
              const isMe = c.email === me?.email
              const isExpanded = expanded === c.id
              const pc = PLAN_COLORS[c?.plan] || PLAN_COLORS.free
              return (
                <div key={c.id} style={{
                  background:C.white, borderRadius:16,
                  boxShadow:'0 2px 12px rgba(0,0,0,.08)', overflow:'hidden',
                }}>
                  {/* Row */}
                  <div
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                    style={{
                      padding:'14px 20px', display:'flex', alignItems:'center',
                      justifyContent:'space-between', cursor:'pointer',
                      background: isMe ? '#FFFBEB' : C.white,
                      gap:12,
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
                      {/* Avatar */}
                      <div style={{
                        width:40, height:40, borderRadius:'50%', flexShrink:0,
                        background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:16, color:'#fff', fontWeight:700,
                      }}>
                        {((c.name || c.email || '?')[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:C.gray900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {c.name || '—'}
                          </div>
                          {isMe && <span style={{ fontSize:10, background:'#FEF3C7', color:'#92400E', padding:'2px 8px', borderRadius:20, fontWeight:700, flexShrink:0 }}>YOU</span>}
                        </div>
                        <div style={{ fontSize:12, color:C.gray400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.email}</div>
                      </div>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                      <span style={{ background:pc.bg, color:pc.cl, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                        {PLANS[c.plan]?.label || c.plan}
                      </span>
                      {c.plan === 'free_forever' && (
                        <span style={{ background:'rgba(245,158,11,0.15)', color:'#F59E0B', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                          🎁 Free Forever
                        </span>
                      )}
                      <span style={{ fontSize:18, color:C.gray400, transition:'transform .2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>›</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <CustomerDetail
                      customer={c}
                      onPlanChanged={handlePlanChanged}
                      onWSDeleted={handleWSDeleted}
                      onPurged={handlePurged}
                      me={me}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
