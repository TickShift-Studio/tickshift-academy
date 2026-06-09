import { useNavigate } from 'react-router-dom'
import Logo from './Logo'

export default function PublicNav() {
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(8,22,46,0.97)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 1.5rem',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/hub')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <Logo size={32} />
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 14, letterSpacing: 2, color: 'var(--white)', lineHeight: 1 }}>
              TICKSHIFT
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 8, letterSpacing: 3, color: 'var(--cyan)', marginTop: 2 }}>
              ACADEMY
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13 }}
          >Sign in</button>
          <a
            href="https://whop.com/tickshift"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 18px', background: 'var(--blue)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >Join Academy →</a>
        </div>
      </div>
    </nav>
  )
}
