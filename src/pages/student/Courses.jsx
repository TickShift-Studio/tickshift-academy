import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

function Skeleton() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ padding: '1rem 1.1rem' }}>
        <div style={{ height: 22, width: 32, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 10, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 14, width: '70%', borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 8, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 10, width: '90%', borderRadius: 4, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

export default function MyCourses() {
  const { user, profile, hasAccess, membershipChecked } = useAuth()
  const navigate = useNavigate()
  const userId = profile?.id || user?.id

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 16 }}>
      <div style={{ fontSize: 42 }}>🔒</div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 22 }}>Membership Required</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 380, lineHeight: 1.7 }}>Access to courses requires an active TickShift membership.</p>
      <a href="https://whop.com/tickshift" target="_blank" rel="noopener noreferrer" style={{ padding: '0.75rem 2rem', background: 'var(--blue)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
        Get Access on Whop
      </a>
    </div>
  )

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 28, color: 'var(--white)', marginBottom: 4 }}>My Courses</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {ready ? `${courses.length} course${courses.length !== 1 ? 's' : ''} available` : 'Loading…'}
        </p>
      </div>

      {!ready ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {[0,1,2,3].map(i => <Skeleton key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
          No courses have been added yet. Check back soon!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {courses.map(course => {
            const p = pct(course)
            const done  = Math.round((p / 100) * (course.lessons?.length || 0))
            const total = course.lessons?.length || 0
            return (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,111,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ height: 4, background: p === 100 ? 'var(--success)' : 'var(--blue)' }} />
                <div style={{ padding: '1.1rem 1.25rem 1.25rem' }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{course.emoji || '📈'}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--white)', marginBottom: 5 }}>{course.title}</div>
                  {course.description && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{done} / {total} lessons</span>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-head)', color: p === 100 ? 'var(--success)' : 'var(--cyan)' }}>{p}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: p === 100 ? 'var(--success)' : 'var(--blue)', width: `${p}%`, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', fontFamily: 'var(--font-head)' }}>
                    {p === 0 ? 'Start Course →' : p === 100 ? '✓ Completed' : 'Continue →'}
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
