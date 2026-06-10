import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AnimatedBg from '../components/AnimatedBg'

export default function Login() {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password)
        if (err) setError(err.message)
        else navigate('/')
      } else {
        if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return }
        const { error: err } = await signUp(email, password, fullName)
        if (err) setError(err.message)
        else setSuccess('Account created! You can now sign in.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
      position: 'relative',
    }}>
      <AnimatedBg />

      {/* Centered card */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, animation: 'fadeUp 0.4s ease' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 15,
            background: 'linear-gradient(135deg, var(--violet), var(--violet-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(139,92,246,0.45)',
            marginBottom: 16,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: '0.14em',
            background: 'linear-gradient(135deg, var(--white) 0%, rgba(248,248,250,0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>TICKSHIFT</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 9,
            letterSpacing: '0.45em',
            color: 'var(--violet-2)',
            marginTop: 3,
          }}>ACADEMY</div>
          <p style={{
            marginTop: 12,
            fontSize: 13,
            color: 'var(--muted)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            {mode === 'login' ? 'Sign in to your trading portal' : 'Create your free account'}
          </p>
        </div>

        {/* Glass card */}
        <div style={{
          background: 'rgba(15,15,23,0.7)',
          border: '1px solid rgba(139,92,246,0.15)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>

          {/* Toggle tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            padding: 4,
            marginBottom: '1.75rem',
          }}>
            {[['login', 'Sign In'], ['signup', 'Sign Up']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === m
                    ? 'linear-gradient(135deg, var(--violet), var(--violet-2))'
                    : 'transparent',
                  color: mode === m ? '#fff' : 'var(--muted)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '0.02em',
                  transition: 'all 0.2s',
                  boxShadow: mode === m ? '0 2px 12px rgba(139,92,246,0.3)' : 'none',
                }}
              >{label}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <LoginField label="Full Name">
                <input
                  className="field-input"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </LoginField>
            )}
            <LoginField label="Email">
              <input
                className="field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </LoginField>
            <LoginField label="Password">
              <div style={{ position: 'relative' }}>
                <input
                  className="field-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center',
                  }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </LoginField>

            {error   && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '13px', marginTop: 4, fontSize: 14, letterSpacing: '0.06em' }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                  Please wait…
                </>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <Link
                to="/forgot-password"
                style={{ fontSize: 13, color: 'var(--muted)', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--violet-2)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
              >
                Forgot your password?
              </Link>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 13, color: 'var(--muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
            style={{ color: 'var(--violet-2)', cursor: 'pointer', fontWeight: 600, transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--violet-2)' }}
          >
            {mode === 'login' ? 'Join now' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}

function LoginField({ label, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

function Alert({ type, children }) {
  const isErr = type === 'error'
  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
      background: isErr ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
      border: `1px solid ${isErr ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
      color: isErr ? '#F87171' : '#34D399',
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {isErr ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      {children}
    </div>
  )
}
