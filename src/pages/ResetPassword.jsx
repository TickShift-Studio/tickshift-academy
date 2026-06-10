import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import AnimatedBg from '../components/AnimatedBg'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [ready, setReady]       = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const [showCf, setShowCf]     = useState(false)

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

  const EyeIcon = ({ open }) => open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

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
          {!ready ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, border: '2px solid rgba(139,92,246,0.2)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.85s linear infinite', flexShrink: 0 }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--white)' }}>Verifying link…</h2>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Please wait while we validate your reset link.</p>
            </>
          ) : !success ? (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em', color: 'var(--white)', marginBottom: 8 }}>Set new password</h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '1.75rem', lineHeight: 1.65 }}>
                Choose a strong password to protect your account.
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="field-label">New password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="field-input"
                      autoFocus
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--silver)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
                    >
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="field-label">Confirm password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCf ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="field-input"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowCf(p => !p)}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--silver)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
                    >
                      <EyeIcon open={showCf} />
                    </button>
                  </div>
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
                      Saving…
                    </>
                  ) : 'Set Password & Sign In'}
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
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--white)', marginBottom: 10 }}>Password updated!</h2>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#6EE7B7', fontSize: 13.5, lineHeight: 1.7 }}>
                Redirecting you to your dashboard…
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
