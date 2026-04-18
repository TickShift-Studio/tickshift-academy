import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [profile, setProfile]       = useState(null)
  const [membership, setMembership] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [membershipChecked, setMembershipChecked] = useState(false)
  const mountedRef    = useRef(true)
  const fetchedForRef = useRef(null) // tracks which userId we last fetched for

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles').select('*').eq('id', userId).single()
      if (mountedRef.current) setProfile(data ?? null)
    } catch {
      if (mountedRef.current) setProfile(null)
    }
  }

  async function fetchMembership(userId) {
    try {
      const { data } = await supabase
        .from('memberships').select('*')
        .eq('user_id', userId).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (mountedRef.current) setMembership(data ?? null)
    } catch {
      if (mountedRef.current) setMembership(null)
    } finally {
      if (mountedRef.current) setMembershipChecked(true)
    }
  }

  // Only fetch profile+membership once per unique userId
  function loadUserData(userId) {
    if (fetchedForRef.current === userId) return // already loading/loaded for this user
    fetchedForRef.current = userId
    setMembershipChecked(false)
    fetchProfile(userId)
    fetchMembership(userId)
  }

  useEffect(() => {
    mountedRef.current = true

    // Safety valve — never block longer than 5s
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) { setLoading(false); setMembershipChecked(true) }
    }, 5000)

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mountedRef.current) return
      clearTimeout(safetyTimer)
      if (error) { setLoading(false); setMembershipChecked(true); return }

      const u = session?.user ?? null
      setUser(u)
      setLoading(false) // unblock routing immediately

      if (u) {
        loadUserData(u.id)
      } else {
        setMembershipChecked(true)
      }
    }).catch(() => {
      if (mountedRef.current) { setLoading(false); setMembershipChecked(true) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return
      const u = session?.user ?? null
      setUser(u)
      if (!u) {
        fetchedForRef.current = null
        setProfile(null); setMembership(null); setMembershipChecked(true)
      } else {
        loadUserData(u.id) // no-op if already fetched for this userId
      }
    })

    return () => {
      mountedRef.current = false
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    })
    if (!error && data?.user) {
      await supabase.from('profiles').upsert(
        { id: data.user.id, email, full_name: fullName, role: 'student' },
        { onConflict: 'id', ignoreDuplicates: false }
      )
    }
    return { error }
  }

  async function signOut() {
    fetchedForRef.current = null
    try { await supabase.auth.signOut() } catch {}
    if (mountedRef.current) { setUser(null); setProfile(null); setMembership(null) }
    window.location.replace('/login')
  }

  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  const isAdmin   = profile?.role === 'admin'
  const hasAccess = isAdmin || membership?.status === 'active'

  return (
    <AuthContext.Provider value={{
      user, profile, membership, loading, membershipChecked,
      isAdmin, hasAccess,
      signIn, signUp, signOut, sendPasswordReset, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
