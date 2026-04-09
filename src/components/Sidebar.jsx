import { NavLink } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const studentNav = [
  { path: '/dashboard', label: 'Dashboard', icon: '◈' },
  { path: '/courses', label: 'My Courses', icon: '▶' },
  { path: '/homework', label: 'Assignments', icon: '✎' },
]

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: '◈' },
  { path: '/admin/courses', label: 'Courses', icon: '▶' },
  { path: '/admin/assignments', label: 'Assignments', icon: '✎' },
  { path: '/admin/students', label: 'Students', icon: '◉' },
]

export default function Sidebar() {
  const { profile, isAdmin, signOut } = useAuth()
  const navItems = isAdmin ? adminNav : studentNav
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--charcoal)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <Logo size={34} />
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, letterSpacing: 2 }}>
            TICKSHIFT
          </div>
          <div style={{ fontSize: 9, letterSpacing: 2.5, color: 'var(--cyan)', fontWeight: 700, marginTop: 1 }}>
            ACADEMY
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0.6rem 0', flex: 1 }}>
        {navItems.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/admin'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 1rem',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              color: isActive ? 'var(--cyan)' : 'var(--slate)',
              background: isActive ? 'rgba(15,111,255,0.13)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--blue)' : '3px solid transparent',
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className="avatar">{initials}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)' }}>
              {profile?.full_name || 'Student'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--slate)', marginTop: 1 }}>
              {isAdmin ? 'Mentor' : 'Student'}
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="btn btn-sm"
          style={{ width: '100%', fontSize: 11, color: 'var(--slate)' }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
