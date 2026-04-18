import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [membership, setMembership] = useState(null)
  const [loading, setLoading]     = useState(true)
  const mountedRef                = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (mountedRef.current) setProfile(data ?? null)
    return data
  }

  async function fetchMembership(userId) {
    const { data } = await supabase.from('memberships').select('*')
      .eq('user_id', userId).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (mountedRef.current) setMembership(data ?? null)
  }

  useEffect(() => {
    let ignore = false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (ignore) return
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
        await fetchMembership(session.user.id)
      }
      if (mountedRef.current) setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (ignore) return
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
        await fetchMembership(session.user.id)
      } else {
        setProfile(null)
        setMembership(null)
      }
      if (mountedRef.current) setLoading(false)
    })
    return () => { ignore = true; subscription.unsubscribe() }
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    return { data, error }
  }

  async function signOut() {
    try { await supabase.auth.signOut() } catch {}
    if (mountedRef.current) { setUser(null); setProfile(null); setMembership(null) }
    window.location.replace('/login')
  }

  async function sendPasswordReset(email) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
  }

  async function updatePassword(newPassword) {
    return supabase.auth.updateUser({ password: newPassword })
  }

  const isAdmin   = profile?.role === 'admin'
  const hasAccess = isAdmin || membership?.status === 'active'

  return (
    <AuthContext.Provider value={{
      user, profile, membership, loading,
      isAdmin, hasAccess,
      signIn, signUp, signOut,
      sendPasswordReset, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
