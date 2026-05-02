import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const S = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#08162E', padding: '1.5rem',
  },
  card: {
    width: '100%', maxWidth: 420,
    background: '#0B1628', border: '1px solid rgba(60,203,255,0.2)',
    borderRadius: 20, padding: '2.25rem',
    boxShadow: '0 0 60px rgba(15,111,255,0.10), 0 24px 60px rgba(0,0,0,0.6)',
  },
  logo: {
    fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 22,
    color: '#fff', letterSpacing: 1, marginBottom: '1.75rem', display: 'block',
  },
  title: {
    fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20,
    color: '#fff', marginBottom: 8,
  },
  subtitle: { fontSize: 13, color: '#6E84A3', marginBottom: '1.75rem', lineHeight: 1.5 },
  label: {
    display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
    color: '#3CCBFF', textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    width: '100%', background: 'rgba(15,111,255,0.06)',
    border: '1px solid rgba(60,203,255,0.2)', borderRadius: 10,
    padding: '0.75rem 1rem', color: '#fff', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  btn: {
    width: '100%', padding: '0.85rem', marginTop: '1.25rem',
    background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
    border: 'none', borderRadius: 10, color: '#fff',
    fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13,
    letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer',
  },
  error: {
    background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)',
    borderRadius: 8, padding: '0.65rem 0.9rem', color: '#FF6B6B',
    fontSize: 13, marginTop: '1rem',
  },
  success: {
    background: 'rgba(15,111,255,0.1)', border: '1px solid rgba(15,111,255,0.3)',
    borderRadius: 8, padding: '0.65rem 0.9rem', color: '#3CCBFF',
    fontSize: 13, marginTop: '1rem', lineHeight: 1.5,
  },
  back: {
    display: 'block', textAlign: 'center', marginTop: '1.25rem',
    fontSize: 13, color: '#6E84A3', textDecoration: 'none',
  },
}

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setError('')
    setLoading(true)
    try {
      const { error: err } = await sendPasswordReset(email.trim())
      if (err) setError(err.message)
      else setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <span style={S.logo}>TICKSHIFT</span>

        {!sent ? (
          <>
            <div style={S.title}>Reset your password</div>
            <div style={S.subtitle}>
              Enter the email address you use to sign in and we'll send you a link to reset your password.
            </div>
            <form onSubmit={handleSubmit}>
              <label style={S.label}>Email address</label>
              <input
                style={S.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
              {error && <div style={S.error}>{error}</div>}
              <button style={S.btn} disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={S.title}>Check your inbox</div>
            <div style={S.success}>
              If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              Check your spam folder if you don't see it within a few minutes.
            </div>
          </>
        )}

        <Link to="/login" style={S.back}>← Back to login</Link>
      </div>
    </div>
  )
}
