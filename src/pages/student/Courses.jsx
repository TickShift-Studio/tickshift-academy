import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

const COLORS = ['badge-blue', 'badge-cyan', 'badge-silver', 'badge-green']

export default function MyCourses() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, p] = await Promise.all([
        supabase.from('courses').select('*, lessons(id)').order('position'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', profile.id),
      ])
      setCourses(c.data || [])
      setProgress(p.data?.map(r => r.lesson_id) || [])
      setLoading(false)
    }
    if (profile) load()
  }, [profile])

  function pct(course) {
    const total = course.lessons?.length || 0
    if (!total) return 0
    const done = course.lessons.filter(l => progress.includes(l.id)).length
    return Math.round((done / total) * 100)
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div className="main-content">
      <div className="page-title">My Courses</div>
      <div className="grid-2">
        {courses.map((course, i) => {
          const p = pct(course)
          const done = course.lessons?.filter(l => progress.includes(l.id)).length || 0
          return (
            <div
              key={course.id}
              className="card card-hover"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <span className={`badge ${COLORS[i % COLORS.length]}`} style={{ marginBottom: 8 }}>
                {course.title}
              </span>
              <p style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 12 }}>{course.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate)' }}>
                <span>{done} / {course.lessons?.length || 0} lessons</span>
                <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{p}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${p}%` }} />
              </div>
              <button
                className="btn btn-sm btn-primary"
                style={{ marginTop: 14, alignSelf: 'flex-start' }}
              >
                {p === 0 ? 'Start Course' : p === 100 ? 'Review' : 'Continue'}
              </button>
            </div>
          )
        })}
        {courses.length === 0 && (
          <div className="info-box" style={{ gridColumn: '1 / -1' }}>
            No courses have been added yet. Check back soon!
          </div>
        )}
      </div>
    </div>
  )
}
