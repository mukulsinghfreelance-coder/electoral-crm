import { lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import App         from './App'

const WorkspacePage = lazy(() => import('./pages/WorkspacePage'))

const Spinner = () => (
  <div style={{
    minHeight:'100vh',
    background:'linear-gradient(135deg,#0F0E1A 0%,#1C1B35 100%)',
    display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    fontFamily:"system-ui,sans-serif", gap:16,
  }}>
    <div style={{ fontSize:40 }}>🗳️</div>
    <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
      Sampark<span style={{ color:'#A78BFA' }}>.AI</span>
    </div>
    <div style={{ fontSize:12, color:'#6B7280' }}>संपर्क · Electoral Intelligence</div>
    <div style={{ marginTop:8, width:32, height:32, border:'3px solid rgba(255,255,255,.1)', borderTopColor:'#6C63FF', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
)

export default function AppRouter() {
  const { customer, session, loading, workspace } = useAuth()

  if (loading) return <Spinner/>

  // Not logged in → marketing landing page
  if (!session || !customer) return <LandingPage/>

  // Logged in + workspace selected → main app
  if (workspace) return <App/>

  // Logged in, no workspace → dashboard
  return (
    <Suspense fallback={<Spinner/>}>
      <WorkspacePage/>
    </Suspense>
  )
}
