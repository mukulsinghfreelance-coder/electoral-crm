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

  const loadCustomer = useCallback(async (authUser) => {
    console.log('loadCustomer:', authUser.email)
    try {
      // 1. Try by auth_id
      let { data } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle()

      // 2. Try by email (auth_id not linked yet)
      if (!data) {
        const { data: byEmail } = await supabase
          .from('customers')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()

        if (byEmail) {
          // Link auth_id
          await supabase
            .from('customers')
            .update({ auth_id: authUser.id })
            .eq('email', authUser.email)
          data = { ...byEmail, auth_id: authUser.id }
          console.log('Linked auth_id to existing customer:', byEmail.email)
        }
      }

      // 3. Create brand new customer
      if (!data) {
        const { data: newC, error: insertErr } = await supabase
          .from('customers')
          .insert({
            auth_id: authUser.id,
            email:   authUser.email,
            name:    authUser.user_metadata?.full_name || authUser.email.split('@')[0],
            plan:    'free',
          })
          .select()
          .single()
        if (insertErr) throw insertErr
        data = newC
        console.log('Created new customer:', data.email)
      }

      console.log('Customer ready:', data.email, '| plan:', data.plan)
      setCustomer(data)
      setAuthError('')
    } catch (err) {
      console.error('loadCustomer failed:', err)
      setAuthError('Login failed. Please try again.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Track which auth user we've already loaded to avoid duplicate calls
    let loadedForUserId = null

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event, '| user:', newSession?.user?.email || 'none')
        setSession(newSession)

        if (event === 'INITIAL_SESSION') {
          if (newSession?.user) {
            loadedForUserId = newSession.user.id
            await loadCustomer(newSession.user)
          } else {
            setLoading(false)
          }
        }

        if (event === 'SIGNED_IN') {
          // Only load if it's a different user than we already loaded
          if (newSession?.user && newSession.user.id !== loadedForUserId) {
            loadedForUserId = newSession.user.id
            await loadCustomer(newSession.user)
          } else if (newSession?.user && loadedForUserId === newSession.user.id) {
            // Same user already loaded — just make sure loading is false
            setLoading(false)
          }
        }

        if (event === 'SIGNED_OUT') {
          loadedForUserId = null
          setCustomer(null)
          setWorkspace(null)
          setLoading(false)
        }

        // TOKEN_REFRESHED — session updated silently, no action needed
      }
    )

    return () => subscription.unsubscribe()
  }, [loadCustomer])

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
    return data
    // SIGNED_IN event fires automatically → loadCustomer called → dashboard shown
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  }

  const logout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
  }

  const switchWorkspace = (ws) => setWorkspace(ws)
  const exitWorkspace   = ()   => setWorkspace(null)

  const plan       = customer?.plan || 'free'
  const planLimits = getPlanLimits(plan)
  const planConfig = PLANS[plan] || PLANS.free
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
