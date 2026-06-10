import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

function Skel({ h, w = '100%', r = 6 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />
}

export default function MyCourses() {
  const { user, profile, hasAccess, membershipChecked } = useAuth()
  const navigate  = useNavigate()
  const userId    = profile?.id || user?.id
  const [courses, setCourses]   = useState([])
  const [progress, setProgress] = useState([])
  const [ready, setReady]       = useState(false)

  useEffect(() => {
    if (!userId) return
    if (!hasAccess) { setReady(true); return }
    let cancelled = false
    async function load() {
      const [c, p] = await Promise.all([
        supabase.from('courses').select('*, lessons(id)').order('position'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', userId),
      ])
      if (cancelled) return
      setCourses(c.data || [])
      setProgress(p.data?.map(r => r.lesson_id) || [])
      setReady(true)
    }
    load()
    return () => { cancelled = true }
  }, [userId, hasAccess])

  function pct(course) {
    const total = course.lessons?.length || 0
    if (!total) return 0
    return Math.round((course.lessons.filter(l => progress.includes(l.id)).length / total) * 100)
  }

  if (!hasAccess && membershipChecked) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 20 }}>
      <div style={{
        width: 60, height: 60, borderRadius: 16,
        background: 'var(--violet-dim)', border: '1px solid rgba(139,92,246,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
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

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(24px, 4vw, 36px)',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, var(--white) 0%, rgba(248,248,250,0.65) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 6,
        }}>My Courses</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          {ready ? `${courses.length} course${courses.length !== 1 ? 's' : ''} available` : 'Loading…'}
        </p>
      </div>

      {!ready ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="glow-card" style={{ padding: '1.1rem', height: 180, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skel h={36} w={36} r={10} />
              <Skel h={14} w="75%" />
              <Skel h={10} w="90%" />
              <Skel h={10} w="60%" />
              <div style={{ marginTop: 'auto' }}>
                <Skel h={5} r={99} />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="glow-card" style={{ padding: '2.5rem', textAlign: 'center', cursor: 'default' }}>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No courses have been added yet. Check back soon!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
          {courses.map(course => {
            const p    = pct(course)
            const done = Math.round((p / 100) * (course.lessons?.length || 0))
            const total = course.lessons?.length || 0
            const isDone = p === 100
            return (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="glow-card"
                style={{ padding: '1.2rem', cursor: 'pointer' }}
              >
                {/* Accent bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: isDone
                    ? 'linear-gradient(90deg, var(--success), #34D399)'
                    : 'linear-gradient(90deg, var(--violet), var(--violet-2))',
                }} />
                <div style={{ paddingTop: 4 }}>
                  {/* Icon */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: isDone ? 'rgba(16,185,129,0.1)' : 'var(--violet-dim)',
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
                    color: isDone ? '#34D399' : 'var(--violet-2)',
                    marginBottom: 12,
                  }}>
                    {(course.title?.[0] || 'C').toUpperCase()}
                  </div>

                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--white)', marginBottom: 5, lineHeight: 1.3 }}>
                    {course.title}
                  </div>
                  {course.description && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 14,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{done} / {total} lessons</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: isDone ? '#34D399' : 'var(--violet-2)' }}>{p}%</span>
                  </div>

                  <div className="progress-track">
                    <div className={`progress-fill${isDone ? ' progress-fill--green' : ''}`} style={{ width: `${p}%` }} />
                  </div>

                  <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)', color: isDone ? '#34D399' : 'var(--violet-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {p === 0 ? 'Start Course' : isDone ? '✓ Completed' : 'Continue'}
                    {!isDone && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
