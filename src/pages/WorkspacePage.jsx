import { useState, useEffect } from 'react'
import { useAuth, PLAN_LIMITS } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  fetchWorkspaces, fetchWorkspaceStats, createWorkspace,
  fetchStates, fetchLokSabhas, fetchVidhanSabhas,
} from '../lib/supabase'

const C = {
  primary:'#4F46E5', primaryDark:'#3730A3', primaryLight:'#EEF2FF',
  success:'#059669', successLight:'#D1FAE5',
  amber:'#D97706', amberLight:'#FEF3C7',
  red:'#DC2626', redLight:'#FEE2E2',
  teal:'#0D9488', tealLight:'#CCFBF1',
  gray100:'#F3F4F6', gray200:'#E5E7EB', gray400:'#9CA3AF',
  gray600:'#4B5563', gray900:'#111827', white:'#FFFFFF',
}

const RATING_COLOR = {
  A: { bg:'#D1FAE5', cl:'#065F46', label:'Strong'   },
  B: { bg:'#FEF3C7', cl:'#92400E', label:'Moderate' },
  C: { bg:'#FEE2E2', cl:'#991B1B', label:'Tough'    },
}

const PLAN_BADGE = {
  free:    { bg:'#F3F4F6', cl:'#4B5563', label:'Free'    },
  starter: { bg:'#D1FAE5', cl:'#065F46', label:'Starter' },
  growth:  { bg:'#EEF2FF', cl:'#3730A3', label:'Growth'  },
  pro:     { bg:'#FEF3C7', cl:'#92400E', label:'Pro'     },
}

// ─── ADD CONSTITUENCY MODAL ───────────────────────────────────────────────────
function AddConstModal({ onClose, onAdded, customer, currentCount }) {
  const [states,       setStates]       = useState([])
  const [lokSabhas,    setLokSabhas]    = useState([])
  const [vidhanSabhas, setVidhanSabhas] = useState([])
  const [selState,     setSelState]     = useState('')
  const [selLS,        setSelLS]        = useState('')
  const [selVS,        setSelVS]        = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const planLimit = PLAN_LIMITS[customer.plan]?.vs || 1

  useEffect(() => { fetchStates().then(setStates) }, [])
  useEffect(() => {
    if (!selState) return
    fetchLokSabhas(selState).then(ls => { setLokSabhas(ls); setSelLS(''); setVidhanSabhas([]); setSelVS(null) })
  }, [selState])
  useEffect(() => {
    if (!selState || !selLS) return
    fetchVidhanSabhas(selState, selLS).then(vs => { setVidhanSabhas(vs); setSelVS(null) })
  }, [selState, selLS])

  const handleAdd = async () => {
    if (!selVS) { setError('Please select a Vidhan Sabha'); return }
    if (currentCount >= planLimit) {
      setError(`Your ${customer.plan} plan allows only ${planLimit} constituency/constituencies. Please upgrade.`)
      return
    }
    setLoading(true); setError('')
    try {
      const ws = await createWorkspace({
        customerId:      customer.id,
        constituencyId:  selVS.id,
        state: selState, ls: selLS, vs: selVS.vidhan_sabha,
      })
      onAdded(ws)
    } catch(e) {
      setError(e.message || 'Failed to add constituency')
    }
    setLoading(false)
  }

  const selStyle = {
    width:'100%', padding:'10px 12px', fontSize:14,
    border:`1.5px solid ${C.gray200}`, borderRadius:10,
    background:C.white, color:C.gray900, outline:'none',
    fontFamily:'inherit', cursor:'pointer',
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, background:'rgba(17,24,39,.65)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000, padding:20, backdropFilter:'blur(4px)',
    }}>
      <div style={{ background:C.white, borderRadius:20, padding:'24px', width:'100%', maxWidth:420, boxShadow:'0 24px 64px rgba(0,0,0,.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:17, fontWeight:800, color:C.gray900 }}>Add Constituency</div>
          <button onClick={onClose} style={{ background:C.gray100, border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16, color:C.gray600 }}>✕</button>
        </div>

        <div style={{ background:C.primaryLight, borderRadius:10, padding:'10px 12px', marginBottom:16, fontSize:12, color:C.primary, fontWeight:500 }}>
          Plan: <strong>{customer.plan}</strong> · {currentCount}/{planLimit} constituencies used
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.gray400, marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>State</label>
            <select value={selState} onChange={e => setSelState(e.target.value)} style={selStyle}>
              <option value="">Select State…</option>
              {states.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.gray400, marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>Lok Sabha</label>
            <select value={selLS} onChange={e => setSelLS(e.target.value)} disabled={!lokSabhas.length} style={{ ...selStyle, opacity: lokSabhas.length ? 1 : .5 }}>
              <option value="">Select LS…</option>
              {lokSabhas.map(ls => <option key={ls}>{ls}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.gray400, marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>Vidhan Sabha</label>
            <select value={selVS?.id||''} onChange={e => setSelVS(vidhanSabhas.find(v => v.id === e.target.value)||null)} disabled={!vidhanSabhas.length} style={{ ...selStyle, opacity: vidhanSabhas.length ? 1 : .5 }}>
              <option value="">Select VS…</option>
              {vidhanSabhas.map(vs => <option key={vs.id} value={vs.id}>{vs.vidhan_sabha}</option>)}
            </select>
          </div>
        </div>

        {error && <div style={{ color:C.red, fontSize:12, marginBottom:12, fontWeight:500 }}>⚠ {error}</div>}

        <button onClick={handleAdd} disabled={loading || !selVS} style={{
          width:'100%', padding:'11px', fontSize:14, fontWeight:700, border:'none', borderRadius:10,
          background:(loading || !selVS) ? C.gray200 : `linear-gradient(135deg,${C.success},#047857)`,
          color:(loading || !selVS) ? C.gray400 : C.white,
          cursor:(loading || !selVS) ? 'not-allowed' : 'pointer', fontFamily:'inherit',
        }}>
          {loading ? '⏳ Adding…' : '+ Add Constituency'}
        </button>
      </div>
    </div>
  )
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:10, color:C.gray400, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>{icon} {label}</div>
      <div style={{ fontSize:22, fontWeight:800, color: color||C.gray900 }}>{value}</div>
    </div>
  )
}

// ─── MAIN WORKSPACE PAGE ──────────────────────────────────────────────────────
export default function WorkspacePage() {
  const { customer, switchWorkspace, logout, plan, planLimits, isSuperAdmin } = useAuth()
  const [workspaces,  setWorkspaces]  = useState([])
  const [wsStats,     setWsStats]     = useState({})
  const [loading,     setLoading]     = useState(true)
  const [totalStats,  setTotalStats]  = useState({ contacts:0, booths:0, vsCount:0 })
  const [showAdd,     setShowAdd]     = useState(false)

  // ── Check for pending constituencies from landing page ──────────────────────
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_constituencies')
    if (pending && customer?.id) {
      sessionStorage.removeItem('pending_constituencies')
      const constituencies = JSON.parse(pending)
      // Create workspaces for each pending constituency
      createPendingWorkspaces(constituencies)
    }
  }, [customer?.id])

  const createPendingWorkspaces = async (constituencies) => {
    const limit = planLimits?.vs || 1
    const toCreate = constituencies.slice(0, limit)
    for (const c of toCreate) {
      try {
        await createWorkspace({
          customerId:     customer.id,
          constituencyId: c.id,
          state: c.state, ls: c.ls, vs: c.vs,
        })
      } catch(e) {
        console.warn('Could not create workspace for', c.vs, e.message)
      }
    }
    loadWorkspaces()
  }

  useEffect(() => { if (customer?.id) loadWorkspaces() }, [customer?.id])

  const loadWorkspaces = async () => {
    setLoading(true)
    try {
      const ws = await fetchWorkspaces(customer.id)
      setWorkspaces(ws || [])

      const statsArr = await Promise.all((ws||[]).map(w => fetchWorkspaceStats(w.id)))
      const statsMap = {}
      statsArr.forEach((s,i) => { statsMap[(ws||[])[i].id] = s })
      setWsStats(statsMap)

      setTotalStats({
        contacts: statsArr.reduce((a,s) => a+s.contacts, 0),
        booths:   statsArr.reduce((a,s) => a+s.booths, 0),
        vsCount:  (ws||[]).length,
      })
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const handleWorkspaceAdded = (newWs) => {
    setShowAdd(false)
    loadWorkspaces()
  }

  const pb = PLAN_BADGE[plan] || PLAN_BADGE.free
  const canAddMore = workspaces.length < (planLimits?.vs || 1)

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4F46E5 100%)',
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
      padding:'0 0 60px',
    }}>

      {/* ── HEADER ── */}
      <div style={{ padding:'20px 20px 0', maxWidth:800, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:'rgba(255,255,255,.15)', backdropFilter:'blur(10px)', border:'2px solid rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📋</div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>ContactBook</div>
              <div style={{ fontSize:11, color:'#A5B4FC' }}>Electoral Manager</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {isSuperAdmin && (
              <button style={{ padding:'7px 14px', fontSize:11, fontWeight:700, background:'rgba(220,38,38,.3)', border:'1px solid rgba(220,38,38,.5)', borderRadius:8, color:'#FCA5A5', cursor:'pointer', fontFamily:'inherit' }}>
                🛡️ Admin
              </button>
            )}
            <button onClick={logout} style={{ padding:'7px 14px', fontSize:12, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, color:'#C7D2FE', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Welcome */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ fontSize:24, fontWeight:800, color:'#fff' }}>
              Welcome, {customer?.name || 'Leader'} 👋
            </div>
            <span style={{ background:pb.bg, color:pb.cl, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
              {pb.label}
            </span>
          </div>
          <div style={{ fontSize:13, color:'#A5B4FC' }}>
            Managing {totalStats.vsCount} Vidhan Sabha{totalStats.vsCount!==1?'s':''} · Click any to manage
          </div>
        </div>

        {/* Total stats */}
        <div style={{
          background:'rgba(255,255,255,.1)', backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,.2)', borderRadius:16, padding:'16px 24px',
          display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24,
        }}>
          {[['Total Contacts',totalStats.contacts,'#818CF8','👥'],['Total Booths',totalStats.booths,'#34D399','📍'],['Vidhan Sabhas',`${totalStats.vsCount}/${planLimits?.vs||1}`,'#F472B6','🏛️']].map(([l,v,cl,ic]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#A5B4FC', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{ic} {l}</div>
              <div style={{ fontSize:26, fontWeight:800, color:'#fff' }}>{loading ? '…' : v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WORKSPACE CARDS ── */}
      <div style={{ maxWidth:800, margin:'0 auto', padding:'0 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#A5B4FC', textTransform:'uppercase', letterSpacing:'.06em' }}>Your Constituencies</div>
          {canAddMore && (
            <button
              onClick={() => setShowAdd(true)}
              style={{ padding:'7px 14px', fontSize:12, fontWeight:700, background:`linear-gradient(135deg,${C.success},#047857)`, border:'none', borderRadius:8, color:C.white, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(5,150,105,.4)' }}
            >
              + Add Constituency
            </button>
          )}
          {!canAddMore && (
            <div style={{ fontSize:11, color:'#A5B4FC', background:'rgba(255,255,255,.1)', padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.15)' }}>
              {workspaces.length}/{planLimits?.vs} — <span style={{ color:'#FCD34D', fontWeight:600, cursor:'pointer' }}>Upgrade to add more ↗</span>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', color:'#A5B4FC', padding:60, fontSize:14 }}>⏳ Loading your constituencies…</div>
        ) : workspaces.length === 0 ? (
          <div style={{ background:'rgba(255,255,255,.1)', borderRadius:16, padding:40, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🏛️</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:8 }}>No constituencies yet</div>
            <div style={{ fontSize:13, color:'#A5B4FC', marginBottom:20 }}>Add your first Vidhan Sabha to get started</div>
            <button onClick={() => setShowAdd(true)} style={{ padding:'11px 24px', fontSize:14, fontWeight:700, background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, border:'none', borderRadius:10, color:C.white, cursor:'pointer', fontFamily:'inherit' }}>
              + Add Your First Constituency
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {workspaces.map(ws => {
              const stats = wsStats[ws.id] || {}
              const dr = stats.dominantRating
              const rc = dr ? RATING_COLOR[dr] : null
              return (
                <div key={ws.id}
                  style={{ background:C.white, borderRadius:18, boxShadow:'0 4px 24px rgba(0,0,0,.12)', overflow:'hidden', cursor:'pointer', transition:'transform .2s, box-shadow .2s' }}
                  onClick={() => switchWorkspace(ws)}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.18)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,.12)' }}
                >
                  {/* Card header */}
                  <div style={{ background:`linear-gradient(135deg,${C.primaryLight},#E0E7FF)`, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:C.primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff' }}>🏛️</div>
                      <div>
                        <div style={{ fontSize:18, fontWeight:800, color:C.gray900 }}>{ws.vs || ws.name}</div>
                        <div style={{ fontSize:12, color:C.gray600, marginTop:2 }}>
                          {ws.ls && <span>{ws.ls} · </span>}{ws.state}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {rc && <span style={{ background:rc.bg, color:rc.cl, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{dr} · {rc.label}</span>}
                      <span style={{ fontSize:22, color:C.primary }}>→</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                    <StatCard label="Contacts" value={stats.contacts||0} color={C.primary} icon="👥"/>
                    <StatCard label="Booths"   value={stats.booths||0}   color={C.teal}    icon="📍"/>
                    <StatCard label="Voters"   value={stats.voters||'—'} color={C.amber}   icon="🗳️"/>
                    <StatCard label="Mandals"  value={stats.mandals||0}  color={C.success} icon="🗺️"/>
                  </div>

                  {/* Booth rating bars */}
                  {stats.booths > 0 && (
                    <div style={{ padding:'0 20px 16px', display:'flex', gap:8 }}>
                      {Object.entries(stats.ratings||{}).filter(([,v]) => v>0).map(([r,count]) => {
                        const rc2 = RATING_COLOR[r]
                        const pct = Math.round((count/stats.booths)*100)
                        return (
                          <div key={r} style={{ flex:1 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:rc2.cl }}>Rating {r}</span>
                              <span style={{ fontSize:11, color:C.gray400 }}>{count} ({pct}%)</span>
                            </div>
                            <div style={{ height:5, background:C.gray100, borderRadius:3, overflow:'hidden' }}>
                              <div style={{ width:`${pct}%`, height:'100%', background:rc2.cl, borderRadius:3 }}/>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Open button */}
                  <div style={{ padding:'0 20px 16px' }}>
                    <button onClick={e => { e.stopPropagation(); switchWorkspace(ws) }} style={{
                      width:'100%', padding:'10px', fontSize:13, fontWeight:700,
                      background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                      color:'#fff', border:'none', borderRadius:10, cursor:'pointer',
                      fontFamily:'inherit', boxShadow:`0 4px 14px rgba(79,70,229,.3)`,
                    }}>
                      Open {ws.vs||ws.name} →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {workspaces.length > 1 && (
          <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#A5B4FC' }}>
            💡 You can switch between constituencies anytime from inside the app
          </div>
        )}
      </div>

      {showAdd && (
        <AddConstModal
          onClose={() => setShowAdd(false)}
          onAdded={handleWorkspaceAdded}
          customer={customer}
          currentCount={workspaces.length}
        />
      )}
    </div>
  )
}
