import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { PLANS } from '../config'
import {
  adminFetchAllCustomers,
  adminFetchCustomerWorkspaces,
  adminUpdateCustomerPlan,
  adminDeleteWorkspace,
  adminPurgeCustomer,
} from '../lib/supabase'

const C = {
  primary:'#4F46E5', primaryDark:'#3730A3', primaryLight:'#EEF2FF',
  success:'#059669', successLight:'#D1FAE5',
  red:'#DC2626', redLight:'#FEE2E2',
  amber:'#D97706', amberLight:'#FEF3C7',
  gray100:'#F3F4F6', gray200:'#E5E7EB', gray400:'#9CA3AF',
  gray600:'#4B5563', gray900:'#111827', white:'#FFFFFF',
}

const PLAN_COLORS = {
  free:     { bg:'#F3F4F6', cl:'#4B5563' },
  single:   { bg:'#D1FAE5', cl:'#065F46' },
  multiple: { bg:'#EEF2FF', cl:'#3730A3' },
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

// ─── PLAN CHANGE MODAL ────────────────────────────────────────────────────────
function PlanModal({ customer, onClose, onSaved }) {
  const [plan,    setPlan]    = useState(customer.plan)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      await adminUpdateCustomerPlan(customer.id, plan)
      onSaved(plan)
    } catch(e) {
      let msg = e?.message || 'Failed to update plan'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
        msg = '🌐 Network error — please check your internet connection.'
      }
      setError(msg)
    }
    setSaving(false)
  }

  return createPortal(
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(17,24,39,.7)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:99999, padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:C.white, borderRadius:20, padding:'28px 24px',
        maxWidth:420, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,.25)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:17, fontWeight:800, color:C.gray900 }}>Change Plan</div>
          <button onClick={onClose} style={{ background:C.gray100, border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16 }}>✕</button>
        </div>

        <div style={{ background:C.gray100, borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:C.gray600 }}>
          Customer: <strong style={{ color:C.gray900 }}>{customer.name || customer.email}</strong>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {Object.entries(PLANS).map(([key, p]) => (
            <div
              key={key}
              onClick={() => setPlan(key)}
              style={{
                border:`2px solid ${plan === key ? C.primary : C.gray200}`,
                borderRadius:12, padding:'14px 16px', cursor:'pointer',
                background: plan === key ? C.primaryLight : C.white,
                transition:'all .15s',
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:C.gray900 }}>{p.label}</div>
                    {customer.plan === key && (
                      <span style={{ fontSize:10, background:C.successLight, color:C.success, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>CURRENT</span>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:C.gray400, marginTop:4 }}>
                    {p.vs === Infinity ? 'Unlimited' : p.vs} VS ·{' '}
                    {p.contacts === Infinity ? 'Unlimited contacts' : `${Number(p.contacts).toLocaleString('en-IN')} contacts`}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:16, fontWeight:800, color: plan === key ? C.primary : C.gray900 }}>
                    {p.basePrice === 0 ? '₹0' : `₹${p.basePrice.toLocaleString('en-IN')}/mo`}
                  </div>
                  {plan === key && <div style={{ fontSize:18, marginTop:2 }}>✓</div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && <div style={{ color:C.red, fontSize:12, marginBottom:12 }}>⚠ {error}</div>}

        <button onClick={handleSave} disabled={saving || plan === customer.plan} style={{
          width:'100%', padding:'12px', fontSize:14, fontWeight:700,
          background: (saving || plan === customer.plan) ? C.gray200 : `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
          color: (saving || plan === customer.plan) ? C.gray400 : C.white,
          border:'none', borderRadius:10, cursor: (saving || plan === customer.plan) ? 'not-allowed' : 'pointer',
          fontFamily:'inherit',
        }}>
          {saving ? '⏳ Saving…' : plan === customer.plan ? 'No change' : `Save — Switch to ${PLANS[plan]?.label}`}
        </button>
      </div>
    </div>,
    document.body
  )
}

// ─── CUSTOMER ROW (expanded detail) ──────────────────────────────────────────
function CustomerDetail({ customer, onPlanChanged, onWSDeleted, onPurged }) {
  const [workspaces, setWorkspaces] = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [confirm,    setConfirm]    = useState(null)
  const [showPlan,   setShowPlan]   = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    setLoading(true)
    adminFetchCustomerWorkspaces(customer.id)
      .then(ws => setWorkspaces(ws || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [customer.id])

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
          <button onClick={() => setShowPlan(true)} style={{
            padding:'6px 14px', fontSize:12, fontWeight:700,
            background:C.primaryLight, color:C.primary,
            border:`1px solid ${C.primary}33`, borderRadius:8, cursor:'pointer', fontFamily:'inherit',
          }}>
            ✏️ Change Plan
          </button>
          <button onClick={handlePurge} style={{
            padding:'6px 14px', fontSize:12, fontWeight:700,
            background:C.redLight, color:C.red,
            border:`1px solid ${C.red}33`, borderRadius:8, cursor:'pointer', fontFamily:'inherit',
          }}>
            🗑️ Purge User
          </button>
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

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          subtext={confirm.subtext}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {showPlan && (
        <PlanModal
          customer={customer}
          onClose={() => setShowPlan(false)}
          onSaved={(newPlan) => {
            setShowPlan(false)
            onPlanChanged(customer.id, newPlan)
          }}
        />
      )}
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
    total:    customers.length,
    free:     customers.filter(c => c?.plan === 'free').length,
    single:   customers.filter(c => c?.plan === 'single').length,
    multiple: customers.filter(c => c?.plan === 'multiple').length,
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
            ['Total Users', stats.total,    '#818CF8', '👥'],
            ['Free',        stats.free,     '#9CA3AF', '🆓'],
            ['Single',      stats.single,   '#34D399', '1️⃣'],
            ['Multiple',    stats.multiple, '#A78BFA', '🔢'],
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

      {/* ── CUSTOMER LIST ── */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 20px' }}>

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
