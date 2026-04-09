import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else navigate('/dashboard')
    } else {
      if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return }
      const { error } = await signUp(email, password, fullName)
      if (error) setError(error.message)
      else setSuccessMsg('Account created! Check your email to confirm, then sign in.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: '2rem' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: '0.5rem' }}>
          <Logo size={38} />
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, letterSpacing: 2 }}>TICKSHIFT</div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: 'var(--cyan)', fontWeight: 700 }}>ACADEMY</div>
          </div>
        </div>

        <div className="glow-divider" />

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccessMsg('') }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                border: mode === m ? '1px solid rgba(60,203,255,0.4)' : '1px solid var(--border)',
                background: mode === m ? 'rgba(15,111,255,0.18)' : 'rgba(8,22,46,0.5)',
                color: mode === m ? 'var(--cyan)' : 'var(--slate)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: 0.5,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#E74C3C', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="success-box" style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: 12, color: 'var(--success)' }}>{successMsg}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ padding: '11px', fontSize: 13, letterSpacing: 1, marginTop: 4 }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: 'var(--slate)', textAlign: 'center', marginTop: '1.25rem', lineHeight: 1.6 }}>
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <span
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccessMsg('') }}
            style={{ color: 'var(--cyan)', cursor: 'pointer' }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}
