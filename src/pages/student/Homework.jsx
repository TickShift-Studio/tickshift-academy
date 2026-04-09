import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

const COLORS = ['badge-blue', 'badge-cyan', 'badge-silver', 'badge-green']

export default function Homework() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [drafts, setDrafts] = useState({})
  const [submitting, setSubmitting] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [a, s] = await Promise.all([
        supabase.from('assignments').select('*, courses(title, color, id)').order('created_at', { ascending: false }),
        supabase.from('submissions').select('*').eq('user_id', profile.id),
      ])
      setAssignments(a.data || [])
      const subMap = {}
      ;(s.data || []).forEach(sub => { subMap[sub.assignment_id] = sub })
      setSubmissions(subMap)
      setLoading(false)
    }
    if (profile) load()
  }, [profile])

  async function handleSubmit(assignmentId) {
    const content = drafts[assignmentId]?.trim()
    if (!content) return
    setSubmitting(assignmentId)
    const { data, error } = await supabase
      .from('submissions')
      .insert({ user_id: profile.id, assignment_id: assignmentId, content })
      .select()
      .single()
    if (!error && data) {
      setSubmissions(prev => ({ ...prev, [assignmentId]: data }))
      setDrafts(prev => ({ ...prev, [assignmentId]: '' }))
    }
    setSubmitting(null)
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  const pending = assignments.filter(a => !submissions[a.id])
  const submitted = assignments.filter(a => submissions[a.id])

  return (
    <div className="main-content">
      <div className="page-title">Assignments</div>

      {assignments.length === 0 && (
        <div className="info-box">No assignments yet. Your mentor will post them soon!</div>
      )}

      {pending.length > 0 && (
        <>
          <div className="section-label">Pending ({pending.length})</div>
          {pending.map((a, i) => (
            <div key={a.id} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)', fontSize: 14, marginBottom: 5 }}>
                    {a.title}
                  </div>
                  {a.courses && (
                    <span className={`badge ${COLORS[i % COLORS.length]}`}>{a.courses.title}</span>
                  )}
                </div>
                {a.due_date && (
                  <div style={{ fontSize: 11, color: 'var(--slate)', whiteSpace: 'nowrap' }}>
                    Due {a.due_date}
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, color: 'var(--silver)', margin: '10px 0 14px', lineHeight: 1.7 }}>
                {a.description}
              </p>

              <div className="form-group">
                <label className="form-label">Your Response</label>
                <textarea
                  className="form-textarea"
                  placeholder="Type your response here..."
                  value={drafts[a.id] || ''}
                  onChange={e => setDrafts(prev => ({ ...prev, [a.id]: e.target.value }))}
                  rows={5}
                />
              </div>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleSubmit(a.id)}
                disabled={submitting === a.id || !drafts[a.id]?.trim()}
              >
                {submitting === a.id ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          ))}
        </>
      )}

      {submitted.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: pending.length > 0 ? '1rem' : 0 }}>
            Submitted ({submitted.length})
          </div>
          {submitted.map((a, i) => {
            const sub = submissions[a.id]
            return (
              <div key={a.id} className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)', fontSize: 14, marginBottom: 5 }}>
                      {a.title}
                    </div>
                    {a.courses && (
                      <span className={`badge ${COLORS[i % COLORS.length]}`}>{a.courses.title}</span>
                    )}
                  </div>
                  {a.due_date && (
                    <div style={{ fontSize: 11, color: 'var(--slate)', whiteSpace: 'nowrap' }}>
                      Due {a.due_date}
                    </div>
                  )}
                </div>
                <div className="success-box">
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginBottom: 4, letterSpacing: 0.5 }}>
                    ✓ SUBMITTED {new Date(sub.submitted_at).toLocaleDateString()}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--silver)', lineHeight: 1.6 }}>{sub.content}</p>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
