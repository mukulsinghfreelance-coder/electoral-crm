import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const C = {
  primary:"#4F46E5", primaryDark:"#3730A3", primaryLight:"#EEF2FF",
  success:"#059669", successLight:"#D1FAE5",
  amber:"#D97706", amberLight:"#FEF3C7",
  red:"#DC2626", redLight:"#FEE2E2",
  teal:"#0D9488", tealLight:"#CCFBF1",
  gray100:"#F3F4F6", gray200:"#E5E7EB", gray400:"#9CA3AF",
  gray600:"#4B5563", gray900:"#111827", white:"#FFFFFF",
}

const RATING_COLOR = {
  A: { bg:"#D1FAE5", cl:"#065F46", label:"Strong" },
  B: { bg:"#FEF3C7", cl:"#92400E", label:"Moderate" },
  C: { bg:"#FEE2E2", cl:"#991B1B", label:"Tough" },
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:10, color:C.gray400, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", marginBottom:2 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize:22, fontWeight:800, color: color||C.gray900 }}>{value}</div>
    </div>
  )
}

export default function WorkspacePage() {
  const { user, switchWorkspace, logout } = useAuth()
  const [workspaces,  setWorkspaces]  = useState([])
  const [wsStats,     setWsStats]     = useState({})  // workspace stats
  const [loading,     setLoading]     = useState(true)
  const [totalStats,  setTotalStats]  = useState({ contacts:0, booths:0, vsCount:0 })

  useEffect(() => { loadWorkspaces() }, [])

  const loadWorkspaces = async () => {
    try {
      // Fetch all workspaces for this org
      const { data: ws } = await supabase
        .from('workspaces')
        .select('*')
        .eq('org_id', user.org_id)
        .eq('active', true)
        .order('created_at', { ascending: true })

      setWorkspaces(ws || [])

      // Fetch stats for each workspace in parallel
      const statsPromises = (ws || []).map(async w => {
        const [{ count: contactCount }, { count: boothCount }, { data: settings }] = await Promise.all([
          supabase.from('contacts').select('*', { count:'exact', head:true }).eq('workspace_id', w.id),
          supabase.from('booths').select('*', { count:'exact', head:true }).eq('workspace_id', w.id),
          supabase.from('settings').select('total_voters, total_booths, mandals').eq('workspace_id', w.id).maybeSingle(),
        ])

        // Get booth ratings
        const { data: booths } = await supabase
          .from('booths')
          .select('rating')
          .eq('workspace_id', w.id)

        const ratings = { A:0, B:0, C:0 }
        ;(booths||[]).forEach(b => { if(b.rating) ratings[b.rating]++ })

        return {
          wsId: w.id,
          contacts: contactCount || 0,
          booths:   boothCount   || 0,
          voters:   settings?.total_voters || '—',
          mandals:  settings?.mandals?.length || 0,
          ratings,
          dominantRating: Object.entries(ratings).sort((a,b)=>b[1]-a[1])[0]?.[0] || null,
        }
      })

      const allStats = await Promise.all(statsPromises)
      const statsMap = {}
      allStats.forEach(s => { statsMap[s.wsId] = s })
      setWsStats(statsMap)

      // Total stats
      const totalContacts = allStats.reduce((a,s) => a + s.contacts, 0)
      const totalBooths   = allStats.reduce((a,s) => a + s.booths,   0)
      setTotalStats({ contacts:totalContacts, booths:totalBooths, vsCount:(ws||[]).length })

    } catch (err) {
      console.error('Error loading workspaces:', err)
    }
    setLoading(false)
  }

  const handleSelect = (ws) => switchWorkspace(ws)

  return (
    <div style={{
      minHeight:'100vh', width:'100%',
      background:'linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4F46E5 100%)',
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
      padding:'0 0 40px',
    }}>

      {/* Header */}
      <div style={{ padding:'24px 20px 0', maxWidth:800, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,.15)', backdropFilter:'blur(10px)', border:'2px solid rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
              📋
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>ContactBook</div>
              <div style={{ fontSize:12, color:'#A5B4FC' }}>MP Dashboard</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{ padding:'8px 16px', fontSize:12, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, color:'#C7D2FE', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}
          >
            🚪 Logout
          </button>
        </div>

        {/* Welcome */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:4 }}>
            Welcome, {user?.name} 👋
          </div>
          <div style={{ fontSize:14, color:'#A5B4FC' }}>
            Managing {totalStats.vsCount} Vidhan Sabha{totalStats.vsCount!==1?'s':''} · Select one to manage
          </div>
        </div>

        {/* Total stats bar */}
        <div style={{
          background:'rgba(255,255,255,.1)', backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,.2)',
          borderRadius:16, padding:'16px 24px',
          display:'grid', gridTemplateColumns:'repeat(3,1fr)',
          gap:16, marginBottom:28,
        }}>
          {[
            ['Total Contacts', totalStats.contacts, '#818CF8', '👥'],
            ['Total Booths',   totalStats.booths,   '#34D399', '📍'],
            ['Vidhan Sabhas',  totalStats.vsCount,  '#F472B6', '🏛️'],
          ].map(([l,v,cl,ic]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#A5B4FC', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{ic} {l}</div>
              <div style={{ fontSize:28, fontWeight:800, color:'#fff' }}>{loading ? '…' : v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace cards */}
      <div style={{ maxWidth:800, margin:'0 auto', padding:'0 20px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#A5B4FC', marginBottom:12, textTransform:'uppercase', letterSpacing:'.06em' }}>
          Your Constituencies
        </div>

        {loading ? (
          <div style={{ textAlign:'center', color:'#A5B4FC', padding:60, fontSize:14 }}>
            ⏳ Loading your constituencies…
          </div>
        ) : workspaces.length === 0 ? (
          <div style={{ background:'rgba(255,255,255,.1)', borderRadius:16, padding:32, textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>😕</div>
            <div style={{ fontSize:14, color:'#C7D2FE' }}>No constituencies found. Contact your admin.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {workspaces.map(ws => {
              const stats = wsStats[ws.id] || {}
              const dr = stats.dominantRating
              const rc = dr ? RATING_COLOR[dr] : null
              return (
                <div
                  key={ws.id}
                  style={{
                    background:'#fff', borderRadius:18,
                    boxShadow:'0 4px 24px rgba(0,0,0,.12)',
                    overflow:'hidden',
                    transition:'transform .2s, box-shadow .2s',
                    cursor:'pointer',
                  }}
                  onClick={() => handleSelect(ws)}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,.12)'; }}
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
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {rc && (
                        <span style={{ background:rc.bg, color:rc.cl, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                          {dr} · {rc.label}
                        </span>
                      )}
                      <div style={{ fontSize:22, color:C.primary }}>→</div>
                    </div>
                  </div>

                  {/* Card stats */}
                  <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                    <StatCard label="Contacts" value={stats.contacts||0} color={C.primary} icon="👥"/>
                    <StatCard label="Booths"   value={stats.booths||0}   color={C.teal}    icon="📍"/>
                    <StatCard label="Voters"   value={stats.voters||'—'} color={C.amber}   icon="🗳️"/>
                    <StatCard label="Mandals"  value={stats.mandals||0}  color={C.success} icon="🗺️"/>
                  </div>

                  {/* Booth rating breakdown */}
                  {stats.booths > 0 && (
                    <div style={{ padding:'0 20px 16px', display:'flex', gap:8 }}>
                      {Object.entries(stats.ratings||{}).filter(([,v])=>v>0).map(([r,count]) => {
                        const rc2 = RATING_COLOR[r]
                        const pct = Math.round((count / stats.booths) * 100)
                        return (
                          <div key={r} style={{ flex:1 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:rc2.cl }}>Rating {r}</span>
                              <span style={{ fontSize:11, color:C.gray400 }}>{count} ({pct}%)</span>
                            </div>
                            <div style={{ height:6, background:C.gray100, borderRadius:3, overflow:'hidden' }}>
                              <div style={{ width:`${pct}%`, height:'100%', background:rc2.cl, borderRadius:3, transition:'width .6s ease' }}/>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Open button */}
                  <div style={{ padding:'0 20px 16px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); handleSelect(ws); }}
                      style={{
                        width:'100%', padding:'10px', fontSize:13, fontWeight:700,
                        background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                        color:'#fff', border:'none', borderRadius:10, cursor:'pointer',
                        fontFamily:'inherit', boxShadow:`0 4px 14px rgba(79,70,229,.3)`,
                      }}
                    >
                      Open {ws.vs||ws.name} →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Switch workspace hint */}
        {workspaces.length > 1 && (
          <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#A5B4FC' }}>
            💡 You can switch between constituencies anytime from inside the app
          </div>
        )}
      </div>
    </div>
  )
}