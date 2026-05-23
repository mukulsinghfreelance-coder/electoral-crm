import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, signInWithOTP, verifyOTP, signOut } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [session,   setSession]   = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Check existing session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadAppUser(session.user.email)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email)
        setSession(session)
        if (event === 'SIGNED_IN' && session) {
          await loadAppUser(session.user.email)
        }
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setWorkspace(null)
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const loadAppUser = async (email) => {
    setLoading(true)
    try {
      console.log('Looking up user:', email)
      const { data, error } = await supabase
        .from('app_users')
        .select('*, workspaces(*), organisations(*)')
        .eq('email', email)
        .maybeSingle()

      console.log('User lookup result:', data, error)

      if (!data) {
        setAuthError('Your email is not registered. Please contact your admin.')
        await signOut()
        setLoading(false)
        return
      }

      // Update auth_id if not set
      if (!data.auth_id) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase
            .from('app_users')
            .update({ auth_id: session.user.id })
            .eq('email', email)
        }
      }

      setUser(data)
      setWorkspace(data.workspaces)
      setAuthError('')
    } catch (err) {
      console.error('Error loading user:', err)
      setAuthError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const login = async (email) => {
    await signInWithOTP(email)
  }

  const verify = async (email, token) => {
    const data = await verifyOTP(email, token)
    return data
  }

  const logout = async () => {
    await signOut()
    setUser(null)
    setSession(null)
    setWorkspace(null)
  }

  const switchWorkspace = (ws) => setWorkspace(ws)

  const isAdmin     = user?.role === 'admin' || user?.role === 'super_admin'
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