import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { PLANS, getPlanLimits, calcMonthlyPrice, SUPER_ADMIN_EMAIL, FEATURES } from '../config'

const AuthContext = createContext(null)
export { PLANS, calcMonthlyPrice }

export function AuthProvider({ children }) {
  const [customer,  setCustomer]  = useState(null)
  const [session,   setSession]   = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [authError, setAuthError] = useState('')

  // ── Load customer row from DB ─────────────────────────────────────────────
  const loadCustomer = useCallback(async (authUser) => {
    console.log('loadCustomer called for:', authUser.email)
    try {
      // 1. Try by auth_id
      let { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        console.log('No match by auth_id, trying email...')
        // 2. Try by email
        const { data: byEmail, error: emailErr } = await supabase
          .from('customers')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()

        if (emailErr) throw emailErr

        if (byEmail) {
          console.log('Found by email, linking auth_id...')
          // Link auth_id
          const { error: updateErr } = await supabase
            .from('customers')
            .update({ auth_id: authUser.id })
            .eq('email', authUser.email)

          if (updateErr) console.warn('auth_id link failed:', updateErr)
          data = { ...byEmail, auth_id: authUser.id }
        } else {
          console.log('Brand new user, creating customer row...')
          // 3. Create new customer
          const { data: newCustomer, error: insertError } = await supabase
            .from('customers')
            .insert({
              auth_id: authUser.id,
              email:   authUser.email,
              name:    authUser.user_metadata?.full_name || authUser.email.split('@')[0],
              plan:    'free',
            })
            .select()
            .single()

          if (insertError) throw insertError
          data = newCustomer
          console.log('New customer created:', data)
        }
      }

      console.log('Customer loaded:', data.email, 'plan:', data.plan)
      setCustomer(data)
      setAuthError('')
    } catch (err) {
      console.error('loadCustomer error:', err)
      setAuthError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }, [])

  // ── Single auth listener ──────────────────────────────────────────────────
  useEffect(() => {
    let initialized = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event, newSession?.user?.email)
        setSession(newSession)

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (newSession?.user && !initialized) {
            initialized = true
            await loadCustomer(newSession.user)
          } else if (!newSession && !initialized) {
            initialized = true
            setLoading(false)
          }
        }

        if (event === 'SIGNED_OUT') {
          initialized = false
          setCustomer(null)
          setWorkspace(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadCustomer])

  // ── Auth methods ──────────────────────────────────────────────────────────
  const loginWithOTP = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) throw error
  }

  const verifyOTP = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email, token, type: 'email',
    })
    if (error) throw error
    // onAuthStateChange SIGNED_IN fires automatically — no need to call loadCustomer here
    return data
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const switchWorkspace = (ws) => setWorkspace(ws)
  const exitWorkspace   = ()   => setWorkspace(null)

  const plan         = customer?.plan || 'free'
  const planLimits   = getPlanLimits(plan)
  const planConfig   = PLANS[plan] || PLANS.free
  const isSuperAdmin = customer?.email === SUPER_ADMIN_EMAIL

  return (
    <AuthContext.Provider value={{
      customer, session, loading, workspace, authError,
      loginWithOTP, verifyOTP, loginWithGoogle, logout,
      switchWorkspace, exitWorkspace,
      plan, planLimits, planConfig, isSuperAdmin, calcMonthlyPrice,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
