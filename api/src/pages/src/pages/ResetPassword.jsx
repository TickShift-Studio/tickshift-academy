import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(''); setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) setError(err.message)
    else { setSuccess(true); setTimeout(() => navigate('/dashboard', { replace: true }), 2500) }
  }

  const S = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08162E', padding: '1.5rem' },
    card: { width: '100%', maxWidth: 420, background: '#0B1628', border: '1px solid rgba(60,203,255,0.2)', borderRadius: 20, padding: '2.25rem', boxShadow: '0 0 60px rgba(15,111,255,0.10)' },
    logo: { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: 1, marginBottom: '1.75rem', display: 'block' },
    title: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 13, color: '#6E84A3', marginBottom: '1.75rem', lineHeight: 1.5 },
    label: { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#3CCBFF', textTransform: 'uppercase', marginBottom: 6, marginTop: '1rem' },
    input: { width: '100%', background: 'rgba(15,111,255,0.06)', border: '1px solid rgba(60,203,255,0.2)', borderRadius: 10, padding: '0.75rem 1rem', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    btn: { width: '100%', padding: '0.85rem', marginTop: '1.25rem', background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' },
    error: { background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: 8, padding: '0.65rem 0.9rem', color: '#FF6B6B', fontSize: 13, marginTop: '1rem' },
    success: { background: 'rgba(15,111,255,0.1)', border: '1px solid rgba(15,111,255,0.3)', borderRadius: 8, padding: '0.65rem 0.9rem', color: '#3CCBFF', fontSize: 13, marginTop: '1rem' },
  }

  if (!ready) return (
    <div style={S.page}>
      <div style={S.card}>
        <span style={S.logo}>TICKSHIFT</span>
        <div style={S.title}>Verifying link…</div>
        <div style={S.subtitle}>Please wait while we validate your reset link.</div>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <div style={S.card}>
        <span style={S.logo}>TICKSHIFT</span>
        {!success ? (
          <>
            <div style={S.title}>Set your new password</div>
            <div style={S.subtitle}>Choose a strong password to protect your account.</div>
            <form onSubmit={handleSubmit}>
              <label style={S.label}>New password</label>
              <input style={S.input} type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
              <label style={S.label}>Confirm password</label>
              <input style={S.input} type="password" placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              {error && <div style={S.error}>{error}</div>}
              <button style={S.btn} disabled={loading}>{loading ? 'Saving…' : 'Set Password & Sign In'}</button>
            </form>
          </>
        ) : (
          <>
            <div style={S.title}>Password updated!</div>
            <div style={S.success}>Your password has been set. Redirecting you to your dashboard…</div>
          </>
        )}
      </div>
    </div>
  )
}
