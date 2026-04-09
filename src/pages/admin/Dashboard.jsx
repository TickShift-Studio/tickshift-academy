import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, courses: 0, lessonsWatched: 0, submissions: 0 })
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [allProgress, setAllProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [st, co, as, pr, su] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.from('courses').select('*, lessons(id)').order('position'),
        supabase.from('assignments').select('*, courses(title, color)').order('created_at', { ascending: false }),
        supabase.from('lesson_progress').select('user_id, lesson_id'),
        supabase.from('submissions').select('id'),
      ])
      setStudents(st.data || [])
      setCourses(co.data || [])
      setAssignments(as.data || [])
      setAllProgress(pr.data || [])
      setStats({
        students: st.data?.length || 0,
        courses: co.data?.length || 0,
        lessonsWatched: pr.data?.length || 0,
        submissions: su.data?.length || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  function studentPct(studentId) {
    const totalLessons = courses.reduce((a, c) => a + (c.lessons?.length || 0), 0)
    if (!totalLessons) return 0
    const done = allProgress.filter(p => p.user_id === studentId).length
    return Math.round((done / totalLessons) * 100)
  }

  const ini = name => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div className="main-content">
      <div className="page-title">Mentor Dashboard</div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-label">Students</div>
          <div className="stat-value accent" style={{ color: 'var(--cyan)' }}>{stats.students}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Courses Live</div>
          <div className="stat-value">{stats.courses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lessons Watched</div>
          <div className="stat-value accent" style={{ color: 'var(--cyan)' }}>{stats.lessonsWatched}</div>
        </div>
      </div>

      {/* Student progress */}
      <div className="section-label">Student Progress</div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {students.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--slate)' }}>No students have signed up yet.</p>
        )}
        {students.map(s => {
          const p = studentPct(s.id)
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="avatar">{ini(s.full_name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-head)', marginBottom: 5 }}>
                  {s.full_name}
                </div>
                <div className="progress-track" style={{ marginTop: 0 }}>
                  <div className="progress-fill" style={{ width: `${p}%` }} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 700, minWidth: 48, textAlign: 'right' }}>
                {p}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Assignments */}
      <div className="section-label">Active Assignments</div>
      <div className="card">
        {assignments.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--slate)' }}>No assignments created yet.</p>
        )}
        {assignments.map(a => (
          <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontFamily: 'var(--font-head)', fontSize: 13 }}>{a.title}</div>
              {a.due_date && <span style={{ fontSize: 11, color: 'var(--slate)' }}>Due {a.due_date}</span>}
            </div>
            {a.courses && <span className="badge badge-blue" style={{ marginTop: 5 }}>{a.courses.title}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
