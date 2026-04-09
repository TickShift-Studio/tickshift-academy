import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [progress, setProgress] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, a, p, s] = await Promise.all([
        supabase.from('courses').select('*, lessons(id)').order('position'),
        supabase.from('assignments').select('*, courses(title, color)'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', profile.id),
        supabase.from('submissions').select('assignment_id').eq('user_id', profile.id),
      ])
      setCourses(c.data || [])
      setAssignments(a.data || [])
      setProgress(p.data?.map(r => r.lesson_id) || [])
      setSubmissions(s.data?.map(r => r.assignment_id) || [])
      setLoading(false)
    }
    if (profile) load()
  }, [profile])

  const totalLessons = courses.reduce((a, c) => a + (c.lessons?.length || 0), 0)
  const completedLessons = progress.length
  const pendingHW = assignments.filter(a => !submissions.includes(a.id)).length

  function pct(course) {
    const total = course.lessons?.length || 0
    if (!total) return 0
    const done = course.lessons.filter(l => progress.includes(l.id)).length
    return Math.round((done / total) * 100)
  }

  const COLORS = ['badge-blue', 'badge-cyan', 'badge-silver', 'badge-green']

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div className="main-content">
      <div className="page-title">
        Welcome back, {profile?.full_name?.split(' ')[0]} <span style={{ color: 'var(--cyan)' }}>—</span>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-label">Courses Enrolled</div>
          <div className="stat-value">{courses.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lessons Completed</div>
          <div className="stat-value">
            <span className="accent" style={{ color: 'var(--cyan)' }}>{completedLessons}</span>
            <span style={{ fontSize: 14, color: 'var(--slate)' }}> / {totalLessons}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Assignments</div>
          <div className="stat-value" style={{ color: pendingHW > 0 ? 'var(--cyan)' : 'var(--success)' }}>
            {pendingHW}
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="section-label">Continue Learning</div>
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {courses.map((course, i) => {
          const p = pct(course)
          return (
            <div
              key={course.id}
              className="card card-hover"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <span className={`badge ${COLORS[i % COLORS.length]}`} style={{ marginBottom: 8 }}>
                {course.title}
              </span>
              <p style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 10 }}>{course.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate)' }}>
                <span>{course.lessons?.length || 0} lessons</span>
                <span style={{ color: 'var(--cyan)' }}>{p}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${p}%` }} />
              </div>
            </div>
          )
        })}
        {courses.length === 0 && (
          <div className="info-box">No courses available yet. Check back soon!</div>
        )}
      </div>

      {/* Pending assignments */}
      {pendingHW > 0 && (
        <>
          <div className="section-label">Pending Assignments</div>
          <div className="card">
            {assignments.filter(a => !submissions.includes(a.id)).map(a => (
              <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontFamily: 'var(--font-head)', fontSize: 13, marginBottom: 4 }}>
                      {a.title}
                    </div>
                    {a.courses && (
                      <span className="badge badge-blue">{a.courses.title}</span>
                    )}
                    <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: 6 }}>
                      {a.description?.substring(0, 80)}...
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--slate)' }}>Due {a.due_date}</div>
                    <button
                      className="btn btn-sm"
                      style={{ color: 'var(--cyan)', borderColor: 'rgba(60,203,255,0.3)', marginTop: 6 }}
                      onClick={() => navigate('/homework')}
                    >
                      Submit →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
