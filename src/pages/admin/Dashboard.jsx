import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'

const css = `@keyframes spin { to { transform: rotate(360deg) } }`

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(13,31,60,0.9), rgba(8,22,46,0.95))',
      border: '1px solid rgba(15,111,255,0.16)', borderRadius: 14,
      padding: '1.25rem 1.35rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#6E7B8F',
        textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
        fontSize: 30, color: accent, lineHeight: 1,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#6E7B8F', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

function ProgressRow({ student, pct, ini }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0.85rem 0',
      borderBottom: '1px solid rgba(15,111,255,0.08)',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff',
      }}>{ini(student.full_name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: '#F8FFFF',
          fontFamily: "'Montserrat', sans-serif", marginBottom: 6,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{student.full_name || student.email}</div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: pct === 100
              ? 'linear-gradient(90deg, #2ECC71, #27AE60)'
              : 'linear-gradient(90deg, #0F6FFF, #3CCBFF)',
            width: `${pct}%`, transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
      <div style={{
        fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
        fontSize: 13, color: pct === 100 ? '#2ECC71' : '#3CCBFF',
        minWidth: 42, textAlign: 'right',
      }}>{pct}%</div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats]       = useState({ students: 0, courses: 0, lessons: 0, submissions: 0 })
  const [students, setStudents] = useState([])
  const [courses, setCourses]   = useState([])
  const [assignments, setAssignments] = useState([])
  const [allProgress, setAllProgress] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const [st, co, as, pr, su] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.from('courses').select('*, lessons(id)').order('position'),
        supabase.from('assignments').select('*, courses(title)').order('created_at', { ascending: false }),
        supabase.from('lesson_progress').select('user_id, lesson_id'),
        supabase.from('submissions').select('id'),
      ])
      const studentList = st.data || []
      const courseList  = co.data || []
      setStudents(studentList)
      setCourses(courseList)
      setAssignments(as.data || [])
      setAllProgress(pr.data || [])
      setStats({
        students:    studentList.length,
        courses:     courseList.length,
        lessons:     pr.data?.length || 0,
        submissions: su.data?.length || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  function studentPct(studentId) {
    const total = courses.reduce((a, c) => a + (c.lessons?.length || 0), 0)
    if (!total) return 0
    return Math.round((allProgress.filter(p => p.user_id === studentId).length / total) * 100)
  }

  const ini = name => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#08162E' }}>
      <style>{css}</style>
      <div style={{ width: 38, height: 38, border: '3px solid rgba(15,111,255,0.2)', borderTopColor: '#0F6FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#08162E', padding: '2rem 2.25rem', fontFamily: "'Open Sans', sans-serif" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 24, color: '#fff', marginBottom: 4 }}>
          Mentor Dashboard
        </div>
        <p style={{ fontSize: 13, color: '#6E7B8F', margin: 0 }}>Overview of your academy's activity.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard label="Total Students"   value={stats.students}    sub="Enrolled profiles"     accent="#3CCBFF" icon="👥" />
        <StatCard label="Courses Live"     value={stats.courses}     sub="Published content"     accent="#0F6FFF" icon="📚" />
        <StatCard label="Lessons Watched"  value={stats.lessons}     sub="All-time completions"  accent="#2ECC71" icon="▶" />
        <StatCard label="Submissions"      value={stats.submissions} sub="Homework submitted"     accent="#F39C12" icon="📝" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Student Progress */}
        <div style={{ background: 'rgba(11,22,40,0.9)', border: '1px solid rgba(15,111,255,0.12)', borderRadius: 14, padding: '1.25rem 1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: '#6E7B8F', textTransform: 'uppercase' }}>Student Progress</div>
            <button
              onClick={() => navigate('/admin/students')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, color: '#3CCBFF', fontWeight: 600 }}
            >View all →</button>
          </div>

          {students.length === 0 ? (
            <div style={{ fontSize: 13, color: '#6E7B8F', padding: '0.5rem 0' }}>No students yet.</div>
          ) : (
            students.slice(0, 6).map(s => (
              <ProgressRow key={s.id} student={s} pct={studentPct(s.id)} ini={ini} />
            ))
          )}
        </div>

        {/* Active Assignments */}
        <div style={{ background: 'rgba(11,22,40,0.9)', border: '1px solid rgba(15,111,255,0.12)', borderRadius: 14, padding: '1.25rem 1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: '#6E7B8F', textTransform: 'uppercase' }}>Active Assignments</div>
            <button
              onClick={() => navigate('/admin/assignments')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, color: '#3CCBFF', fontWeight: 600 }}
            >Manage →</button>
          </div>

          {assignments.length === 0 ? (
            <div style={{ fontSize: 13, color: '#6E7B8F', padding: '0.5rem 0' }}>No assignments created yet.</div>
          ) : (
            assignments.slice(0, 6).map((a, i, arr) => (
              <div key={a.id} style={{
                padding: '0.85rem 0',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(15,111,255,0.08)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: '#F8FFFF', marginBottom: 5 }}>
                    {a.title}
                  </div>
                  {a.due_date && (
                    <span style={{ fontSize: 10.5, color: '#6E7B8F', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Due {a.due_date}
                    </span>
                  )}
                </div>
                {a.courses && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 700,
                    background: 'rgba(15,111,255,0.12)',
                    border: '1px solid rgba(60,203,255,0.2)',
                    color: '#3CCBFF', borderRadius: 100, padding: '2px 9px',
                  }}>{a.courses.title}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
