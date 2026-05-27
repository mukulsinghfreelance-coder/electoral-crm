import { lazy, Suspense, useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import App         from './App'

const WorkspacePage  = lazy(() => import('./pages/WorkspacePage'))
const UpgradeModal   = lazy(() => import('./components/UpgradeModal'))

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
  const [intendedPlan, setIntendedPlan] = useState(null)
  const [showPayment,  setShowPayment]  = useState(false)

  // After login, check if customer came from a pricing CTA
  useEffect(() => {
    if (!customer?.id) return

    const plan = sessionStorage.getItem('intended_plan')
    if (!plan) return

    sessionStorage.removeItem('intended_plan')

    // Only show payment if customer is on free plan
    // If already premium (just paid), skip — don't reopen modal
    if (customer.plan === 'free' && !customer.gifted_forever) {
      setIntendedPlan(plan)
      setShowPayment(true)
    } else {
      // Already paid — clear storage, go to dashboard
      sessionStorage.removeItem('intended_plan')
    }
  }, [customer?.id])

  if (loading) return <Spinner/>

  // Not logged in → landing page
  if (!session || !customer) return <LandingPage/>

  // Volunteer → go directly to App once workspace is loaded
  if (customer?.isVolunteer) {
    if (!workspace) return <Spinner/>  // wait for volunteerWorkspace to load
    return <App/>
  }

  // Show payment modal after login from pricing CTA
  if (showPayment && intendedPlan) {
    return (
      <>
        <Spinner/>
        <Suspense fallback={null}>
          <UpgradeModal
            onClose={() => { setShowPayment(false); setIntendedPlan(null) }}
            initialPlan={intendedPlan}
            triggerReason={`You selected the ${intendedPlan.charAt(0).toUpperCase()+intendedPlan.slice(1)} plan. Complete payment to activate.`}
          />
        </Suspense>
      </>
    )
  }

  // Workspace selected → main app
  if (workspace) return <App/>

  // Customer dashboard
  return (
    <Suspense fallback={<Spinner/>}>
      <WorkspacePage/>
    </Suspense>
  )
}
