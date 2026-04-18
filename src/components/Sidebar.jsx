import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const studentNav = [
  { path: '/dashboard',  label: 'Dashboard',       icon: '◆' },
  { path: '/courses',    label: 'My Courses',       icon: '▶' },
  { path: '/homework',   label: 'Assignments',      icon: '✎' },
  { path: '/partners',   label: 'Partners & Deals', icon: '★' },
]

const adminNav = [
  { path: '/admin',             label: 'Dashboard',   icon: '◆' },
  { path: '/admin/courses',     label: 'Courses',     icon: '▶' },
  { path: '/admin/assignments', label: 'Assignments', icon: '✎' },
  { path: '/admin/students',    label: 'Students',    icon: '●' },
]

export default function Sidebar() {
  const { profile, isAdmin, signOut } = useAuth()
  const navItems = isAdmin ? adminNav : studentNav

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  async function handleLogout(e) {
    e.preventDefault()
    await signOut()
  }

  return (
    <aside style={{ width: 230, flexShrink: 0, background: '#0B1628', borderRight: '1px solid rgba(15,111,255,0.12)', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(15,111,255,0.08)' }}>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: 1 }}>TICKSHIFT</span>
        {isAdmin && <span style={{ display: 'block', fontSize: 10, color: '#3CCBFF', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2, fontWeight: 700 }}>Admin</span>}
      </div>

      <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard' || item.path === '/admin'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.6rem 0.75rem', borderRadius: 9, marginBottom: 2,
              textDecoration: 'none',
              background: isActive ? 'rgba(15,111,255,0.18)' : 'transparent',
              color: isActive ? '#3CCBFF' : '#8CA0BE',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: isActive ? 700 : 500,
              fontSize: 13, transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(15,111,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name ?? 'Student'}
            </div>
            <div style={{ fontSize: 10, color: '#3CCBFF', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              {isAdmin ? 'Admin' : 'Student'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '0.55rem', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 8, color: '#FF6B6B', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 0.5, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.16)'; e.currentTarget.style.borderColor = 'rgba(255,59,48,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,59,48,0.2)' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
