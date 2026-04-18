import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.9), rgba(8,22,46,0.95))', border: '1px solid rgba(15,111,255,0.16)', borderRadius: 14, padding: '1.25rem 1.35rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#6E7B8F', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 30, color: accent, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#6E7B8F', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

function StatSkeleton() {
  return (
    <div style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(15,111,255,0.08)', borderRadius: 14, padding: '1.25rem 1.35rem', height: 110 }}>
      <div style={{ width: 32, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ width: 60, height: 30, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
    </div>
  )
}

function CourseCard({ course, pct, onClick }) {
  const gradients = ['linear-gradient(135deg, #0F6FFF, #3CCBFF)', 'linear-gradient(135deg, #3CCBFF, #0D5FE0)', 'linear-gradient(135deg, #0D1F3C, #0F6FFF)', 'linear-gradient(135deg, #1a3a6e, #3CCBFF)']
  const idx = course.position % gradients.length || 0
  const total = course.lessons?.length || 0
  return (
    <div onClick={onClick} style={{ background: '#0D1F3C', border: '1px solid rgba(15,111,255,0.15)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,111,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(15,111,255,0.12)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,111,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ height: 5, background: gradients[idx] }} />
      <div style={{ padding: '1.1rem 1.25rem 1.25rem' }}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: '#F8FFFF', marginBottom: 6 }}>{course.title}</div>
        {course.description && <p style={{ fontSize: 11.5, color: '#6E7B8F', lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <span style={{ fontSize: 10.5, color: '#6E7B8F' }}>0 / {total} lessons</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? '#2ECC71' : '#3CCBFF' }}>{pct}%</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: pct === 100 ? 'linear-gradient(90deg, #2ECC71, #27AE60)' : 'linear-gradient(90deg, #0F6FFF, #3CCBFF)', width: `${pct}%`, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#0F6FFF' }}>
          {pct === 0 ? 'Start Course' : pct === 100 ? '✓ Completed' : 'Continue'} →
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function StudentDashboard() {
  const { profile, user, hasAccess, membershipChecked } = useAuth()
  const navigate = useNavigate()
  const userId = profile?.id || user?.id

  const [courses, setCourses]           = useState([])
  const [progress, setProgress]         = useState([])
  const [coursesReady, setCoursesReady] = useState(false)
  const [assignments, setAssignments]   = useState([])
  const [submissions, setSubmissions]   = useState([])
  const [statsReady, setStatsReady]     = useState(false)

  // Load data as soon as userId is available — don't gate on hasAccess
  // hasAccess may be false during the membership-fetch window right after login
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function loadCourses() {
      try {
        const [c, p] = await Promise.all([
          supabase.from('courses').select('*, lessons(id)').order('position'),
          supabase.from('lesson_progress').select('lesson_id').eq('user_id', userId),
        ])
        if (cancelled) return
        setCourses(c.data || [])
        setProgress(p.data?.map(r => r.lesson_id) || [])
      } catch (err) { console.error('Courses load error:', err) }
      finally { if (!cancelled) setCoursesReady(true) }
    }

    async function loadStats() {
      try {
        const [a, s] = await Promise.all([
          supabase.from('assignments').select('*, courses(title)'),
          supabase.from('submissions').select('assignment_id').eq('user_id', userId),
        ])
        if (cancelled) return
        setAssignments(a.data || [])
        setSubmissions(s.data?.map(r => r.assignment_id) || [])
      } catch (err) { console.error('Stats load error:', err) }
      finally { if (!cancelled) setStatsReady(true) }
    }

    loadCourses()
    loadStats()
    return () => { cancelled = true }
  }, [userId]) // userId only — hasAccess removed intentionally

  function pct(course) {
    const total = course.lessons?.length || 0
    if (!total) return 0
    return Math.round((course.lessons.filter(l => progress.includes(l.id)).length / total) * 100)
  }

  const totalLessons     = courses.reduce((a, c) => a + (c.lessons?.length || 0), 0)
  const completedLessons = progress.length
  const overallPct       = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
  const pendingHW        = assignments.filter(a => !submissions.includes(a.id)).length

  // Only show locked screen after membership check completes
  if (!hasAccess && membershipChecked) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#08162E', padding: '2rem', textAlign: 'center', gap: 16 }}>
      <div style={{ fontSize: 40 }}>🔒</div>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 22, color: '#fff' }}>Access Required</div>
      <p style={{ color: '#6E7B8F', fontSize: 14, maxWidth: 420, lineHeight: 1.6, margin: 0 }}>Your account doesn't have an active TickShift membership yet.</p>
      <a href="https://whop.com" target="_blank" rel="noopener noreferrer" style={{ padding: '0.75rem 2rem', marginTop: 8, background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textDecoration: 'none', textTransform: 'uppercase' }}>Get Access on Whop</a>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#08162E', padding: '2rem 2.25rem', fontFamily: "'Open Sans', sans-serif" }}>

      {/* Welcome header — renders immediately */}
      <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.8), rgba(8,18,46,0.9))', border: '1px solid rgba(15,111,255,0.14)', borderRadius: 16, padding: '1.5rem 1.75rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,111,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#3CCBFF', textTransform: 'uppercase', marginBottom: 6 }}>{getGreeting()}</div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(20px, 2.5vw, 26px)', color: '#F8FFFF', marginBottom: 4 }}>
            {profile?.full_name?.split(' ')[0] || 'Trader'} <span style={{ color: '#3CCBFF' }}>—</span>
          </div>
          <p style={{ fontSize: 12.5, color: '#6E7B8F', maxWidth: 480, marginBottom: '1rem' }}>
            Keep pushing. Every lesson brings you closer to consistency.
            {overallPct > 0 && ` You're ${overallPct}% through your current curriculum.`}
          </p>
          <button
            onClick={() => {
              const inProgress = courses.find(c => pct(c) > 0 && pct(c) < 100)
              const target = inProgress ?? courses[0]
              if (target) navigate(`/courses/${target.id}`)
              else navigate('/courses')
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.7rem 1.5rem', background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {courses.some(c => pct(c) > 0) ? '▶  Continue Learning' : '🚀  Start Here'}
          </button>
        </div>
      </div>

      {/* Stats row — skeleton until statsReady */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {statsReady ? (
          <>
            <StatCard label="Courses Enrolled" value={courses.length} sub="Active this cycle" accent="#3CCBFF" icon="📚" />
            <StatCard label="Lessons Completed" value={completedLessons} sub={`${totalLessons - completedLessons} remaining`} accent="#0F6FFF" icon="✅" />
            <StatCard label="Assignments Due" value={pendingHW} sub={pendingHW === 0 ? 'All caught up!' : 'Need submission'} accent={pendingHW > 0 ? '#E74C3C' : '#2ECC71'} icon={pendingHW > 0 ? '📝' : '🎯'} />
          </>
        ) : (
          <><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
        )}
      </div>

      {/* Overall progress bar */}
      {coursesReady && totalLessons > 0 && (
        <div style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(15,111,255,0.12)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#6E7B8F', textTransform: 'uppercase' }}>Overall Progress</div>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 18, color: overallPct === 100 ? '#2ECC71' : '#3CCBFF' }}>{overallPct}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, background: overallPct === 100 ? 'linear-gradient(90deg, #2ECC71, #27AE60)' : 'linear-gradient(90deg, #0F6FFF, #3CCBFF)', width: `${overallPct}%`, transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ fontSize: 11, color: '#6E7B8F', marginTop: 8, textAlign: 'right' }}>{completedLessons} of {totalLessons} lessons complete</div>
        </div>
      )}

      {/* Course cards — skeleton until coursesReady */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: '#6E7B8F', textTransform: 'uppercase' }}>Continue Learning</div>
          <button onClick={() => navigate('/courses')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, color: '#3CCBFF', fontWeight: 600 }}>View all →</button>
        </div>
        {!coursesReady ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(15,111,255,0.08)', borderRadius: 14, height: 160 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {courses.map(course => <CourseCard key={course.id} course={course} pct={pct(course)} onClick={() => navigate(`/courses/${course.id}`)} />)}
            {courses.length === 0 && <div style={{ gridColumn: '1/-1', background: 'rgba(15,111,255,0.05)', border: '1px solid rgba(15,111,255,0.15)', borderRadius: 12, padding: '1.5rem', fontSize: 13, color: '#6E7B8F' }}>No courses available yet. Check back soon!</div>}
          </div>
        )}
      </div>

      {/* Pending assignments */}
      {statsReady && pendingHW > 0 && (
        <div style={{ marginTop: '1.75rem' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: '#6E7B8F', textTransform: 'uppercase', marginBottom: '1rem' }}>Pending Assignments</div>
          <div style={{ background: 'rgba(13,31,60,0.7)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 14, overflow: 'hidden' }}>
            {assignments.filter(a => !submissions.includes(a.id)).map((a, i, arr) => (
              <div key={a.id} style={{ padding: '1rem 1.25rem', borderBottom: i < arr.length - 1 ? '1px solid rgba(15,111,255,0.1)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: '#F8FFFF', marginBottom: 5 }}>{a.title}</div>
                  {a.courses && <span style={{ fontSize: 9.5, fontWeight: 700, background: 'rgba(15,111,255,0.15)', border: '1px solid rgba(60,203,255,0.25)', color: '#3CCBFF', borderRadius: 100, padding: '2px 9px' }}>{a.courses.title}</span>}
                </div>
                <button onClick={() => navigate('/homework')} style={{ padding: '6px 14px', borderRadius: 7, background: 'transparent', border: '1px solid rgba(60,203,255,0.3)', color: '#3CCBFF', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Submit →</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
