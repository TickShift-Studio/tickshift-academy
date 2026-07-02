import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
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
        else navigate('/')  // AppRoutes will redirect to /admin or /dashboard based on role
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <Logo size={48} />
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 22, letterSpacing: 3, color: 'var(--white)', marginTop: 10 }}>TICKSHIFT</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 9, letterSpacing: 4, color: 'var(--cyan)', marginTop: 3 }}>ACADEMY</div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 40px rgba(0,0,0,0.4)' }}>

          {/* Tab toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4, marginBottom: '1.5rem' }}>
            {[['login', 'Sign In'], ['signup', 'Create Account']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: mode === m ? 'var(--blue)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--muted)',
                  fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, letterSpacing: 0.5,
                  transition: 'all 0.2s',
                }}
              >{label}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <Field label="Full Name">
                <Input type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </Field>
            )}
            <Field label="Email">
              <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password">
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </Field>

            {error   && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <button
              type="submit" disabled={loading}
              style={{
                display: 'block', width: '100%', padding: '13px', marginTop: '0.25rem',
                background: loading ? 'rgba(15,111,255,0.5)' : 'var(--blue)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 800,
                fontSize: 13, letterSpacing: 1.5, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >{loading ? 'Please wait…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
          </form>

          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--muted)', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--cyan)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
              >Forgot your password?</Link>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: 'var(--muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
            style={{ color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600 }}
          >{mode === 'login' ? 'Join now' : 'Sign in'}</span>
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input(props) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        display: 'block', width: '100%', padding: '10px 12px',
        background: 'rgba(0,0,0,0.25)',
        border: `1px solid ${focused ? 'var(--blue)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 'var(--radius-sm)', color: 'var(--white)',
        fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
        transition: 'border-color 0.15s',
        boxShadow: focused ? '0 0 0 3px rgba(15,111,255,0.12)' : 'none',
      }}
    />
  )
}

function Alert({ type, children }) {
  const isError = type === 'error'
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '1rem',
      background: isError ? 'rgba(231,76,60,0.08)' : 'rgba(46,204,113,0.08)',
      border: `1px solid ${isError ? 'rgba(231,76,60,0.3)' : 'rgba(46,204,113,0.3)'}`,
      color: isError ? 'var(--danger)' : 'var(--success)',
      fontSize: 13,
    }}>{children}</div>
  )
}
