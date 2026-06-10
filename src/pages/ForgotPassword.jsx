import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AnimatedBg from '../components/AnimatedBg'

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
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <AnimatedBg />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, animation: 'fadeUp 0.35s ease' }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--violet), var(--violet-2))',
            boxShadow: '0 0 32px rgba(139,92,246,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.18em', color: 'var(--white)', lineHeight: 1.1 }}>TICKSHIFT</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 9, letterSpacing: '0.3em', color: 'var(--violet-2)', marginTop: 2 }}>ACADEMY</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(15,15,23,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139,92,246,0.18)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.25rem 2rem',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.5)',
        }}>
          {!sent ? (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em', color: 'var(--white)', marginBottom: 8 }}>
                Reset password
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '1.75rem', lineHeight: 1.65 }}>
                Enter your email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="field-input"
                    autoFocus
                  />
                </div>
                {error && (
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', fontSize: 13 }}>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
                  {loading ? (
                    <>
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                      Sending…
                    </>
                  ) : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 1rem' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--white)', marginBottom: 10 }}>Check your inbox</h2>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#6EE7B7', fontSize: 13.5, lineHeight: 1.7 }}>
                If an account exists for <strong style={{ color: 'var(--white)' }}>{email}</strong>, you'll receive a reset link shortly. Check spam if you don't see it.
              </div>
            </>
          )}

          <Link
            to="/login"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '1.5rem', fontSize: 13, color: 'var(--muted)', transition: 'color 0.15s', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
