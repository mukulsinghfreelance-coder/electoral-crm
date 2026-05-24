import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { createWorkspace, fetchWorkspaces } from './lib/supabase'
import LandingPage   from './pages/LandingPage'
import WorkspacePage from './pages/WorkspacePage'
import App           from './App'

export default function AppRouter() {
  const { customer, session, loading, workspace, planLimits } = useAuth()

  // ── Process pending constituencies after login ────────────────────────────
  useEffect(() => {
    if (!customer?.id) return

    const pending = sessionStorage.getItem('pending_constituencies')
    if (!pending) return
    sessionStorage.removeItem('pending_constituencies')

    const constituencies = JSON.parse(pending)
    if (!constituencies?.length) return

    console.log('Processing', constituencies.length, 'pending constituencies')

    ;(async () => {
      // ── Fetch existing workspaces first to check duplicates ───────────────
      const existing = await fetchWorkspaces(customer.id)
      const existingVSNames = existing.map(w => (w.vs || w.name || '').toLowerCase())
      const existingConstIds = existing.map(w => w.constituency_id).filter(Boolean)

      // ── Enforce plan VS limit ─────────────────────────────────────────────
      const vsLimit   = planLimits?.vs === Infinity ? 9999 : (planLimits?.vs || 1)
      const remaining = vsLimit - existing.length
      if (remaining <= 0) {
        console.log('VS limit reached, skipping pending constituencies')
        window.dispatchEvent(new Event('workspaces-updated'))
        return
      }

      const toCreate = constituencies.slice(0, remaining)

      for (const c of toCreate) {
        // ── Skip duplicates ────────────────────────────────────────────────
        if (existingConstIds.includes(c.id)) {
          console.log('Skipping duplicate (by id):', c.vs)
          continue
        }
        if (existingVSNames.includes(c.vs.toLowerCase())) {
          console.log('Skipping duplicate (by name):', c.vs)
          continue
        }

        try {
          await createWorkspace({
            customerId:     customer.id,
            constituencyId: c.id,
            state: c.state,
            ls:    c.ls,
            vs:    c.vs,
          })
          // Add to our local tracking so next iteration checks correctly
          existingVSNames.push(c.vs.toLowerCase())
          existingConstIds.push(c.id)
          console.log('Created workspace:', c.vs)
        } catch(e) {
          console.warn('Workspace create failed for', c.vs, ':', e.message)
        }
      }

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

  // ── Not logged in → Landing ───────────────────────────────────────────────
  if (!session || !customer) return <LandingPage />

  // ── Workspace selected → Main app ─────────────────────────────────────────
  if (workspace) return <App />

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return <WorkspacePage />
}
