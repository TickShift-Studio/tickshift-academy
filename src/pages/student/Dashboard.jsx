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

function Skel({ h = 16, w = '100%', r = 6 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />
}

export default function StudentDashboard() {
  const { profile, user, hasAccess, membershipChecked } = useAuth()
  const navigate = useNavigate()
  const userId = profile?.id || user?.id

  const [courses, setCourses]         = useState([])
  const [progress, setProgress]       = useState([])
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [ready, setReady]             = useState(false)

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
  const inProgress       = courses.find(c => { const p = pct(c); return p > 0 && p < 100 })
  const resumeCourse     = inProgress ?? courses[0]

  if (!hasAccess && membershipChecked) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 20 }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'rgba(139,92,246,0.1)',
        border: '1px solid rgba(139,92,246,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--violet-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--white)', marginBottom: 8 }}>
          Membership Required
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 360, lineHeight: 1.7 }}>
          Your account doesn't have an active TickShift membership yet. Contact your mentor to get access.
        </p>
      </div>
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0] || 'Trader'

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* ── Hero greeting ─────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--violet-2)',
          marginBottom: 6,
        }}>
          {getGreeting()}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 'clamp(28px, 5vw, 44px)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          background: 'linear-gradient(135deg, var(--white) 0%, rgba(248,248,250,0.65) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 10,
        }}>
          {firstName}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--silver)', maxWidth: 520, lineHeight: 1.6 }}>
          {overallPct > 0
            ? `You're ${overallPct}% through your curriculum. Keep the momentum going.`
            : 'Welcome to TickShift Academy. Start your first course below.'}
        </p>
      </div>

      {/* ── Stats row ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {ready ? (
          <>
            <StatCard
              label="Lessons Completed"
              value={completedLessons}
              icon="check"
              color="var(--violet)"
            />
            <StatCard
              label="Total Lessons"
              value={totalLessons}
              icon="book"
              color="var(--silver)"
            />
            <StatCard
              label="Pending"
              value={pendingHW}
              icon="task"
              color={pendingHW > 0 ? 'var(--danger)' : 'var(--success)'}
            />
          </>
        ) : (
          [0,1,2].map(i => (
            <div key={i} className="glow-card" style={{ padding: '1.25rem', height: 110, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skel h={10} w="55%" />
              <Skel h={32} w="40%" r={8} />
            </div>
          ))
        )}
      </div>

      {/* ── Overall progress bar ──────────────────────────── */}
      {ready && totalLessons > 0 && (
        <div className="glow-card" style={{ padding: '1.1rem 1.4rem', marginBottom: '1.75rem', cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--silver)' }}>
              Overall Progress
            </span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 13,
              color: overallPct === 100 ? 'var(--success)' : 'var(--violet-2)',
            }}>
              {overallPct}%
            </span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill${overallPct === 100 ? ' progress-fill--green' : ''}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Continue learning ─────────────────────────────── */}
      {ready && resumeCourse && (
        <div style={{ marginBottom: '2rem' }}>
          <p className="section-label">Continue Learning</p>
          <div
            onClick={() => navigate(`/courses/${resumeCourse.id}`)}
            className="glow-card"
            style={{
              padding: '1.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, var(--surface) 100%)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--violet-2)',
                marginBottom: 5,
              }}>
                {pct(resumeCourse) === 0 ? 'Start here' : 'Pick up where you left off'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 17,
                color: 'var(--white)',
                marginBottom: 12,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {resumeCourse.title}
              </div>
              <div className="progress-track" style={{ maxWidth: 280 }}>
                <div className="progress-fill" style={{ width: `${pct(resumeCourse)}%` }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                {pct(resumeCourse)}% complete · {resumeCourse.lessons?.length || 0} lessons
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ flexShrink: 0, padding: '10px 20px', fontSize: 13 }}
              tabIndex={-1}
            >
              {pct(resumeCourse) === 0 ? 'Start' : 'Continue'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── All courses ───────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <p className="section-label" style={{ marginBottom: 0 }}>All Courses</p>
          <button
            onClick={() => navigate('/courses')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
              color: 'var(--violet-2)',
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 0',
            }}
          >
            View all
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>

        {!ready ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {[0,1,2].map(i => (
              <div key={i} className="glow-card" style={{ padding: '1.1rem', height: 150, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skel h={8} w="70%" />
                <Skel h={14} w="85%" r={4} />
                <Skel h={12} w="50%" />
                <Skel h={4} w="100%" r={99} />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="glow-card" style={{ padding: '2rem', textAlign: 'center', cursor: 'default' }}>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No courses available yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {courses.map(course => (
              <CourseCard key={course.id} course={course} pct={pct(course)} onClick={() => navigate(`/courses/${course.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Pending assignments alert ─────────────────────── */}
      {ready && pendingHW > 0 && (
        <div>
          <p className="section-label">Pending Assignments</p>
          <div
            className="glow-card glow-card--gold"
            style={{
              padding: '1.1rem 1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              cursor: 'default',
              borderColor: 'rgba(245,158,11,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--gold-dim)',
                border: '1px solid rgba(245,158,11,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div style={{ fontSize: 14, color: 'var(--silver)', lineHeight: 1.5 }}>
                You have{' '}
                <span style={{ color: 'var(--gold-2)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  {pendingHW}
                </span>
                {' '}assignment{pendingHW !== 1 ? 's' : ''} to complete.
              </div>
            </div>
            <button
              onClick={() => navigate('/homework')}
              className="btn-ghost"
              style={{ flexShrink: 0, fontSize: 12 }}
            >
              View
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Course Card ──────────────────────────────────────────────────
function CourseCard({ course, pct, onClick }) {
  const isDone = pct === 100
  return (
    <div
      onClick={onClick}
      className="glow-card"
      style={{ padding: '1.1rem 1.2rem', cursor: 'pointer' }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: isDone
          ? 'linear-gradient(90deg, var(--success), #34D399)'
          : 'linear-gradient(90deg, var(--violet), var(--violet-2))',
      }} />

      <div style={{ paddingTop: 4 }}>
        {/* Course icon — placeholder letter */}
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: isDone ? 'rgba(16,185,129,0.1)' : 'var(--violet-dim)',
          border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
          color: isDone ? '#34D399' : 'var(--violet-2)',
          marginBottom: 10,
        }}>
          {(course.title?.[0] || 'C').toUpperCase()}
        </div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          color: 'var(--white)',
          marginBottom: 4,
          lineHeight: 1.3,
        }}>
          {course.title}
        </div>

        {course.description && (
          <div style={{
            fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {course.description}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            {course.lessons?.length || 0} lessons
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 12,
            color: isDone ? '#34D399' : 'var(--violet-2)',
          }}>
            {pct}%
          </span>
        </div>

        <div className="progress-track">
          <div
            className={`progress-fill${isDone ? ' progress-fill--green' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className="glow-card" style={{ padding: '1.25rem 1.4rem', cursor: 'default' }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10,
      }}>
        {label}
      </div>
      <div className="stat-num" style={{ color }}>
        {value}
      </div>
    </div>
  )
}
