import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// SVG Icons (inline — no external icon dep)
const Icons = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  courses: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  homework: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  ),
  hub: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  partners: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  students: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  content: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  signout: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
}

export default function Navbar() {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)

  const studentLinks = [
    { to: '/dashboard', label: 'Dashboard',  icon: Icons.dashboard },
    { to: '/courses',   label: 'Courses',    icon: Icons.courses   },
    { to: '/homework',  label: 'Assignments',icon: Icons.homework  },
    { to: '/hub',       label: 'Trading Hub',icon: Icons.hub       },
    { to: '/partners',  label: 'Partners',   icon: Icons.partners  },
  ]
  const adminLinks = [
    { to: '/admin',             label: 'Dashboard',  icon: Icons.dashboard },
    { to: '/admin/courses',     label: 'Courses',    icon: Icons.courses   },
    { to: '/admin/assignments', label: 'Assignments',icon: Icons.homework  },
    { to: '/admin/students',    label: 'Students',   icon: Icons.students  },
    { to: '/admin/content',     label: 'Hub Content',icon: Icons.content   },
  ]
  const links = isAdmin ? adminLinks : studentLinks

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (profile?.email?.[0] || '?').toUpperCase()

  useEffect(() => {
    function outside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  return (
    <>
      <nav className="apex-nav">
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 1.5rem',
          height: 62,
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
        }}>
          {/* Logo */}
          <button
            onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
              padding: '4px 0',
            }}
            aria-label="Go to dashboard"
          >
            {/* Logo mark — animated tick */}
            <div style={{
              width: 32, height: 32,
              borderRadius: 9,
              background: 'linear-gradient(135deg, var(--violet), var(--violet-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(139,92,246,0.35)',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: '0.18em',
                color: 'var(--white)',
                lineHeight: 1.1,
              }}>TICKSHIFT</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 8,
                letterSpacing: '0.3em',
                color: 'var(--violet-2)',
                marginTop: 1,
              }}>ACADEMY</div>
            </div>
          </button>

          {/* Desktop links */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/admin' || l.to === '/dashboard'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: '0.01em',
                  color: isActive ? 'var(--white)' : 'var(--muted)',
                  background: isActive ? 'rgba(139,92,246,0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'color 0.15s, background 0.15s',
                  whiteSpace: 'nowrap',
                })}
                onMouseEnter={e => {
                  if (!e.currentTarget.dataset.active) {
                    e.currentTarget.style.color = 'var(--silver)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.dataset.active) {
                    e.currentTarget.style.color = ''
                    e.currentTarget.style.background = ''
                  }
                }}
              >
                {l.icon}
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            {isAdmin && (
              <span className="badge badge--gold hide-mobile">Admin</span>
            )}

            {/* Avatar dropdown */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  width: 36, height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--violet), var(--violet-2))',
                  border: '2px solid rgba(139,92,246,0.3)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 12,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'box-shadow 0.2s',
                  boxShadow: menuOpen ? '0 0 0 3px rgba(139,92,246,0.2)' : 'none',
                }}
                aria-label="Account menu"
              >{initials}</button>

              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 'var(--radius)',
                  padding: '0.5rem',
                  minWidth: 220,
                  boxShadow: 'var(--shadow-lg), 0 0 40px rgba(139,92,246,0.06)',
                  animation: 'fadeUp 0.15s ease',
                  zIndex: 200,
                }}>
                  <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>
                      {profile?.full_name || 'Student'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{profile?.email}</div>
                  </div>
                  <button
                    onClick={async () => { setMenuOpen(false); await signOut() }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--danger)',
                      fontSize: 13,
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {Icons.signout}
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="mobile-menu-btn"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-2)',
                borderRadius: 8,
                cursor: 'pointer',
                color: 'var(--silver)',
                padding: '6px',
                display: 'none', // shown via CSS class
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? Icons.close : Icons.menu}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{
            borderTop: '1px solid var(--border)',
            background: 'rgba(6,6,10,0.96)',
            padding: '0.75rem 1.25rem 1.25rem',
            animation: 'fadeUp 0.15s ease',
          }}>
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/admin' || l.to === '/dashboard'}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0.8rem 0.5rem',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 14,
                  color: isActive ? 'var(--violet-2)' : 'var(--silver)',
                })}
              >
                {l.icon}
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </>
  )
}
