import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

export default function CoursePlayer() {
  const { courseId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [completedIds, setCompletedIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, l, p] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('lessons').select('*').eq('course_id', courseId).order('position'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', profile.id),
      ])
      setCourse(c.data)
      setLessons(l.data || [])
      setActiveLesson(l.data?.[0] || null)
      setCompletedIds(p.data?.map(r => r.lesson_id) || [])
      setLoading(false)
    }
    if (profile) load()
  }, [courseId, profile])

  async function markComplete(lessonId) {
    if (completedIds.includes(lessonId)) return
    await supabase.from('lesson_progress').insert({ user_id: profile.id, lesson_id: lessonId })
    setCompletedIds(prev => [...prev, lessonId])
  }

  async function unmarkComplete(lessonId) {
    await supabase.from('lesson_progress')
      .delete()
      .eq('user_id', profile.id)
      .eq('lesson_id', lessonId)
    setCompletedIds(prev => prev.filter(id => id !== lessonId))
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!course) return <div className="main-content"><p style={{ color: 'var(--slate)' }}>Course not found.</p></div>

  const isDone = activeLesson && completedIds.includes(activeLesson.id)
  const pct = lessons.length
    ? Math.round((lessons.filter(l => completedIds.includes(l.id)).length / lessons.length) * 100)
    : 0

  return (
    <div className="main-content">
      <span className="back-link" onClick={() => navigate('/courses')}>← Back to courses</span>
      <div className="page-title">{course.title}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem' }}>
        {/* Left: video + controls */}
        <div>
          {activeLesson ? (
            <>
              <div className="video-container">
                <iframe
                  src={`https://www.youtube.com/embed/${activeLesson.youtube_id}?rel=0`}
                  allowFullScreen
                  title={activeLesson.title}
                />
              </div>
              <div className="card">
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)', marginBottom: 4 }}>
                  {activeLesson.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 12 }}>
                  Duration: {activeLesson.duration}
                </div>
                {isDone ? (
                  <button
                    className="btn btn-sm"
                    style={{ color: 'var(--success)', borderColor: 'rgba(46,204,113,0.3)' }}
                    onClick={() => unmarkComplete(activeLesson.id)}
                  >
                    ✓ Marked complete — undo
                  </button>
                ) : (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => markComplete(activeLesson.id)}
                  >
                    Mark as complete
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="info-box">No lessons in this course yet.</div>
          )}
        </div>

        {/* Right: lesson list */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--silver)', textTransform: 'uppercase' }}>
              {lessons.length} Lessons
            </div>
            <div style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 700 }}>{pct}%</div>
          </div>
          <div className="progress-track" style={{ marginBottom: '0.75rem' }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>

          {lessons.map((lesson, i) => {
            const isActive = activeLesson?.id === lesson.id
            const done = completedIds.includes(lesson.id)
            return (
              <div
                key={lesson.id}
                className={`lesson-row ${isActive ? 'active' : ''}`}
                onClick={() => setActiveLesson(lesson)}
              >
                <div className={`check-circle ${done ? 'done' : ''}`}>
                  {done ? '✓' : ''}
                </div>
                <div style={{ flex: 1, fontSize: 13, color: isActive ? 'var(--cyan)' : 'var(--white)', fontWeight: isActive ? 600 : 400 }}>
                  {lesson.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--slate)' }}>{lesson.duration}</div>
              </div>
            )
          })}

          {lessons.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--slate)', padding: '8px 0' }}>No lessons yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
