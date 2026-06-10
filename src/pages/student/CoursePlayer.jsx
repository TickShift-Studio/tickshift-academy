import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

export default function CoursePlayer() {
  const { courseId } = useParams()
  const { profile, hasAccess, membershipChecked } = useAuth()
  const navigate = useNavigate()

  const [course, setCourse]             = useState(null)
  const [lessons, setLessons]           = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [completedIds, setCompletedIds] = useState([])
  const [courseReady, setCourseReady]   = useState(false)
  const [lessonsReady, setLessonsReady] = useState(false)
  const [marking, setMarking]           = useState(false)

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 20 }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--violet-dim)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--violet-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--white)', marginBottom: 8 }}>Membership Required</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 360, lineHeight: 1.7 }}>Access to courses requires an active TickShift membership.</p>
      </div>
    </div>
  )

  if (!courseReady) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(139,92,246,0.15)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.85s linear infinite' }} />
    </div>
  )

  if (!course) return (
    <div style={{ color: 'var(--muted)', padding: '2rem', fontSize: 14 }}>Course not found.</div>
  )

  const isDone = activeLesson && completedIds.includes(activeLesson.id)
  const pct    = lessonsReady && lessons.length
    ? Math.round((lessons.filter(l => completedIds.includes(l.id)).length / lessons.length) * 100)
    : 0

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Back breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.75rem' }}>
        <button
          onClick={() => navigate('/courses')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13,
            color: 'var(--muted)', padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Courses
        </button>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {course.title}
        </span>
        {lessonsReady && (
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
            color: pct === 100 ? '#34D399' : 'var(--violet-2)',
            flexShrink: 0,
          }}>{pct}%</span>
        )}
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>
        {/* ── Video + Lesson info ── */}
        <div>
          {activeLesson ? (
            <>
              {/* Video */}
              <div style={{
                position: 'relative', paddingBottom: '56.25%', height: 0,
                background: '#000',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                marginBottom: '1rem',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <iframe
                  src={`https://www.youtube.com/embed/${activeLesson.youtube_id}?rel=0`}
                  allowFullScreen
                  title={activeLesson.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>

              {/* Lesson details */}
              <div className="glow-card" style={{ padding: '1.25rem 1.4rem', cursor: 'default' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--white)', marginBottom: 4, lineHeight: 1.3 }}>
                  {activeLesson.title}
                </h2>
                {activeLesson.duration && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {activeLesson.duration}
                  </div>
                )}
                {isDone ? (
                  <button
                    onClick={() => unmark(activeLesson.id)}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#34D399',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'var(--font-display)',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.18)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Completed — undo
                  </button>
                ) : (
                  <button
                    onClick={() => markComplete(activeLesson.id)}
                    disabled={marking}
                    className="btn-primary"
                    style={{ padding: '10px 22px' }}
                  >
                    {marking ? (
                      <>
                        <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                        Saving…
                      </>
                    ) : 'Mark as Complete'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="glow-card" style={{ padding: '2rem', textAlign: 'center', cursor: 'default' }}>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>No lessons in this course yet.</p>
            </div>
          )}
        </div>

        {/* ── Lesson sidebar ── */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          position: 'sticky',
          top: 76,
        }}>
          {/* Sidebar header */}
          <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {lessons.length} Lessons
            </span>
            {lessonsReady && (
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: pct === 100 ? '#34D399' : 'var(--violet-2)' }}>
                {pct}%
              </span>
            )}
          </div>

          {/* Progress bar */}
          {lessonsReady && (
            <div className="progress-track" style={{ borderRadius: 0, height: 3 }}>
              <div
                className={`progress-fill${pct === 100 ? ' progress-fill--green' : ''}`}
                style={{ width: `${pct}%`, borderRadius: 0 }}
              />
            </div>
          )}

          {/* Lesson list */}
          <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            {lessons.length === 0 ? (
              <div style={{ padding: '1.25rem', fontSize: 12, color: 'var(--muted)' }}>No lessons yet.</div>
            ) : lessons.map((lesson, i) => {
              const isActive = activeLesson?.id === lesson.id
              const done     = completedIds.includes(lesson.id)
              return (
                <div
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 1.1rem',
                    borderBottom: i < lessons.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    background: isActive ? 'var(--violet-dim)' : 'transparent',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Check circle */}
                  <div style={{
                    width: 22, height: 22,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: done
                      ? 'linear-gradient(135deg, var(--violet), var(--violet-2))'
                      : isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
                    border: done
                      ? 'none'
                      : `1.5px solid ${isActive ? 'var(--violet)' : 'var(--dim)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: done ? '#fff' : isActive ? 'var(--violet)' : 'var(--dim)',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                  }}>
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span style={{ fontSize: 9 }}>{i + 1}</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12.5,
                      color: isActive ? 'var(--white)' : done ? 'var(--silver)' : 'var(--muted)',
                      fontWeight: isActive ? 600 : 400,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      transition: 'color 0.12s',
                    }}>
                      {lesson.title}
                    </div>
                  </div>

                  {lesson.duration && (
                    <div style={{ fontSize: 10, color: 'var(--dim)', flexShrink: 0 }}>
                      {lesson.duration}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
