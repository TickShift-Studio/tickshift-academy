import { NavLink } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const studentNav = [
  { path: '/dashboard', label: 'Dashboard', icon: '◈' },
  { path: '/courses', label: 'My Courses', icon: '▶' },
  { path: '/homework', label: 'Assignments', icon: '✎' },
  { path: '/partners', label: 'Partners & Deals', icon: '★' },
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
      width: 230, flexShrink: 0,
      background: '#0B1628',
      borderRight: '1px solid rgba(15,111,255,0.12)',
      display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative',
    }}>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: 'linear-gradient(180deg, transparent 0%, rgba(15,111,255,0.2) 40%, rgba(60,203,255,0.15) 60%, transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ padding: '1.35rem 1.1rem 1.25rem', borderBottom: '1px solid rgba(15,111,255,0.1)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <Logo size={36} />
        <div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 3, color: '#F8FFFF' }}>TICKSHIFT</div>
          <div style={{ fontSize: 7.5, letterSpacing: 3.5, color: '#3CCBFF', fontWeight: 700, marginTop: 2 }}>ACADEMY</div>
        </div>
      </div>
      <div style={{ padding: '1.1rem 1.1rem 0.4rem', fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'rgba(110,123,143,0.7)', textTransform: 'uppercase' }}>
        {isAdmin ? 'Admin Panel' : 'Navigation'}
      </div>
      <nav style={{ padding: '0.25rem 0.5rem', flex: 1 }}>
        {navItems.map(({ path, label, icon }) => (
          <NavLink key={path} to={path} end={path === '/admin'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 9, marginBottom: 2,
              fontSize: 13, fontFamily: "'Open Sans', sans-serif",
              color: isActive ? '#3CCBFF' : '#6E7B8F',
              background: isActive ? 'rgba(15,111,255,0.14)' : 'transparent',
              border: isActive ? '1px solid rgba(15,111,255,0.2)' : '1px solid transparent',
              fontWeight: isActive ? 600 : 400, textDecoration: 'none', transition: 'all 0.15s',
            })}>
            {({ isActive }) => (
              <>
                <span style={{ opacity: isActive ? 1 : 0.6, fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                {label}
                {isActive && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#3CCBFF', boxShadow: '0 0 6px #3CCBFF' }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div style={{ margin: '0.5rem', padding: '0.9rem', background: 'rgba(15,111,255,0.06)', border: '1px solid rgba(15,111,255,0.1)', borderRadius: 10, marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 12, color: '#fff', border: '1.5px solid rgba(60,203,255,0.3)', flexShrink: 0 }}>{initials}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Montserrat', sans-serif", color: '#F8FFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || 'Student'}</div>
            <div style={{ fontSize: 9, color: '#3CCBFF', marginTop: 2, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{isAdmin ? '⚡ Mentor' : '🎓 Student'}</div>
          </div>
        </div>
        <button onClick={signOut}
          style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid rgba(110,123,143,0.25)', borderRadius: 7, cursor: 'pointer', fontSize: 11, color: '#6E7B8F', fontFamily: "'Open Sans', sans-serif", transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(231,76,60,0.3)'; e.currentTarget.style.color = '#E74C3C'; e.currentTarget.style.background = 'rgba(231,76,60,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(110,123,143,0.25)'; e.currentTarget.style.color = '#6E7B8F'; e.currentTarget.style.background = 'transparent' }}
        >Sign Out</button>
      </div>
    </aside>
  )
}
