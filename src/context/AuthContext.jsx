import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { PLANS, getPlanLimits, calcMonthlyPrice, SUPER_ADMIN_EMAIL, FEATURES, fetchPricingFromDB, BILLING } from '../config'

const AuthContext = createContext(null)
export { PLANS, calcMonthlyPrice }

export function AuthProvider({ children }) {
  const [customer,          setCustomer]          = useState(null)
  const [volunteerWorkspace, setVolunteerWorkspace] = useState(null)
  const [livePlans, setLivePlans] = useState(null)  // DB pricing overrides

  // ── Fetch live pricing from DB on mount ──────────────────────────────────
  useEffect(() => {
    fetchPricingFromDB(supabase).then(p => {
      if (p) {
        console.log('✅ Live pricing loaded into React state:', p)
        setLivePlans(p)
      }
    })
  }, [])
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
      // ── STEP 1: Check volunteers table FIRST ─────────────────────────────
      // Volunteers must be identified before checking/creating customer records
      const { data: vol, error: volErr } = await supabase
        .from('volunteers')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()

      console.log('Volunteer check:', authUser.email, '→ vol=', vol, 'err=', volErr)

      if (vol) {
        console.log('Volunteer login:', vol.email, '| workspace:', vol.workspace_id)
        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', vol.workspace_id)
          .maybeSingle()

        if (ws) setVolunteerWorkspace(ws)
        else console.error('Volunteer workspace not found:', vol.workspace_id)

        setCustomer({
          id:           vol.id,
          email:        authUser.email,
          name:         vol.name,
          plan:         'volunteer',
          role:         'volunteer',
          isVolunteer:  true,
          workspace_id: vol.workspace_id,
        })
        setAuthError('')
        setLoading(false)
        return  // ← done, never touch customers table
      }

      // ── STEP 2: Check customers table ────────────────────────────────────
      let data = null

      const { data: byAuthId } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle()

      if (byAuthId) {
        data = byAuthId
      } else {
        const { data: byEmail } = await supabase
          .from('customers')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()

        if (byEmail) {
          supabase.from('customers')
            .update({ auth_id: authUser.id })
            .eq('email', authUser.email)
            .then(() => {}).catch(console.warn)
          data = { ...byEmail, auth_id: authUser.id }
        } else {
          // ── STEP 3: New user → create free customer ─────────────────────
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

          if (error) {
            // auth_id conflict — a stale record exists, fetch by auth_id
            if (error.code === '23505') {
              const { data: stale } = await supabase
                .from('customers')
                .select('*')
                .eq('auth_id', authUser.id)
                .maybeSingle()
              if (stale) { data = stale }
              else throw error
            } else {
              throw error
            }
          } else {
            data = newC
            console.log('New customer created:', data.email)
          }
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

  const activePlans = livePlans || PLANS

  // ── Plan resolution ───────────────────────────────────────────────────────
  const plan         = customer?.plan || 'free'
  const isGifted     = plan === 'free_forever'
  const isSuperAdmin = customer?.email === SUPER_ADMIN_EMAIL
  const paidVsCount  = customer?.paid_vs_count || 0

  // allowedVS — how many VSs without triggering upgrade prompt
  const freeForeverLimit = livePlans?.freeForeverVsLimit ?? 10
  const allowedVS =
    isSuperAdmin              ? Infinity
    : plan === 'free_forever' ? freeForeverLimit
    : plan === 'premium'      ? Math.max(paidVsCount, 1)  // at least 1
    : 1  // free = always 1

  const activeConfig = activePlans[plan] || PLANS[plan] || PLANS.free
  const planLimits   = {
    vs:       allowedVS,
    contacts: activeConfig.contacts,
    label:    activeConfig.label,
  }
  const planConfig           = activeConfig
  const annualBillingEnabled = livePlans?.annualBillingEnabled ?? false
  const annualDiscountPct    = livePlans?.annualDiscountPct ?? 20

  // calcMonthlyPrice using live pricing
  const calcLivePrice = (p, vsCount = 1) => {
    const pc = activePlans[p] || PLANS[p]
    if (!pc || pc.basePrice === 0) return 0
    if (p === 'premium') return pc.basePrice + Math.max(0, vsCount - 1) * pc.extraVS
    return 0
  }

  return (
    <AuthContext.Provider value={{
      customer, session, loading,
      workspace: customer?.isVolunteer ? volunteerWorkspace : workspace,
      authError,
      loginWithOTP, verifyOTP, loginWithGoogle, devLogin, logout,
      switchWorkspace, exitWorkspace,
      plan, planLimits, planConfig,
      livePlans: activePlans,
      isSuperAdmin, isGifted, paidVsCount, allowedVS,
      annualBillingEnabled, annualDiscountPct,
      billingCycle: customer?.billing_cycle || 'monthly',
      calcMonthlyPrice: calcLivePrice,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
