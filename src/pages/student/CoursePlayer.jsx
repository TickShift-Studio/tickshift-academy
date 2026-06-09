import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

export default function CoursePlayer() {
  const { courseId } = useParams()
  const { profile, hasAccess, membershipChecked } = useAuth()
  const navigate = useNavigate()

  const [course, setCourse]           = useState(null)
  const [lessons, setLessons]         = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [completedIds, setCompletedIds] = useState([])
  const [courseReady, setCourseReady] = useState(false)
  const [lessonsReady, setLessonsReady] = useState(false)
  const [marking, setMarking]         = useState(false)

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    async function load() {
      const [c, l, p] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('lessons').select('*').eq('course_id', courseId).order('position'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', profile.id),
      ])
      if (cancelled) return
      setCourse(c.data ?? null)
      setCourseReady(true)
      const list = l.data || []
      setLessons(list)
      setActiveLesson(list[0] || null)
      setCompletedIds(p.data?.map(r => r.lesson_id) || [])
      setLessonsReady(true)
    }
    load()
    return () => { cancelled = true }
  }, [courseId, profile])

  async function markComplete(lessonId) {
    if (completedIds.includes(lessonId) || marking) return
    setMarking(true)
    await supabase.from('lesson_progress').insert({ user_id: profile.id, lesson_id: lessonId })
    setCompletedIds(prev => [...prev, lessonId])
    setMarking(false)
    const idx = lessons.findIndex(l => l.id === lessonId)
    if (idx < lessons.length - 1) setTimeout(() => setActiveLesson(lessons[idx + 1]), 350)
  }

  async function unmark(lessonId) {
    await supabase.from('lesson_progress').delete().eq('user_id', profile.id).eq('lesson_id', lessonId)
    setCompletedIds(prev => prev.filter(id => id !== lessonId))
  }

  if (!hasAccess && membershipChecked) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 16 }}>
      <div style={{ fontSize: 42 }}>🔒</div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 22 }}>Membership Required</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 380, lineHeight: 1.7 }}>Access to courses requires an active TickShift membership.</p>
      <a href="https://whop.com/tickshift" target="_blank" rel="noopener noreferrer" style={{ padding: '0.75rem 2rem', background: 'var(--blue)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
        Get Access on Whop
      </a>
    </div>
  )

  if (!courseReady) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(15,111,255,0.18)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
    </div>
  )

  if (!course) return <div style={{ color: 'var(--muted)', padding: '2rem', fontSize: 14 }}>Course not found.</div>

  const isDone = activeLesson && completedIds.includes(activeLesson.id)
  const pct    = lessonsReady && lessons.length
    ? Math.round((lessons.filter(l => completedIds.includes(l.id)).length / lessons.length) * 100)
    : 0

  return (
    <div>
      {/* Back + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/courses')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4, padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
        >← Courses</button>
        <span style={{ color: 'var(--border)', fontSize: 16 }}>|</span>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>{course.title}</span>
        {lessonsReady && (
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: pct === 100 ? 'var(--success)' : 'var(--cyan)', fontFamily: 'var(--font-head)' }}>{pct}%</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Video area */}
        <div>
          {activeLesson ? (
            <>
              {/* Video embed */}
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '1rem' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${activeLesson.youtube_id}?rel=0`}
                  allowFullScreen title={activeLesson.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>

              {/* Lesson info */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem 1.4rem' }}>
                <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--white)', marginBottom: 4 }}>{activeLesson.title}</h2>
                {activeLesson.duration && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '1rem' }}>Duration: {activeLesson.duration}</div>
                )}
                {isDone ? (
                  <button onClick={() => unmark(activeLesson.id)} style={{ padding: '9px 18px', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-head)' }}>
                    ✓ Completed — undo
                  </button>
                ) : (
                  <button onClick={() => markComplete(activeLesson.id)} disabled={marking} style={{ padding: '9px 18px', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: marking ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-head)', opacity: marking ? 0.6 : 1 }}>
                    Mark as Complete
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
              No lessons in this course yet.
            </div>
          )}
        </div>

        {/* Lesson sidebar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'sticky', top: 76 }}>
          <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>{lessons.length} Lessons</span>
            {lessonsReady && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-head)' }}>{pct}%</span>}
          </div>

          {lessonsReady && (
            <div style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
              <div style={{ height: '100%', background: pct === 100 ? 'var(--success)' : 'var(--blue)', width: `${pct}%`, transition: 'width 0.6s ease' }} />
            </div>
          )}

          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {lessons.length === 0 ? (
              <div style={{ padding: '1rem', fontSize: 12, color: 'var(--muted)' }}>No lessons yet.</div>
            ) : (
              lessons.map((lesson, i) => {
                const isActive = activeLesson?.id === lesson.id
                const done     = completedIds.includes(lesson.id)
                return (
                  <div
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 1.1rem',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: isActive ? 'var(--blue-dim)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: done ? 'var(--blue)' : 'transparent',
                      border: done ? 'none' : '1.5px solid var(--muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: done ? '#fff' : 'var(--muted)', fontWeight: 700,
                    }}>{done ? '✓' : ''}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: isActive ? 'var(--white)' : 'var(--silver)', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lesson.title}
                      </div>
                    </div>
                    {lesson.duration && (
                      <div style={{ fontSize: 10.5, color: 'var(--muted)', flexShrink: 0 }}>{lesson.duration}</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
