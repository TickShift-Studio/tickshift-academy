import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'

function StatCard({ label, value, accent = 'var(--blue)', sub }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem 1.4rem' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 32, color: accent, lineHeight: 1, marginBottom: sub ? 6 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  )
}

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
        students: students.count ?? 0,
        courses: courses.count ?? 0,
        lessons: lessons.count ?? 0,
        progress: progress.count ?? 0,
        assignments: assignments.count ?? 0,
        submissions: submissions.count ?? 0,
      })

      const { data: recentStudents } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecent(recentStudents || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 4 }}>Admin</div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 28, color: 'var(--white)', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Overview of TickShift Academy.</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', height: 100 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Students" value={stats.students} accent="var(--blue)" />
          <StatCard label="Courses" value={stats.courses} accent="var(--cyan)" />
          <StatCard label="Lessons" value={stats.lessons} accent="var(--silver)" />
          <StatCard label="Completions" value={stats.progress} accent="var(--success)" />
          <StatCard label="Assignments" value={stats.assignments} accent="var(--blue)" />
          <StatCard label="Submissions" value={stats.submissions} accent="var(--cyan)" />
        </div>
      )}

      {/* Quick nav */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Manage Courses', sub: 'Add lessons & content', path: '/admin/courses', icon: '📚' },
            { label: 'Assignments', sub: 'Create & review work', path: '/admin/assignments', icon: '📝' },
            { label: 'Students', sub: 'Invite & manage access', path: '/admin/students', icon: '👥' },
          ].map(q => (
            <div key={q.path} onClick={() => navigate(q.path)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,111,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{q.icon}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--white)', marginBottom: 3 }}>{q.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{q.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent students */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>Recent Students</div>
          <button onClick={() => navigate('/admin/students')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--cyan)', fontWeight: 600, fontFamily: 'var(--font-head)' }}>View all →</button>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {recent.length === 0 ? (
            <div style={{ padding: '1.5rem', fontSize: 13, color: 'var(--muted)' }}>No students yet.</div>
          ) : (
            recent.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 1.25rem', borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-dim)', border: '1px solid rgba(15,111,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--blue)', flexShrink: 0 }}>
                  {(s.full_name || s.email || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.full_name || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
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
