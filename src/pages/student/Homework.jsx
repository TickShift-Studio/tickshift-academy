import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

export default function Homework() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [drafts, setDrafts]           = useState({})
  const [submitting, setSubmitting]   = useState(null)
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState('pending')

  useEffect(() => {
    async function load() {
      const [a, s] = await Promise.all([
        supabase.from('assignments').select('*, courses(title)').order('created_at', { ascending: false }),
        supabase.from('submissions').select('*').eq('user_id', profile.id),
      ])
      setAssignments(a.data || [])
      const map = {}
      ;(s.data || []).forEach(sub => { map[sub.assignment_id] = sub })
      setSubmissions(map)
      setLoading(false)
    }
    if (profile) load()
  }, [profile])

  async function handleSubmit(assignmentId) {
    const content = drafts[assignmentId]?.trim()
    if (!content) return
    setSubmitting(assignmentId)
    const { data, error } = await supabase.from('submissions')
      .insert({ user_id: profile.id, assignment_id: assignmentId, content })
      .select().single()
    if (!error && data) {
      setSubmissions(prev => ({ ...prev, [assignmentId]: data }))
      setDrafts(prev => ({ ...prev, [assignmentId]: '' }))
    }
    setSubmitting(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(139,92,246,0.15)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.85s linear infinite' }} />
    </div>
  )

  const pending   = assignments.filter(a => !submissions[a.id])
  const submitted = assignments.filter(a =>  submissions[a.id])
  const displayed = tab === 'pending' ? pending : submitted

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, var(--white) 0%, rgba(248,248,250,0.65) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 6,
        }}>Assignments</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          Complete assignments to reinforce your learning.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Pending',   value: pending.length,   color: pending.length > 0 ? 'var(--danger)' : 'var(--success)' },
          { label: 'Submitted', value: submitted.length, color: 'var(--violet-2)' },
          { label: 'Total',     value: assignments.length, color: 'var(--muted)' },
        ].map(s => (
          <div key={s.label} className="glow-card" style={{ padding: '0.75rem 1.1rem', display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: '1.5rem' }}>
        {[['pending', `Pending (${pending.length})`], ['submitted', `Submitted (${submitted.length})`]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: tab === key
                ? 'linear-gradient(135deg, var(--violet), var(--violet-2))'
                : 'transparent',
              color: tab === key ? '#fff' : 'var(--muted)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              letterSpacing: '0.02em',
              transition: 'all 0.2s',
              boxShadow: tab === key ? '0 2px 12px rgba(139,92,246,0.3)' : 'none',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Empty state */}
      {assignments.length === 0 && (
        <div className="glow-card" style={{ padding: '2rem', textAlign: 'center', cursor: 'default' }}>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No assignments yet. Your mentor will post them soon!</p>
        </div>
      )}

      {/* Assignment list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayed.map(a => {
          const sub = submissions[a.id]
          return (
            <div
              key={a.id}
              className="glow-card"
              style={{
                cursor: 'default',
                borderColor: sub ? 'rgba(16,185,129,0.15)' : 'var(--border)',
              }}
            >
              {/* Top accent bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: sub
                  ? 'linear-gradient(90deg, var(--success), #34D399)'
                  : 'linear-gradient(90deg, var(--violet), var(--violet-2))',
              }} />

              <div style={{ padding: '1.25rem 1.4rem', paddingTop: '1.4rem' }}>
                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--white)', marginBottom: 6, lineHeight: 1.3 }}>
                      {a.title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {a.courses && (
                        <span className="badge badge--violet">{a.courses.title}</span>
                      )}
                      {sub && (
                        <span className="badge badge--green">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3 }}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Submitted
                        </span>
                      )}
                    </div>
                  </div>
                  {a.due_date && (
                    <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>Due {a.due_date}</span>
                  )}
                </div>

                <p style={{ fontSize: 13, color: 'var(--silver)', lineHeight: 1.75, marginBottom: sub ? 0 : '1.25rem' }}>
                  {a.description}
                </p>

                {/* Submitted response */}
                {sub && (
                  <div style={{
                    marginTop: '1rem',
                    background: 'rgba(16,185,129,0.04)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.9rem 1rem',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#34D399', marginBottom: 6 }}>
                      Your Response · {new Date(sub.submitted_at ?? sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--silver)', lineHeight: 1.7, margin: 0 }}>{sub.content}</p>
                  </div>
                )}

                {/* Submission form */}
                {!sub && (
                  <>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label className="field-label">Your Response</label>
                      <textarea
                        className="field-input"
                        placeholder="Type your response here…"
                        value={drafts[a.id] || ''}
                        onChange={e => setDrafts(prev => ({ ...prev, [a.id]: e.target.value }))}
                        rows={5}
                        style={{ resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
                      />
                      {drafts[a.id]?.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                          {drafts[a.id].length} characters
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleSubmit(a.id)}
                      disabled={submitting === a.id || !drafts[a.id]?.trim()}
                      className="btn-primary"
                      style={{ padding: '10px 22px' }}
                    >
                      {submitting === a.id ? (
                        <>
                          <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                          Submitting…
                        </>
                      ) : 'Submit Assignment'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {displayed.length === 0 && assignments.length > 0 && (
          <div className="glow-card" style={{ padding: '2rem', textAlign: 'center', cursor: 'default' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--white)', marginBottom: 6 }}>
              {tab === 'pending' ? 'All caught up!' : 'Nothing submitted yet.'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {tab === 'pending' ? 'No pending assignments right now.' : 'Submit your first assignment to see it here.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
