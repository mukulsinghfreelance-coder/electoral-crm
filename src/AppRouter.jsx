// ─── src/AppRouter.jsx ────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { createWorkspace } from './lib/supabase'
import LandingPage   from './pages/LandingPage'
import WorkspacePage from './pages/WorkspacePage'
import App           from './App'

export default function AppRouter() {
  const { customer, session, loading, workspace, planLimits } = useAuth()

  // ── Process pending constituencies after login ──────────────────────────
  // When user selects VSs on landing page → logs in → we create their workspaces
  useEffect(() => {
    if (!customer?.id) return

    const pending = sessionStorage.getItem('pending_constituencies')
    if (!pending) return

    sessionStorage.removeItem('pending_constituencies')

    const constituencies = JSON.parse(pending)
    if (!constituencies?.length) return

    console.log('Processing pending constituencies:', constituencies.length)

    const vsLimit = planLimits?.vs === Infinity ? 999 : (planLimits?.vs || 1)
    const toCreate = constituencies.slice(0, vsLimit)

    // Create workspaces one by one — WorkspacePage will reload after
    ;(async () => {
      for (const c of toCreate) {
        try {
          await createWorkspace({
            customerId:     customer.id,
            constituencyId: c.id,
            state: c.state,
            ls:    c.ls,
            vs:    c.vs,
          })
          console.log('Created workspace for:', c.vs)
        } catch(e) {
          // Skip duplicates silently
          if (!e.message?.includes('duplicate') && !e.message?.includes('unique')) {
            console.warn('Workspace create failed for', c.vs, e.message)
          }
        }
      }
      // Force WorkspacePage to reload by triggering a re-render
      window.dispatchEvent(new Event('workspaces-updated'))
    })()
  }, [customer?.id])

  // ── Loading splash ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight:'100vh',
        background:'linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4F46E5 100%)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        gap:16,
      }}>
        <div style={{ fontSize:48 }}>📋</div>
        <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>ContactBook</div>
        <div style={{ fontSize:13, color:'#A5B4FC' }}>Electoral Manager</div>
        <div style={{ marginTop:8 }}>
          <div style={{
            width:36, height:36,
            border:'3px solid rgba(255,255,255,.2)',
            borderTopColor:'#A5B4FC',
            borderRadius:'50%',
            animation:'spin 0.8s linear infinite',
          }}/>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Not logged in → Landing page ──────────────────────────────────────────
  if (!session || !customer) {
    return <LandingPage />
  }

  // ── Logged in + workspace selected → Main app ─────────────────────────────
  if (workspace) {
    return <App />
  }

  // ── Logged in, no workspace selected → Dashboard ──────────────────────────
  return <WorkspacePage />
}
