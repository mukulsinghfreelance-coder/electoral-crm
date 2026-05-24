import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// ─── PLAN LIMITS ──────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free:     { vs: 1,  contacts: 1000,      label: 'Free',     price: '₹0',         sameLS: false },
  single:   { vs: 1,  contacts: Infinity,  label: 'Single',   price: '₹2,999/mo',  sameLS: false },
  multiple: { vs: 12, contacts: Infinity,  label: 'Multiple', price: '₹5,999/mo',  sameLS: true  },
}

export function AuthProvider({ children }) {
  const [customer,  setCustomer]  = useState(null)   // customers row
  const [session,   setSession]   = useState(null)
  const [workspace, setWorkspace] = useState(null)   // active workspace
  const [loading,   setLoading]   = useState(true)
  const [authError, setAuthError] = useState('')

  // ── Load customer from DB after auth ────────────────────────────────────────
  const loadCustomer = useCallback(async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        // Try matching by email (first login after signup)
        const { data: byEmail } = await supabase
          .from('customers')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()

        if (!byEmail) {
          // Brand new user — create customer row
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
          setCustomer(newCustomer)
          setWorkspace(null)   // will go to workspace selector / onboarding
          setLoading(false)
          return
        }

        // Link auth_id to existing customer
        await supabase
          .from('customers')
          .update({ auth_id: authUser.id })
          .eq('email', authUser.email)

        setCustomer({ ...byEmail, auth_id: authUser.id })
      } else {
        setCustomer(data)
      }

      setAuthError('')
    } catch (err) {
      console.error('loadCustomer error:', err)
      setAuthError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }, [])

  // ── Auth state listener ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        loadCustomer(session.user)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (event === 'SIGNED_IN' && session?.user) {
          await loadCustomer(session.user)
        }
        if (event === 'SIGNED_OUT') {
          setCustomer(null)
          setWorkspace(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadCustomer])

  // ── Auth methods ─────────────────────────────────────────────────────────────
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
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setCustomer(null)
    setSession(null)
    setWorkspace(null)
    setLoading(false)
  }

  // ── Workspace switching ───────────────────────────────────────────────────────
  const switchWorkspace = (ws) => setWorkspace(ws)
  const exitWorkspace   = ()   => setWorkspace(null)

  // ── Plan helpers ──────────────────────────────────────────────────────────────
  const plan       = customer?.plan || 'free'
  const planLimits = PLAN_LIMITS[plan]
  const isAdmin    = false  // all customers are equal; super admin via service key
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
