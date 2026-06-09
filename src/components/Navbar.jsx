import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Navbar() {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)

  const studentLinks = [
    { to: '/dashboard',  label: 'Dashboard' },
    { to: '/courses',    label: 'Courses'   },
    { to: '/homework',   label: 'Assignments' },
    { to: '/partners',   label: 'Partners'  },
  ]
  const adminLinks = [
    { to: '/admin',             label: 'Dashboard'   },
    { to: '/admin/courses',     label: 'Courses'     },
    { to: '/admin/assignments', label: 'Assignments' },
    { to: '/admin/students',    label: 'Students'    },
  ]
  const links = isAdmin ? adminLinks : studentLinks

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const linkStyle = ({ isActive }) => ({
    fontSize: 13,
    fontFamily: 'var(--font-head)',
    fontWeight: 600,
    letterSpacing: 0.3,
    color: isActive ? 'var(--white)' : 'var(--muted)',
    padding: '6px 0',
    borderBottom: isActive ? '2px solid var(--blue)' : '2px solid transparent',
    transition: 'color 0.15s, border-color 0.15s',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  })

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,22,46,0.97)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 1.5rem',
          height: 60,
          display: 'flex', alignItems: 'center', gap: '2rem',
        }}>
          {/* Logo */}
          <div
            onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
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

          {/* Desktop nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flex: 1 }} className="desktop-nav">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === '/admin' || l.to === '/dashboard'} style={linkStyle}>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            {isAdmin && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 2,
                color: 'var(--cyan)', background: 'rgba(60,203,255,0.1)',
                border: '1px solid rgba(60,203,255,0.25)',
                borderRadius: 20, padding: '3px 9px', textTransform: 'uppercase',
              }}>Admin</span>
            )}

            {/* Avatar + dropdown */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--blue), var(--cyan))',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-head)', fontWeight: 700,
                  fontSize: 12, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >{initials}</button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '0.5rem',
                  minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  animation: 'fadeUp 0.15s ease',
                }}>
                  <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)', fontFamily: 'var(--font-head)' }}>
                      {profile?.full_name || 'Student'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{profile?.email}</div>
                  </div>
                  <button
                    onClick={async () => { setMenuOpen(false); await signOut() }}
                    style={{
                      display: 'flex', width: '100%', padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none',
                      cursor: 'pointer', color: 'var(--danger)', fontSize: 13,
                      fontFamily: 'var(--font-body)', fontWeight: 600, textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >Sign out</button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="mobile-menu-btn"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--silver)', fontSize: 20, padding: 4 }}
            >☰</button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            padding: '0.75rem 1.5rem',
          }} className="mobile-nav">
            {links.map(l => (
              <NavLink
                key={l.to} to={l.to}
                end={l.to === '/admin' || l.to === '/dashboard'}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: 'block', padding: '0.65rem 0',
                  fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14,
                  color: isActive ? 'var(--blue)' : 'var(--silver)',
                  borderBottom: '1px solid var(--border)',
                })}
              >{l.label}</NavLink>
            ))}
          </div>
        )}
      </nav>

      <style>{`
        .desktop-nav { display: flex !important; }
        .mobile-menu-btn { display: none !important; }
        .mobile-nav { display: none; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-nav { display: block !important; }
        }
      `}</style>
    </>
  )
}
