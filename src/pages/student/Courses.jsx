import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

function CourseCardSkeleton() {
  return (
    <div style={{
      background: '#0B1628', border: '1px solid rgba(15,111,255,0.1)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ height: 90, background: 'rgba(15,111,255,0.07)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ padding: '1rem 1.25rem' }}>
        <div style={{ height: 14, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 10, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 10, width: '90%', borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 5, width: '100%', borderRadius: 3, background: 'rgba(255,255,255,0.04)', marginTop: 16, animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

export default function MyCourses() {
  const { user, profile, hasAccess, membershipChecked } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses]   = useState([])
  const [progress, setProgress] = useState([])
  const [ready, setReady]       = useState(false)

  const userId = profile?.id || user?.id

  useEffect(() => {
    if (!userId) return
    if (!hasAccess) { setReady(true); return }

    let cancelled = false

    async function load() {
      try {
        const [c, p] = await Promise.all([
          supabase.from('courses').select('*, lessons(id)').order('position'),
          supabase.from('lesson_progress').select('lesson_id').eq('user_id', userId),
        ])
        if (cancelled) return
        setCourses(c.data ?? [])
        setProgress(p.data?.map(r => r.lesson_id) ?? [])
      } catch (err) {
        console.error('Courses load error:', err)
      } finally {
        if (!cancelled) setReady(true)
      }
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
    <div style={noAccessStyle}>
      <div style={{ fontSize: 40 }}>🔒</div>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 20, color: '#fff' }}>
        Membership Required
      </div>
      <p style={{ color: '#6E7B8F', fontSize: 13, maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
        Access to courses is available to active TickShift members. Purchase via Whop to unlock all content.
      </p>
      <a href="https://whop.com" target="_blank" rel="noopener noreferrer" style={ctaLinkStyle}>
        Get Access on Whop
      </a>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#08162E', padding: '2rem 2.25rem', fontFamily: "'Open Sans', sans-serif" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50%       { opacity: 0.4 }
        }
      `}</style>

      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 24, color: '#fff', margin: '0 0 6px' }}>
          My Courses
        </h1>
        <p style={{ color: '#6E7B8F', fontSize: 13, margin: 0 }}>
          {ready ? `${courses.length} course${courses.length !== 1 ? 's' : ''} available` : 'Loading…'}
        </p>
      </div>

      {!ready ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[0, 1, 2].map(i => <CourseCardSkeleton key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div style={{
          background: 'rgba(15,111,255,0.04)', border: '1px solid rgba(15,111,255,0.12)',
          borderRadius: 14, padding: '2.5rem', textAlign: 'center', color: '#4A6FA5',
        }}>
          No courses have been added yet. Check back soon!
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {courses.map(course => {
            const p = pct(course)
            const total = course.lessons?.length || 0
            const done = Math.round((p / 100) * total)
            const gradients = [
              'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
              'linear-gradient(135deg, #3CCBFF, #0D5FE0)',
              'linear-gradient(135deg, #0D1F3C, #0F6FFF)',
              'linear-gradient(135deg, #1a3a6e, #3CCBFF)',
            ]
            const grad = gradients[course.position % gradients.length || 0]
            return (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                style={{
                  background: '#0B1628', border: '1px solid rgba(15,111,255,0.14)',
                  borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(15,111,255,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ height: 90, background: grad, position: 'relative', padding: '1rem' }}>
                  <div style={{ fontSize: 28 }}>{course.emoji || '📈'}</div>
                  {p === 100 && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'rgba(46,204,113,0.9)', borderRadius: 20,
                      padding: '2px 10px', fontSize: 10, fontWeight: 700,
                      color: '#fff', letterSpacing: 0.5,
                    }}>✓ Complete</div>
                  )}
                </div>
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: '#E2EAF4', marginBottom: 4 }}>
                    {course.title}
                  </div>
                  {course.description && (
                    <p style={{ fontSize: 12, color: '#4A6FA5', margin: '0 0 12px', lineHeight: 1.5 }}>
                      {course.description.substring(0, 80)}{course.description.length > 80 ? '…' : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${p}%`, borderRadius: 3,
                        background: p === 100 ? '#2ECC71' : 'linear-gradient(90deg, #0F6FFF, #3CCBFF)',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#4A6FA5', whiteSpace: 'nowrap' }}>
                      {done}/{total}
                    </span>
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontWeight: 700, color: '#3CCBFF',
                    fontFamily: "'Montserrat', sans-serif",
                  }}>
                    {p === 0 ? '▶ Start Course' : p === 100 ? '↩ Review' : '▶ Continue'}
                    <span style={{ fontSize: 10 }}>→</span>
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

const noAccessStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', minHeight: '100vh', background: '#08162E',
  padding: '2rem', textAlign: 'center', gap: 16,
  fontFamily: "'Montserrat', sans-serif",
}
const ctaLinkStyle = {
  padding: '0.75rem 2rem', marginTop: 8,
  background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
  borderRadius: 10, color: '#fff', fontFamily: "'Montserrat', sans-serif",
  fontWeight: 700, fontSize: 13, letterSpacing: 1, textDecoration: 'none',
  textTransform: 'uppercase',
}
