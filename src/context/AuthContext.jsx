import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [session,   setSession]   = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [authError, setAuthError] = useState('')

  const loadAppUser = useCallback(async (email) => {
    console.log('Looking up user:', email)
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      console.log('User lookup result:', data, error)

      if (!data) {
        console.log('No user found — signing out')
        setAuthError('Your email is not registered. Contact your admin.')
        await supabase.auth.signOut()
        setUser(null)
        setWorkspace(null)
        setLoading(false)
        return
      }

      // Fetch workspace separately
      let wsData = null
      if (data.workspace_id) {
        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', data.workspace_id)
          .maybeSingle()
        wsData = ws
        console.log('Workspace:', ws)
      }

      // Fetch organisation separately
      let orgData = null
      if (data.org_id) {
        const { data: org } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', data.org_id)
          .maybeSingle()
        orgData = org
        console.log('Organisation:', orgData)
      }

      // Update auth_id if missing — fire and forget
      if (!data.auth_id) {
        const { data: { session: s } } = await supabase.auth.getSession()
        if (s?.user?.id) {
          supabase
            .from('app_users')
            .update({ auth_id: s.user.id })
            .eq('email', email)
            .then(() => console.log('auth_id linked'))
            .catch(e => console.warn('auth_id link failed:', e))
        }
      }

      setUser({ ...data, workspaces: wsData, organisations: orgData })
      setWorkspace(wsData)
      setAuthError('')

    } catch (err) {
      console.error('loadAppUser error:', err)
      setAuthError('Something went wrong. Please try again.')
    }

    // Always call setLoading(false) at the end
    setLoading(false)
  }, [])

  useEffect(() => {
    let handled = false

    // Check existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email)
      setSession(session)
      if (session?.user?.email && !handled) {
        handled = true
        loadAppUser(session.user.email)
      } else if (!session) {
        setLoading(false)
      }
    })

    // Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email)
        setSession(session)

        if (event === 'SIGNED_IN' && session?.user?.email && !handled) {
          handled = true
          await loadAppUser(session.user.email)
        }

        if (event === 'SIGNED_OUT') {
          handled = false
          setUser(null)
          setWorkspace(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadAppUser])

const login = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: undefined,  // ← forces OTP not magic link
    }
  })
  if (error) throw error
}

  const verify = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setWorkspace(null)
    setLoading(false)
  }

  const switchWorkspace = (ws) => setWorkspace(ws)

  const isAdmin      = user?.role === 'admin' || user?.role === 'super_admin'
  const isSuperAdmin = user?.role === 'super_admin'
  const isVolunteer  = user?.role === 'volunteer'
  const isMP         = user?.organisations?.type === 'MP'

  return (
    <AuthContext.Provider value={{
      user, session, loading, workspace, authError,
      login, verify, logout, switchWorkspace,
      isAdmin, isSuperAdmin, isVolunteer, isMP,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
