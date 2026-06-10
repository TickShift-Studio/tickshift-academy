import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'

function Skel({ h, w = '100%', r = 6 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />
}

const QUICK_ACTIONS = [
  {
    label: 'Courses', sub: 'Add lessons & content', path: '/admin/courses',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    label: 'Assignments', sub: 'Create & review work', path: '/admin/assignments',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="15" y2="17"/>
      </svg>
    ),
  },
  {
    label: 'Students', sub: 'Invite & manage access', path: '/admin/students',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Hub Content', sub: 'Publish trading articles', path: '/admin/content',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats]     = useState(null)
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [students, courses, lessons, progress, assignments, submissions] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('lesson_progress').select('id', { count: 'exact', head: true }),
        supabase.from('assignments').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        students:    students.count    ?? 0,
        courses:     courses.count     ?? 0,
        lessons:     lessons.count     ?? 0,
        progress:    progress.count    ?? 0,
        assignments: assignments.count ?? 0,
        submissions: submissions.count ?? 0,
      })
      const { data: recentStudents } = await supabase
        .from('profiles').select('id, full_name, email, created_at')
        .order('created_at', { ascending: false }).limit(5)
      setRecent(recentStudents || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold-2)', marginBottom: 6 }}>
          Admin
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(26px, 4vw, 38px)', letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, var(--white) 0%, rgba(248,248,250,0.65) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 6,
        }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Overview of TickShift Academy.</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {loading ? (
          [0,1,2,3,4,5].map(i => (
            <div key={i} className="glow-card" style={{ padding: '1.25rem', height: 100, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'default' }}>
              <Skel h={10} w="60%" />
              <Skel h={28} w="45%" r={8} />
            </div>
          ))
        ) : (
          [
            { label: 'Students',    value: stats.students,    color: 'var(--violet-2)' },
            { label: 'Courses',     value: stats.courses,     color: 'var(--cyan)' },
            { label: 'Lessons',     value: stats.lessons,     color: 'var(--silver)' },
            { label: 'Completions', value: stats.progress,    color: '#34D399' },
            { label: 'Assignments', value: stats.assignments, color: 'var(--gold-2)' },
            { label: 'Submissions', value: stats.submissions, color: 'var(--violet-2)' },
          ].map(s => (
            <div key={s.label} className="glow-card" style={{ padding: '1.25rem 1.4rem', cursor: 'default' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                {s.label}
              </div>
              <div className="stat-num" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="section-label">Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {QUICK_ACTIONS.map(q => (
            <div
              key={q.path}
              onClick={() => navigate(q.path)}
              className="glow-card"
              style={{ padding: '1.1rem 1.2rem', cursor: 'pointer' }}
            >
              <div style={{ color: 'var(--violet-2)', marginBottom: 10 }}>{q.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--white)', marginBottom: 3 }}>
                {q.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{q.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent students */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <p className="section-label" style={{ marginBottom: 0 }}>Recent Students</p>
          <button
            onClick={() => navigate('/admin/students')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
              color: 'var(--violet-2)',
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
            }}
          >
            View all
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {loading ? (
            [0,1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <Skel h={34} w={34} r={99} />
                <div style={{ flex: 1 }}>
                  <Skel h={12} w="45%" />
                  <div style={{ marginTop: 6 }}><Skel h={10} w="30%" /></div>
                </div>
              </div>
            ))
          ) : recent.length === 0 ? (
            <div style={{ padding: '1.5rem', fontSize: 13, color: 'var(--muted)' }}>No students yet.</div>
          ) : (
            recent.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 1.25rem',
                  borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--violet-dim)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  color: 'var(--violet-2)',
                }}>
                  {(s.full_name || s.email || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.full_name || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.email}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0 }}>
                  {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
