import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [ready, setReady]       = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setReady(true) })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(''); setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) setError(err.message)
      else { setSuccess(true); setTimeout(() => navigate('/dashboard', { replace: true }), 2500) }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 40px rgba(0,0,0,0.4)' }
  const inputStyle = { display: 'block', width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16, letterSpacing: 3, color: 'var(--white)', textAlign: 'center', marginBottom: '2rem' }}>
          TICKSHIFT <span style={{ color: 'var(--cyan)', fontSize: 10, letterSpacing: 4 }}>ACADEMY</span>
        </div>
        <div style={cardStyle}>
          {!ready ? (
            <>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, color: 'var(--white)', marginBottom: 8 }}>Verifying link…</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Please wait while we validate your reset link.</p>
            </>
          ) : !success ? (
            <>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, color: 'var(--white)', marginBottom: 8 }}>Set new password</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1.5rem' }}>Choose a strong password to protect your account.</p>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>New password</label>
                  <input type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} autoFocus style={inputStyle} onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Confirm password</label>
                  <input type="password" placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                </div>
                {error && <div style={{ padding: '10px 12px', borderRadius: 8, marginBottom: '1rem', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ display: 'block', width: '100%', padding: '12px', background: loading ? 'rgba(15,111,255,0.5)' : 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13, letterSpacing: 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Saving…' : 'Set Password & Sign In'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, color: 'var(--white)', marginBottom: 12 }}>Password updated!</h2>
              <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)', color: 'var(--success)', fontSize: 13 }}>
                Redirecting you to your dashboard…
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
