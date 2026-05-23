import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  supabase, signInWithOTP, verifyOTP, signOut,
  fetchAppUserByEmail, updateAppUserAuthId
} from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)  // app_users row
  const [session,   setSession]   = useState(null)  // supabase session
  const [loading,   setLoading]   = useState(true)
  const [workspace, setWorkspace] = useState(null)  // current workspace

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadAppUser(session)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session) await loadAppUser(session)
        else { setUser(null); setWorkspace(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const loadAppUser = async (session) => {
    try {
      const email = session.user.email
      let appUser
      try {
        appUser = await fetchAppUserByEmail(email)
      } catch {
        // User not in app_users yet — could be first login
        setLoading(false)
        return
      }
      // Link auth_id if not set
      if (!appUser.auth_id) {
        await updateAppUserAuthId(email, session.user.id)
        appUser.auth_id = session.user.id
      }
      setUser(appUser)
      setWorkspace(appUser.workspaces)
    } catch (err) {
      console.error('Error loading app user:', err)
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

  // Switch workspace (for MP users)
  const switchWorkspace = (ws) => {
    setWorkspace(ws)
  }

  const isAdmin      = user?.role === 'admin' || user?.role === 'super_admin'
  const isSuperAdmin = user?.role === 'super_admin'
  const isVolunteer  = user?.role === 'volunteer'
  const isMP         = user?.organisations?.type === 'MP'

  return (
    <AuthContext.Provider value={{
      user, session, loading, workspace,
      login, verify, logout, switchWorkspace,
      isAdmin, isSuperAdmin, isVolunteer, isMP,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
