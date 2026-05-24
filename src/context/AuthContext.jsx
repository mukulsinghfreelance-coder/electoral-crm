import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// ─── PLAN LIMITS ──────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free:     { vs: 1,  contacts: 1000,      label: 'Free',     price: '₹0',        sameLS: false },
  single:   { vs: 1,  contacts: Infinity,  label: 'Single',   price: '₹2,999/mo', sameLS: false },
  multiple: { vs: 12, contacts: Infinity,  label: 'Multiple', price: '₹5,999/mo', sameLS: true  },
}

export function AuthProvider({ children }) {
  const [customer,  setCustomer]  = useState(null)
  const [session,   setSession]   = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [authError, setAuthError] = useState('')

  // ── Load customer row from DB ─────────────────────────────────────────────
  const loadCustomer = useCallback(async (authUser) => {
    try {
      // 1. Try by auth_id first
      let { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        // 2. Try by email (first login — auth_id not linked yet)
        const { data: byEmail, error: emailErr } = await supabase
          .from('customers')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()

        if (emailErr) throw emailErr

        if (byEmail) {
          // Link auth_id silently
          await supabase
            .from('customers')
            .update({ auth_id: authUser.id })
            .eq('email', authUser.email)
          data = { ...byEmail, auth_id: authUser.id }
        } else {
          // 3. Brand new user — create customer row
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
        }
      }

      setCustomer(data)
      setAuthError('')
    } catch (err) {
      console.error('loadCustomer error:', err)
      setAuthError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }, [])

  // ── Single auth listener — handles all events ─────────────────────────────
  useEffect(() => {
    let initialized = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          if (newSession?.user && !initialized) {
            initialized = true
            await loadCustomer(newSession.user)
          } else if (!newSession && !initialized) {
            // No session on initial load
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

        // TOKEN_REFRESHED — just update session, don't reload customer
        // This was causing the "logged out" bug — token refresh was
        // triggering loadCustomer again and resetting state
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
    // onAuthStateChange SIGNED_IN will fire automatically after this
    // so we don't need to call loadCustomer here — that was causing the hang
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
    // onAuthStateChange SIGNED_OUT fires and cleans up state
  }

  // ── Workspace helpers ─────────────────────────────────────────────────────
  const switchWorkspace = (ws) => setWorkspace(ws)
  const exitWorkspace   = ()   => setWorkspace(null)

  // ── Plan helpers ──────────────────────────────────────────────────────────
  const plan         = customer?.plan || 'free'
  const planLimits   = PLAN_LIMITS[plan]
  const isSuperAdmin = customer?.email === import.meta.env.VITE_SUPER_ADMIN_EMAIL

  return (
    <AuthContext.Provider value={{
      customer, session, loading, workspace, authError,
      loginWithOTP, verifyOTP, loginWithGoogle, logout,
      switchWorkspace, exitWorkspace,
      plan, planLimits, isSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
