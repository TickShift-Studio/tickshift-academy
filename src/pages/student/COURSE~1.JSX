import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

// ── Skeleton for lesson sidebar ───────────────────────────────────────────────
function LessonSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 4 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 5, width: '80%', animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 9, borderRadius: 3, background: 'rgba(255,255,255,0.04)', width: '50%', animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

export default function CoursePlayer() {
  const { courseId } = useParams()
  const { profile, hasAccess, membershipChecked } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse]           = useState(null)
  const [lessons, setLessons]         = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [completedIds, setCompletedIds] = useState([])
  const [courseReady, setCourseReady] = useState(false)   // course title loaded
  const [lessonsReady, setLessonsReady] = useState(false) // lessons + progress loaded
  const [markingComplete, setMarkingComplete] = useState(false)

  useEffect(() => {
    if (!profile) return

    let cancelled = false

    async function loadCourse() {
      const { data } = await supabase.from('courses').select('*').eq('id', courseId).single()
      if (!cancelled) { setCourse(data ?? null); setCourseReady(true) }
    }

    async function loadLessons() {
      const [l, p] = await Promise.all([
        supabase.from('lessons').select('*').eq('course_id', courseId).order('position'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', profile.id),
      ])
      if (cancelled) return
      const lessonList = l.data || []
      setLessons(lessonList)
      setActiveLesson(lessonList[0] || null)
      setCompletedIds(p.data?.map(r => r.lesson_id) || [])
      setLessonsReady(true)
    }

    // Fire both in parallel — course title shows first, lesson list hydrates next
    loadCourse()
    loadLessons()

    return () => { cancelled = true }
  }, [courseId, profile])

  async function markComplete(lessonId) {
    if (completedIds.includes(lessonId) || markingComplete) return
    setMarkingComplete(true)
    await supabase.from('lesson_progress').insert({ user_id: profile.id, lesson_id: lessonId })
    setCompletedIds(prev => [...prev, lessonId])
    setMarkingComplete(false)
    // Auto-advance to next lesson
    const idx = lessons.findIndex(l => l.id === lessonId)
    if (idx < lessons.length - 1) {
      setTimeout(() => setActiveLesson(lessons[idx + 1]), 400)
    }
  }

  async function unmarkComplete(lessonId) {
    await supabase.from('lesson_progress')
      .delete()
      .eq('user_id', profile.id)
      .eq('lesson_id', lessonId)
    setCompletedIds(prev => prev.filter(id => id !== lessonId))
  }

  // ── Access gate — only lock after membershipChecked (no false flash) ────────
  if (!hasAccess && membershipChecked) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', background: '#08162E',
      padding: '2rem', textAlign: 'center', gap: 16,
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{ fontSize: 40 }}>🔒</div>
      <div style={{ fontWeight: 900, fontSize: 20, color: '#fff' }}>Membership Required</div>
      <p style={{ color: '#6E7B8F', fontSize: 13, maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
        Access to courses is available to active TickShift members. Purchase via Whop to unlock all content.
      </p>
      <a href="https://whop.com/tikcshift/tickshift-premium-access/" target="_blank" rel="noopener noreferrer" style={{
        padding: '0.75rem 2rem', marginTop: 8,
        background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
        borderRadius: 10, color: '#fff', fontFamily: "'Montserrat', sans-serif",
        fontWeight: 700, fontSize: 13, letterSpacing: 1, textDecoration: 'none',
        textTransform: 'uppercase',
      }}>Get Access on Whop</a>
    </div>
  )

  // course title not yet loaded → show minimal branded shell
  if (!courseReady) return (
    <div style={{ minHeight: '100vh', background: '#08162E', fontFamily: "'Open Sans', sans-serif" }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>
      <div style={{
        background: 'rgba(11,22,40,0.95)', borderBottom: '1px solid rgba(15,111,255,0.12)',
        padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button
          onClick={() => navigate('/courses')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3CCBFF', fontSize: 12, fontWeight: 600, fontFamily: "'Open Sans', sans-serif" }}
        >← Back</button>
        <div style={{ height: 14, width: 160, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
    </div>
  )

  if (!course) return (
    <div style={{ padding: '2rem', color: '#6E7B8F', fontFamily: "'Open Sans', sans-serif" }}>
      Course not found.
    </div>
  )

  const isDone    = activeLesson && completedIds.includes(activeLesson.id)
  const pct       = lessonsReady && lessons.length
    ? Math.round((lessons.filter(l => completedIds.includes(l.id)).length / lessons.length) * 100)
    : 0
  const activeIdx = lessons.findIndex(l => l.id === activeLesson?.id)

  return (
    <div style={{ minHeight: '100vh', background: '#08162E', fontFamily: "'Open Sans', sans-serif" }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>

      {/* Top bar — renders as soon as courseReady */}
      <div style={{
        background: 'rgba(11,22,40,0.95)',
        borderBottom: '1px solid rgba(15,111,255,0.12)',
        padding: '0.85rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate('/courses')}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#3CCBFF', fontSize: 12, fontWeight: 600,
              letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: "'Open Sans', sans-serif",
            }}
          >← Back</button>
          <div style={{ width: 1, height: 16, background: 'rgba(60,203,255,0.2)' }} />
          <div style={{
            fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
            fontSize: 13, color: '#F8FFFF',
            maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{course.title}</div>
        </div>

        {/* Progress pill — hidden until lessons load */}
        {lessonsReady && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(15,111,255,0.08)',
            border: '1px solid rgba(15,111,255,0.2)',
            borderRadius: 100, padding: '5px 14px',
          }}>
            <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: pct === 100 ? '#2ECC71' : 'linear-gradient(90deg, #0F6FFF, #3CCBFF)',
                width: `${pct}%`, transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: pct === 100 ? '#2ECC71' : '#3CCBFF',
            }}>{pct}%</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 300px',
        gap: 0, height: 'calc(100vh - 52px)',
      }}>
        {/* Left: Video + info */}
        <div style={{
          overflowY: 'auto', padding: '1.5rem 1.75rem',
          borderRight: '1px solid rgba(15,111,255,0.1)',
        }}>
          {/* Video area: show spinner until lessons loaded */}
          {!lessonsReady ? (
            <div style={{
              position: 'relative', paddingBottom: '56.25%', height: 0,
              borderRadius: 14, overflow: 'hidden',
              background: 'rgba(8,22,46,0.8)',
              border: '1px solid rgba(15,111,255,0.1)',
              marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 36, height: 36,
                border: '3px solid rgba(15,111,255,0.2)',
                borderTopColor: '#0F6FFF', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : activeLesson ? (
            <>
              {/* Video */}
              <div style={{
                position: 'relative', paddingBottom: '56.25%', height: 0,
                borderRadius: 14, overflow: 'hidden',
                background: '#000',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(15,111,255,0.12)',
                marginBottom: '1.25rem',
              }}>
                <iframe
                  src={`https://www.youtube.com/embed/${activeLesson.youtube_id}?rel=0&modestbranding=1`}
                  allowFullScreen
                  title={activeLesson.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>

              {/* Lesson info card */}
              <div style={{
                background: 'rgba(13,31,60,0.7)',
                border: '1px solid rgba(15,111,255,0.15)',
                borderRadius: 14, padding: '1.25rem 1.4rem',
              }}>
                <div style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: 2,
                  color: '#6E7B8F', textTransform: 'uppercase', marginBottom: 8,
                }}>
                  Class {activeIdx + 1} of {lessons.length}
                </div>

                <div style={{
                  fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
                  fontSize: 18, color: '#F8FFFF', marginBottom: 6, lineHeight: 1.3,
                }}>
                  {activeLesson.title}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: 12, color: '#6E7B8F', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>⏱</span> {activeLesson.duration}
                  </span>
                  {isDone && (
                    <span style={{ fontSize: 11, color: '#2ECC71', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>✓</span> Completed
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {isDone ? (
                    <button
                      onClick={() => unmarkComplete(activeLesson.id)}
                      style={{
                        padding: '10px 20px', borderRadius: 9,
                        background: 'rgba(46,204,113,0.1)',
                        border: '1px solid rgba(46,204,113,0.3)',
                        color: '#2ECC71', cursor: 'pointer',
                        fontSize: 12, fontWeight: 700,
                        fontFamily: "'Open Sans', sans-serif",
                        transition: 'all 0.15s', letterSpacing: 0.3,
                      }}
                    >✓ Completed — Undo</button>
                  ) : (
                    <button
                      onClick={() => markComplete(activeLesson.id)}
                      disabled={markingComplete}
                      style={{
                        padding: '10px 22px', borderRadius: 9,
                        background: markingComplete ? 'rgba(13,95,224,0.5)' : 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
                        border: 'none', color: '#fff',
                        cursor: markingComplete ? 'not-allowed' : 'pointer',
                        fontSize: 12, fontWeight: 700,
                        fontFamily: "'Montserrat', sans-serif",
                        letterSpacing: 1, transition: 'all 0.15s',
                        boxShadow: '0 4px 16px rgba(15,111,255,0.3)',
                      }}
                    >
                      {markingComplete ? 'Saving...' : 'Mark Complete ✓'}
                    </button>
                  )}

                  {activeIdx > 0 && (
                    <button
                      onClick={() => setActiveLesson(lessons[activeIdx - 1])}
                      style={{
                        padding: '10px 18px', borderRadius: 9,
                        background: 'transparent',
                        border: '1px solid rgba(15,111,255,0.2)',
                        color: '#6E7B8F', cursor: 'pointer',
                        fontSize: 12, fontFamily: "'Open Sans', sans-serif",
                        transition: 'all 0.15s',
                      }}
                    >← Prev</button>
                  )}
                  {activeIdx < lessons.length - 1 && (
                    <button
                      onClick={() => setActiveLesson(lessons[activeIdx + 1])}
                      style={{
                        padding: '10px 18px', borderRadius: 9,
                        background: 'transparent',
                        border: '1px solid rgba(15,111,255,0.2)',
                        color: '#C9D1DC', cursor: 'pointer',
                        fontSize: 12, fontFamily: "'Open Sans', sans-serif",
                        transition: 'all 0.15s',
                      }}
                    >Next →</button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{
              background: 'rgba(15,111,255,0.05)',
              border: '1px solid rgba(15,111,255,0.15)',
              borderRadius: 12, padding: '1.5rem',
              fontSize: 13, color: '#6E7B8F',
            }}>No lessons in this course yet.</div>
          )}
        </div>

        {/* Right: Lesson list */}
        <div style={{ overflowY: 'auto', background: 'rgba(8,18,46,0.6)', padding: '1.25rem 1rem' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 2,
            color: '#6E7B8F', textTransform: 'uppercase', marginBottom: '1rem',
          }}>
            Course Content
          </div>

          {/* Skeleton rows while lessons load */}
          {!lessonsReady
            ? [0,1,2,3,4].map(i => <LessonSkeleton key={i} />)
            : lessons.map((lesson, i) => {
                const isActive = activeLesson?.id === lesson.id
                const done     = completedIds.includes(lesson.id)
                return (
                  <div
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                      cursor: 'pointer',
                      background: isActive ? 'rgba(15,111,255,0.16)' : 'transparent',
                      border: isActive ? '1px solid rgba(15,111,255,0.3)' : '1px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(15,111,255,0.07)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Check circle */}
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? 'linear-gradient(135deg, #0F6FFF, #3CCBFF)' : 'rgba(255,255,255,0.04)',
                      border: done ? 'none' : isActive ? '1.5px solid #0F6FFF' : '1.5px solid rgba(110,123,143,0.4)',
                      fontSize: 10, color: done ? '#fff' : 'transparent',
                      transition: 'all 0.2s',
                      boxShadow: done ? '0 0 8px rgba(15,111,255,0.4)' : 'none',
                    }}>
                      {done ? '✓' : ''}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, lineHeight: 1.4,
                        color: isActive ? '#F8FFFF' : done ? '#C9D1DC' : '#6E7B8F',
                        fontWeight: isActive ? 600 : 400,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {lesson.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#6E7B8F', marginTop: 2 }}>
                        Class {i + 1} · {lesson.duration}
                      </div>
                    </div>
                  </div>
                )
              })
          }

          {lessonsReady && lessons.length === 0 && (
            <p style={{ fontSize: 12, color: '#6E7B8F' }}>No lessons yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
