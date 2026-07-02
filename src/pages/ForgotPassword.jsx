import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setError(''); setLoading(true)
    try {
      const { error: err } = await sendPasswordReset(email.trim())
      if (err) setError(err.message)
      else setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16, letterSpacing: 3, color: 'var(--white)', textAlign: 'center', marginBottom: '2rem' }}>
          TICKSHIFT <span style={{ color: 'var(--cyan)', fontSize: 10, letterSpacing: 4 }}>ACADEMY</span>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 40px rgba(0,0,0,0.4)' }}>
          {!sent ? (
            <>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, color: 'var(--white)', marginBottom: 8 }}>Reset password</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Enter your email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Email</label>
                <input
                  type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} autoFocus
                  style={{ display: 'block', width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                />
                {error && <div style={{ padding: '10px 12px', borderRadius: 8, marginTop: '0.75rem', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ display: 'block', width: '100%', padding: '12px', marginTop: '1.25rem', background: loading ? 'rgba(15,111,255,0.5)' : 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13, letterSpacing: 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, color: 'var(--white)', marginBottom: 12 }}>Check your inbox</h2>
              <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)', color: 'var(--success)', fontSize: 13, lineHeight: 1.6 }}>
                If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly. Check spam if you don't see it.
              </div>
            </>
          )}
          <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: 'var(--muted)', transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
          >← Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
