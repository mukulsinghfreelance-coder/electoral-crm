import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchWorkspaces } from '../lib/supabase'

const C = {
  primary:"#4F46E5", primaryDark:"#3730A3", primaryLight:"#EEF2FF",
  teal:"#0D9488", tealLight:"#CCFBF1",
  gray100:"#F3F4F6", gray200:"#E5E7EB", gray400:"#9CA3AF",
  gray600:"#4B5563", gray900:"#111827", white:"#FFFFFF",
}

export default function WorkspacePage() {
  const { user, switchWorkspace, logout } = useAuth()
  const [workspaces, setWorkspaces] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      const ws = await fetchWorkspaces(user.org_id)
      setWorkspaces(ws)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight:'100vh', width:'100%',
      background:'linear-gradient(135deg,#1E1B4B 0%,#312E81 40%,#4F46E5 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px', fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    }}>
      <div style={{width:'100%', maxWidth:480}}>

        {/* Header */}
        <div style={{textAlign:'center', marginBottom:28}}>
          <div style={{fontSize:36, marginBottom:8}}>🗳️</div>
          <div style={{fontSize:22, fontWeight:800, color:C.white}}>
            Select Constituency
          </div>
          <div style={{fontSize:13, color:'#A5B4FC', marginTop:4}}>
            Welcome, {user?.name}! Choose a Vidhan Sabha to manage.
          </div>
        </div>

        {/* Workspace cards */}
        <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom:20}}>
          {loading ? (
            <div style={{textAlign:'center', color:'#A5B4FC', padding:40}}>
              ⏳ Loading workspaces…
            </div>
          ) : workspaces.length === 0 ? (
            <div style={{
              background:C.white, borderRadius:16, padding:24, textAlign:'center'
            }}>
              <div style={{fontSize:32, marginBottom:8}}>😕</div>
              <div style={{fontSize:14, color:C.gray600}}>No workspaces found. Contact your admin.</div>
            </div>
          ) : (
            workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => switchWorkspace(ws)}
                style={{
                  background:C.white, border:'none', borderRadius:16,
                  padding:'18px 20px', cursor:'pointer', textAlign:'left',
                  boxShadow:'0 4px 16px rgba(0,0,0,.12)',
                  transition:'all .2s', fontFamily:'inherit',
                  display:'flex', alignItems:'center', gap:14,
                }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
              >
                <div style={{
                  width:48, height:48, borderRadius:12,
                  background:C.primaryLight,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22, flexShrink:0,
                }}>
                  🏛️
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16, fontWeight:700, color:C.gray900, marginBottom:2}}>
                    {ws.vs || ws.name}
                  </div>
                  <div style={{fontSize:12, color:C.gray600}}>
                    {ws.ls && <span>{ws.ls} · </span>}
                    {ws.state}
                  </div>
                </div>
                <div style={{fontSize:20, color:C.primary}}>→</div>
              </button>
            ))
          )}
        </div>

        {/* Logout */}
        <div style={{textAlign:'center'}}>
          <button
            onClick={logout}
            style={{
              background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)',
              borderRadius:10, padding:'8px 20px', color:'#C7D2FE',
              fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}
          >
            ← Logout
          </button>
        </div>
      </div>
    </div>
  )
}
