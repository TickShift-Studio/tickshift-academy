import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

export default function ManageStudents() {
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [allProgress, setAllProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [st, co, pr] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student').order('created_at'),
        supabase.from('courses').select('*, lessons(id)').order('position'),
        supabase.from('lesson_progress').select('user_id, lesson_id'),
      ])
      setStudents(st.data || [])
      setCourses(co.data || [])
      setAllProgress(pr.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const ini = name => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  function overallPct(studentId) {
    const total = courses.reduce((a, c) => a + (c.lessons?.length || 0), 0)
    if (!total) return 0
    const done = allProgress.filter(p => p.user_id === studentId).length
    return Math.round((done / total) * 100)
  }

  function coursePct(studentId, course) {
    const total = course.lessons?.length || 0
    if (!total) return 0
    const lessonIds = course.lessons.map(l => l.id)
    const done = allProgress.filter(p => p.user_id === studentId && lessonIds.includes(p.lesson_id)).length
    return Math.round((done / total) * 100)
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div className="main-content">
      <div className="page-title">
        Students <span style={{ color: 'var(--cyan)' }}>({students.length})</span>
      </div>

      {students.length === 0 && (
        <div className="info-box">No students have signed up yet. Share your portal link to get started!</div>
      )}

      {students.map(student => {
        const overall = overallPct(student.id)
        return (
          <div key={student.id} className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div className="avatar" style={{ width: 40, height: 40, fontSize: 13 }}>{ini(student.full_name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)', fontSize: 14 }}>{student.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 1 }}>{student.email}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--cyan)' }}>
                {overall}%
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {courses.map(course => {
                const cp = coursePct(student.id, course)
                const done = (course.lessons || []).filter(l =>
                  allProgress.some(p => p.user_id === student.id && p.lesson_id === l.id)
                ).length
                return (
                  <div key={course.id} style={{ background: 'rgba(8,22,46,0.6)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 600, marginBottom: 6 }}>{course.title}</div>
                    <div className="progress-track" style={{ marginTop: 0, marginBottom: 5 }}>
                      <div className="progress-fill" style={{ width: `${cp}%` }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--slate)' }}>
                      {done}/{course.lessons?.length || 0} · <span style={{ color: 'var(--cyan)' }}>{cp}%</span>
                    </div>
                  </div>
                )
              })}
              {courses.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--slate)', gridColumn: '1/-1' }}>No courses yet.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
