import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
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
  const loadingRef = useRef(null)  // track which userId we're loading

  const loadCustomer = useCallback(async (authUser) => {
    // Prevent duplicate loads for same user
    if (loadingRef.current === authUser.id) return
    loadingRef.current = authUser.id
    console.log('loadCustomer:', authUser.email)

    try {
      let data = null

      // 1. Try by auth_id
      const { data: byAuthId } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle()

      if (byAuthId) {
        data = byAuthId
      } else {
        // 2. Try by email
        const { data: byEmail } = await supabase
          .from('customers')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()

        if (byEmail) {
          // Link auth_id silently
          supabase
            .from('customers')
            .update({ auth_id: authUser.id })
            .eq('email', authUser.email)
            .then(() => console.log('auth_id linked'))
            .catch(console.warn)
          data = { ...byEmail, auth_id: authUser.id }
        } else {
          // 3. Create new customer
          const { data: newC, error } = await supabase
            .from('customers')
            .insert({
              auth_id: authUser.id,
              email:   authUser.email,
              name:    authUser.user_metadata?.full_name || authUser.email.split('@')[0],
              plan:    'free',
            })
            .select()
            .single()
          if (error) throw error
          data = newC
          console.log('New customer created')
        }
      }

      console.log('Customer loaded:', data.email, '| plan:', data.plan)
      setCustomer(data)
      setAuthError('')
    } catch (err) {
      console.error('loadCustomer error:', err)
      setAuthError('Login failed. Please try again.')
      loadingRef.current = null  // allow retry
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth event:', event, newSession?.user?.email || 'none')
        setSession(newSession)

        // ── KEY FIX: Never use await inside onAuthStateChange ──────────────
        // It causes Supabase client to deadlock. Use setTimeout to break out
        // of the Supabase internal lock before making any DB calls.

        if (event === 'INITIAL_SESSION') {
          if (newSession?.user) {
            setTimeout(() => loadCustomer(newSession.user), 0)
          } else {
            setLoading(false)
          }
        }

        if (event === 'SIGNED_IN') {
          if (newSession?.user && loadingRef.current !== newSession.user.id) {
            setTimeout(() => loadCustomer(newSession.user), 0)
          } else {
            setLoading(false)
          }
        }

        if (event === 'SIGNED_OUT') {
          loadingRef.current = null
          setCustomer(null)
          setSession(null)
          setWorkspace(null)
          setLoading(false)
        }

        if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          // Just update session — don't reload customer
          setSession(newSession)
        }
      }
    )

    // Safety timeout — force unblock after 10s
    const safetyTimer = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn('Auth safety timeout triggered')
          return false
        }
        return prev
      })
    }, 10000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(safetyTimer)
    }
  }, [loadCustomer])

  // ── Auth methods ────────────────────────────────────────────────────────────
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
    // SIGNED_IN fires via onAuthStateChange → setTimeout → loadCustomer
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  }

  // ── DEV BYPASS: Login without OTP ──────────────────────────────────────────
  // Only works in development. Remove before production.
  const devLogin = async (email, password = 'devpassword123') => {
    if (import.meta.env.PROD) {
      console.warn('devLogin disabled in production')
      return
    }
    // Try password login first
    let { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Create the user if doesn't exist
      const res = await supabase.auth.signUp({ email, password })
      if (res.error) throw res.error
      data = res.data
    }
    return data
  }

  const logout = async () => {
    loadingRef.current = null
    await supabase.auth.signOut()
    // SIGNED_OUT event handles state cleanup
  }

  const switchWorkspace = (ws) => setWorkspace(ws)
  const exitWorkspace   = ()   => setWorkspace(null)

  // gifted_forever overrides plan — full Multiple access, no payment screens
  const effectivePlan = customer?.gifted_forever ? 'multiple' : (customer?.plan || 'free')
  const plan          = effectivePlan
  const planLimits    = getPlanLimits(effectivePlan)
  const planConfig    = PLANS[effectivePlan] || PLANS.free
  const isGifted      = customer?.gifted_forever || false
  const isSuperAdmin  = customer?.email === SUPER_ADMIN_EMAIL

  return (
    <AuthContext.Provider value={{
      customer, session, loading, workspace, authError,
      loginWithOTP, verifyOTP, loginWithGoogle, devLogin, logout,
      switchWorkspace, exitWorkspace,
      plan, planLimits, planConfig, isSuperAdmin, isGifted, calcMonthlyPrice,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
