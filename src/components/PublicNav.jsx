import { useNavigate } from 'react-router-dom'

export default function PublicNav() {
  const navigate = useNavigate()

  return (
    <nav className="apex-nav">
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 1.5rem',
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate('/hub')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
          }}
          aria-label="Trading Hub home"
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--violet), var(--violet-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(139,92,246,0.35)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.18em', color: 'var(--white)', lineHeight: 1.1 }}>TICKSHIFT</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 8, letterSpacing: '0.3em', color: 'var(--violet-2)', marginTop: 1 }}>ACADEMY</div>
          </div>
        </button>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
              color: 'var(--muted)', padding: '6px 10px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: 13 }}
          >
            Join Academy
          </button>
        </div>
      </div>
    </nav>
  )
}
