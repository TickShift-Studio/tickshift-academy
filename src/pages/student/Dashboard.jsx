import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ label, value, accent = 'var(--blue)' }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem 1.4rem' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 32, color: accent, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

function Skeleton({ h = 16, w = '100%', style = {} }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.4s ease-in-out infinite', ...style }} />
}

export default function StudentDashboard() {
  const { profile, user, hasAccess, membershipChecked } = useAuth()
  const navigate = useNavigate()
  const userId = profile?.id || user?.id

  const [courses, setCourses]     = useState([])
  const [progress, setProgress]   = useState([])
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    if (!userId || !hasAccess) { setReady(true); return }
    let cancelled = false
    async function load() {
      const [c, p, a, s] = await Promise.all([
        supabase.from('courses').select('*, lessons(id)').order('position'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', userId),
        supabase.from('assignments').select('id'),
        supabase.from('submissions').select('assignment_id').eq('user_id', userId),
      ])
      if (cancelled) return
      setCourses(c.data || [])
      setProgress(p.data?.map(r => r.lesson_id) || [])
      setAssignments(a.data || [])
      setSubmissions(s.data?.map(r => r.assignment_id) || [])
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

  const totalLessons     = courses.reduce((a, c) => a + (c.lessons?.length || 0), 0)
  const completedLessons = progress.length
  const overallPct       = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
  const pendingHW        = assignments.filter(a => !submissions.includes(a.id)).length

  const inProgress = courses.find(c => { const p = pct(c); return p > 0 && p < 100 })
  const resumeCourse = inProgress ?? courses[0]

  if (!hasAccess && membershipChecked) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 16 }}>
      <div style={{ fontSize: 42 }}>🔒</div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 22, color: 'var(--white)' }}>Membership Required</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 380, lineHeight: 1.7 }}>
        Your account doesn't have an active TickShift membership yet.
      </p>
      <a href="https://whop.com/tickshift" target="_blank" rel="noopener noreferrer"
        style={{ padding: '0.75rem 2rem', background: 'var(--blue)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, letterSpacing: 1, textDecoration: 'none' }}>
        Get Access on Whop
      </a>
    </div>
  )

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>

      {/* Welcome header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 4 }}>
          {getGreeting()}
        </div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 28, color: 'var(--white)', marginBottom: 6 }}>
          {profile?.full_name?.split(' ')[0] || 'Trader'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {overallPct > 0
            ? `You're ${overallPct}% through your curriculum. Keep the momentum going.`
            : 'Welcome to TickShift Academy. Start your first course below.'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {ready ? (
          <>
            <StatCard label="Lessons Completed" value={completedLessons} accent="var(--blue)" />
            <StatCard label="Total Lessons" value={totalLessons} accent="var(--silver)" />
            <StatCard label="Due Assignments" value={pendingHW} accent={pendingHW > 0 ? 'var(--danger)' : 'var(--success)'} />
          </>
        ) : (
          [0,1,2].map(i => <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem 1.4rem', height: 100 }}><Skeleton h={10} w="60%" style={{ marginBottom: 16 }} /><Skeleton h={32} w="40%" /></div>)
        )}
      </div>

      {/* Overall progress bar */}
      {ready && totalLessons > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--silver)' }}>Overall Progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: overallPct === 100 ? 'var(--success)' : 'var(--cyan)', fontFamily: 'var(--font-head)' }}>{overallPct}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: overallPct === 100 ? 'var(--success)' : 'var(--blue)', width: `${overallPct}%`, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* Resume / Start CTA */}
      {ready && resumeCourse && (
        <div style={{ marginBottom: '2rem' }}>
          <SectionLabel>Continue Learning</SectionLabel>
          <div
            onClick={() => navigate(`/courses/${resumeCourse.id}`)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem 1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                {pct(resumeCourse) === 0 ? 'Start here' : 'Pick up where you left off'}
              </div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--white)', marginBottom: 10 }}>
                {resumeCourse.title}
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', maxWidth: 300 }}>
                <div style={{ height: '100%', borderRadius: 2, background: 'var(--blue)', width: `${pct(resumeCourse)}%` }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                {pct(resumeCourse)}% complete · {resumeCourse.lessons?.length || 0} lessons
              </div>
            </div>
            <div style={{ padding: '10px 20px', background: 'var(--blue)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {pct(resumeCourse) === 0 ? 'Start →' : 'Continue →'}
            </div>
          </div>
        </div>
      )}

      {/* All courses */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <SectionLabel style={{ marginBottom: 0 }}>All Courses</SectionLabel>
          <button onClick={() => navigate('/courses')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--cyan)', fontWeight: 600, fontFamily: 'var(--font-head)' }}>View all →</button>
        </div>
        {!ready ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {[0,1,2].map(i => <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', height: 130 }} />)}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState>No courses available yet. Check back soon!</EmptyState>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {courses.map(course => (
              <CourseCard key={course.id} course={course} pct={pct(course)} onClick={() => navigate(`/courses/${course.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Pending assignments */}
      {ready && pendingHW > 0 && (
        <div>
          <SectionLabel>Pending Assignments</SectionLabel>
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ height: 3, background: 'var(--danger)' }} />
            <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, color: 'var(--silver)' }}>
                You have <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{pendingHW}</span> assignment{pendingHW !== 1 ? 's' : ''} to complete.
              </div>
              <button onClick={() => navigate('/homework')} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)' }}>
                View →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CourseCard({ course, pct, onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,111,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ height: 4, background: pct === 100 ? 'var(--success)' : 'var(--blue)' }} />
      <div style={{ padding: '1rem 1.1rem' }}>
        <div style={{ fontSize: 22, marginBottom: 8 }}>{course.emoji || '📈'}</div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--white)', marginBottom: 4 }}>{course.title}</div>
        {course.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{course.lessons?.length || 0} lessons</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? 'var(--success)' : 'var(--cyan)', fontFamily: 'var(--font-head)' }}>{pct}%</span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: pct === 100 ? 'var(--success)' : 'var(--blue)', width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children, style = {} }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '1rem', ...style }}>
      {children}
    </div>
  )
}

function EmptyState({ children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', fontSize: 13, color: 'var(--muted)' }}>
      {children}
    </div>
  )
}
