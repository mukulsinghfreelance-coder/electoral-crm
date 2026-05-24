// ─── src/AppRouter.jsx ────────────────────────────────────────────────────────
// Central routing: Landing → Auth → WorkspacePage → App (main app)

import { useAuth } from './context/AuthContext'
import LandingPage    from './pages/LandingPage'
import WorkspacePage  from './pages/WorkspacePage'
import App            from './App'   // your existing main app

export default function AppRouter() {
  const { customer, session, loading, workspace } = useAuth()

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight:'100vh',
        background:'linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4F46E5 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        gap:16,
      }}>
        <div style={{ fontSize:48 }}>📋</div>
        <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>ContactBook</div>
        <div style={{ fontSize:13, color:'#A5B4FC' }}>Electoral Manager</div>
        <div style={{ marginTop:8 }}>
          <div style={{
            width:36, height:36, border:'3px solid rgba(255,255,255,.2)',
            borderTopColor:'#A5B4FC', borderRadius:'50%',
            animation:'spin 0.8s linear infinite',
          }}/>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Not logged in → Landing page ────────────────────────────────────────────
  if (!session || !customer) {
    return <LandingPage onSignedIn={() => {}} />
  }

  // ── Logged in, workspace selected → Main app ────────────────────────────────
  if (workspace) {
    return <App />
  }

  // ── Logged in, no workspace selected → Dashboard ────────────────────────────
  return <WorkspacePage />
}
