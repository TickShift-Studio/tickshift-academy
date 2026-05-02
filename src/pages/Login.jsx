import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

const wins = [
  { text: 'Eval passed in 4 trades — trading with Dre' },
  { text: '$1,500 payout — Lucid Trading (Jan 2026)' },
  { text: '$50K funded — Tradeify (Jan 2026)' },
]

const TICKERS_BASE = [
  { sym: 'NQ', val: '+1.24%', up: true },
  { sym: 'ES', val: '+0.87%', up: true },
  { sym: 'EUR/USD', val: '+0.42%', up: true },
  { sym: 'GC', val: '-0.31%', up: false },
  { sym: 'CL', val: '+1.56%', up: true },
  { sym: 'YM', val: '+0.73%', up: true },
  { sym: 'RTY', val: '-0.18%', up: false },
  { sym: 'MNQ', val: '+1.11%', up: true },
  { sym: 'MES', val: '+0.65%', up: true },
  { sym: 'BTC', val: '+2.30%', up: true },
  { sym: 'SI', val: '-0.44%', up: false },
  { sym: 'ZB', val: '+0.09%', up: true },
]
const tickers = [...TICKERS_BASE, ...TICKERS_BASE]

function AnimatedCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (window.innerWidth < 768) return
    const ctx = canvas.getContext('2d')
    let raf, W, H, pts = [], chart = [], frame = 0

    function init() {
      W = canvas.width = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
      pts = Array.from({ length: 20 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2,
        r: Math.random() * 1.2 + .4,
      }))
      chart = []
      let v = H * .52
      for (let i = 0; i <= W; i += 8) {
        v += (Math.random() - .5) * 3
        v = Math.max(H * .25, Math.min(H * .78, v))
        chart.push({ x: i, y: v })
      }
    }

    function draw() {
      frame++
      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(15,111,255,0.03)'
      ctx.lineWidth = 1
      for (let y = 0; y < H; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      if (frame % 2 === 0) {
        chart.forEach((p, i) => {
          if (i) {
            chart[i].y += (Math.random() - .5) * .8
            chart[i].y = Math.max(H * .2, Math.min(H * .8, chart[i].y))
          }
        })
      }
      if (chart.length > 1) {
        ctx.beginPath()
        ctx.moveTo(chart[0].x, chart[0].y)
        chart.forEach(p => ctx.lineTo(p.x, p.y))
        ctx.strokeStyle = 'rgba(15,111,255,0.18)'
        ctx.lineWidth = 1.5; ctx.stroke()
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath()
        const g = ctx.createLinearGradient(0, H * .2, 0, H)
        g.addColorStop(0, 'rgba(15,111,255,0.07)')
        g.addColorStop(1, 'rgba(15,111,255,0)')
        ctx.fillStyle = g; ctx.fill()
      }
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28)
        ctx.fillStyle = 'rgba(60,203,255,0.25)'; ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }

    init(); draw()
    const ro = new ResizeObserver(init); ro.observe(canvas)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
    />
  )
}

function WinBadge({ text, delay }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(60,203,255,0.06)',
      border: '1px solid rgba(60,203,255,0.16)',
      borderRadius: 100, padding: '6px 14px',
      animation: `fadeSlideIn 0.5s ease ${delay}s both`,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#2ECC71', flexShrink: 0,
        boxShadow: '0 0 6px #2ECC71, 0 0 12px rgba(46,204,113,0.4)',
      }} />
      <span style={{ fontSize: 10.5, color: '#C9D1DC', fontWeight: 500 }}>{text}</span>
    </div>
  )
}

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) setError(error.message)
        else navigate('/dashboard')
      } else {
        if (!fullName.trim()) { setError('Please enter your full name'); return }
        const { error } = await signUp(email, password, fullName)
        if (error) setError(error.message)
        else setSuccess('Account created! You can now sign in.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => ({
    display: 'block', width: '100%', padding: '10px 12px',
    background: 'rgba(5,14,34,0.85)',
    border: `1px solid ${focusedField === field ? '#0F6FFF' : 'rgba(60,203,255,0.12)'}`,
    borderRadius: 8, color: '#F8FFFF',
    fontFamily: "'Open Sans', sans-serif", fontSize: 13,
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(15,111,255,0.15)' : 'none',
  })

  return (
    <div style={{
      minHeight: '100vh', background: '#08162E',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'Open Sans', sans-serif",
      display: 'flex', flexDirection: 'row', width: '100%',
    }}>
      <AnimatedCanvas />

      {/* LEFT SIDE */}
      <div style={{
        flex: 1, position: 'relative', zIndex: 2,
        padding: '2.5rem 2rem 0 3rem',
        display: 'flex', flexDirection: 'column', minWidth: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '3.5rem' }}>
          <Logo size={36} />
          <div>
            <div style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
              fontSize: 15, letterSpacing: 3.5, color: '#F8FFFF',
            }}>TICKSHIFT</div>
            <div style={{
              fontSize: 8, letterSpacing: 3.5, color: '#3CCBFF', fontWeight: 700, marginTop: 2,
            }}>ACADEMY</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.1rem' }}>
            <div style={{ width: 32, height: 1, background: 'linear-gradient(90deg, transparent, #3CCBFF)', opacity: .7 }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3.5, color: '#3CCBFF', textTransform: 'uppercase' }}>
              Elite Trading Mentorship
            </span>
          </div>

          <div style={{
            fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
            fontSize: 'clamp(26px, 3.8vw, 48px)', lineHeight: 1.05,
            color: '#F8FFFF', textTransform: 'uppercase', letterSpacing: -1, marginBottom: '0.35rem',
          }}>Shift Your Mind.</div>

          <div style={{
            fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
            fontSize: 'clamp(26px, 3.8vw, 48px)', lineHeight: 1.05,
            background: 'linear-gradient(90deg, #3CCBFF, #0F6FFF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase', letterSpacing: -1, marginBottom: '1.4rem',
          }}>Shift Your Money.</div>

          <p style={{ fontSize: 13, color: '#6E7B8F', lineHeight: 1.8, maxWidth: 420, marginBottom: '1.75rem' }}>
            The only trading mentorship built without the lies. Real systems, real funded
            traders — built by someone who did it first, because integrity still matters in this industry.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: '2rem' }}>
            {wins.map((w, i) => <WinBadge key={i} text={w.text} delay={i * 0.15} />)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
              fontSize: 14, color: '#fff',
              border: '2px solid rgba(60,203,255,0.35)',
              boxShadow: '0 0 20px rgba(15,111,255,0.3)', flexShrink: 0,
            }}>AE</div>
            <div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: '#F8FFFF' }}>
                Andre Evans Jr (AnixWallo)
              </div>
              <div style={{ fontSize: 9, color: '#6E7B8F', letterSpacing: 1.5, marginTop: 3 }}>
                FUNDED TRADER · LEAD MENTOR
              </div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(60,203,255,0.08)',
          marginTop: '2rem', paddingTop: '.8rem',
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            display: 'flex', gap: '2.5rem', whiteSpace: 'nowrap',
            animation: 'tickscroll 28s linear infinite', width: 'max-content',
          }}>
            {tickers.map((t, i) => (
              <span key={i} style={{ fontSize: 10.5, color: '#6E7B8F', letterSpacing: .4 }}>
                <span style={{ color: '#C9D1DC', fontWeight: 600 }}>{t.sym}</span>
                {' '}
                <span style={{ color: t.up ? '#2ECC71' : '#E74C3C', fontWeight: 700 }}>{t.val}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={{
        width: 420, flexShrink: 0, position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 2.5rem 2rem 1.5rem', minHeight: '100vh',
      }}>
        <div style={{
          width: '100%', background: '#0B1628',
          border: '1px solid rgba(60,203,255,0.25)',
          borderRadius: 20, padding: '2.25rem',
          boxShadow: '0 0 60px rgba(15,111,255,0.12), 0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 4 }}>
              <Logo size={28} />
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: 2.5, color: '#F8FFFF' }}>
                TICKSHIFT
              </div>
            </div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: '#3CCBFF', fontWeight: 700 }}>ACADEMY</div>
          </div>

          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, #0F6FFF 30%, #3CCBFF 50%, #0F6FFF 70%, transparent)',
            opacity: .4, margin: '.75rem 0 1.5rem',
          }} />

          <div style={{ display: 'flex', gap: 6, marginBottom: '1.4rem' }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '9px', borderRadius: 8,
                  border: mode === m ? '1px solid rgba(60,203,255,0.45)' : '1px solid rgba(60,203,255,0.1)',
                  background: mode === m ? 'rgba(15,111,255,0.2)' : 'rgba(8,22,46,0.4)',
                  color: mode === m ? '#3CCBFF' : '#6E7B8F',
                  fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
                  fontSize: 10.5, letterSpacing: 1, cursor: 'pointer', transition: 'all .2s',
                  boxShadow: mode === m ? '0 0 12px rgba(60,203,255,0.1)' : 'none',
                }}
              >
                {m === 'login' ? 'SIGN IN' : 'JOIN NOW'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div style={{ marginBottom: 13 }}>
                <label style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
                  color: '#6E7B8F', textTransform: 'uppercase', display: 'block', marginBottom: 5,
                }}>Full Name</label>
                <input
                  style={inputStyle('name')}
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: 13 }}>
              <label style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
                color: '#6E7B8F', textTransform: 'uppercase', display: 'block', marginBottom: 5,
              }}>Email Address</label>
              <input
                style={inputStyle('email')}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
                color: '#6E7B8F', textTransform: 'uppercase', display: 'block', marginBottom: 5,
              }}>Password</label>
              <input
                style={inputStyle('password')}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.28)',
                borderRadius: 8, padding: '10px 13px', fontSize: 12, color: '#E74C3C', marginBottom: 14,
              }}>{error}</div>
            )}
            {success && (
              <div style={{
                background: 'rgba(46,204,113,0.07)', border: '1px solid rgba(46,204,113,0.28)',
                borderRadius: 8, padding: '10px 13px', fontSize: 12, color: '#2ECC71', marginBottom: 14,
              }}>{success}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block', width: '100%', padding: '13px',
                background: loading ? 'rgba(13,95,224,0.7)' : 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
                border: 'none', borderRadius: 9, color: '#fff',
                fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
                fontSize: 12, letterSpacing: 2.5,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(15,111,255,0.35)',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.opacity = '.9' }}
              onMouseLeave={e => { e.target.style.opacity = '1' }}
            >
              {loading ? 'PLEASE WAIT...' : mode === 'login' ? 'ACCESS ACADEMY' : 'JOIN THE ACADEMY'}
            </button>
          </form>

          <p style={{ fontSize: 11, color: '#3a4a5e', textAlign: 'center', marginTop: '1rem' }}>
            {mode === 'login' ? 'New here? ' : 'Have an account? '}
            <span
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
              style={{ color: '#3CCBFF', cursor: 'pointer', fontWeight: 600 }}
            >
              {mode === 'login' ? 'Create your account' : 'Sign in'}
            </span>
          </p>

          {mode === 'login' && (
            <p style={{ fontSize: 11, color: '#3a4a5e', textAlign: 'center', marginTop: '0.5rem' }}>
              
                href="/forgot-password"
                style={{ color: '#4A6FA5', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3CCBFF' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#4A6FA5' }}
              >Forgot your password?</a>
            </p>
          )}

          <div style={{
            display: 'flex', justifyContent: 'center', gap: 10,
            marginTop: '1.4rem', paddingTop: '1.1rem',
            borderTop: '1px solid rgba(60,203,255,0.07)',
          }}>
            {[
              { label: '▶', href: 'https://www.youtube.com/@AnixWallo', title: 'YouTube' },
              { label: 'IG', href: 'https://instagram.com', title: 'Instagram' },
              { label: 'DC', href: 'https://discord.com', title: 'Discord' },
            ].map(s => (
              
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={s.title}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  border: '1px solid rgba(60,203,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none', color: '#6E7B8F', fontSize: 12, transition: 'all .15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(60,203,255,0.4)'
                  e.currentTarget.style.color = '#3CCBFF'
                  e.currentTarget.style.background = 'rgba(60,203,255,0.06)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(60,203,255,0.12)'
                  e.currentTarget.style.color = '#6E7B8F'
                  e.currentTarget.style.background = 'transparent'
                }}
              >{s.label}</a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tickscroll {
          from { transform: translateX(0) }
          to { transform: translateX(-50%) }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px) }
          to { opacity: 1; transform: translateY(0) }
        }
        input::placeholder { color: #2a3a52 !important }
      `}</style>
    </div>
  )
}
