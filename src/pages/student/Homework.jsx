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
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(15,111,255,0.18)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
    </div>
  )

  const pending   = assignments.filter(a => !submissions[a.id])
  const submitted = assignments.filter(a => submissions[a.id])
  const displayed = tab === 'pending' ? pending : submitted

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 28, color: 'var(--white)', marginBottom: 4 }}>Assignments</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Complete your assignments to reinforce what you've learned.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Pending',   value: pending.length,   color: pending.length > 0 ? 'var(--danger)' : 'var(--success)' },
          { label: 'Submitted', value: submitted.length, color: 'var(--cyan)' },
          { label: 'Total',     value: assignments.length, color: 'var(--muted)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: 0.5 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4, width: 'fit-content', marginBottom: '1.5rem' }}>
        {[['pending', `Pending (${pending.length})`], ['submitted', `Submitted (${submitted.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: tab === key ? 'var(--blue)' : 'transparent', color: tab === key ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {assignments.length === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', fontSize: 13, color: 'var(--muted)' }}>
          No assignments yet. Your mentor will post them soon!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayed.map(a => {
          const sub = submissions[a.id]
          return (
            <div key={a.id} style={{ background: 'var(--surface)', border: `1px solid ${sub ? 'rgba(46,204,113,0.18)' : 'var(--border)'}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ height: 3, background: sub ? 'var(--success)' : 'var(--blue)' }} />
              <div style={{ padding: '1.25rem 1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--white)', marginBottom: 6 }}>{a.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {a.courses && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, background: 'var(--blue-dim)', border: '1px solid rgba(15,111,255,0.25)', color: 'var(--cyan)', borderRadius: 20, padding: '2px 9px' }}>{a.courses.title}</span>}
                      {sub && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.25)', color: 'var(--success)', borderRadius: 20, padding: '2px 9px' }}>✓ Submitted</span>}
                    </div>
                  </div>
                  {a.due_date && <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>Due {a.due_date}</span>}
                </div>

                <p style={{ fontSize: 13, color: 'var(--silver)', lineHeight: 1.75, marginBottom: sub ? 0 : '1.25rem' }}>{a.description}</p>

                {sub && (
                  <div style={{ marginTop: '1rem', background: 'rgba(46,204,113,0.04)', border: '1px solid rgba(46,204,113,0.15)', borderRadius: 'var(--radius-sm)', padding: '0.9rem 1rem' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--success)', marginBottom: 6, textTransform: 'uppercase' }}>
                      Your Response — {new Date(sub.submitted_at ?? sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--silver)', lineHeight: 1.7, margin: 0 }}>{sub.content}</p>
                  </div>
                )}

                {!sub && (
                  <>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Your Response</label>
                      <textarea
                        placeholder="Type your response here…"
                        value={drafts[a.id] || ''}
                        onChange={e => setDrafts(prev => ({ ...prev, [a.id]: e.target.value }))}
                        rows={5}
                        style={{ display: 'block', width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none', minHeight: 100 }}
                        onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                      />
                      {drafts[a.id]?.length > 0 && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{drafts[a.id].length} characters</div>}
                    </div>
                    <button
                      onClick={() => handleSubmit(a.id)}
                      disabled={submitting === a.id || !drafts[a.id]?.trim()}
                      style={{ padding: '10px 22px', background: (!drafts[a.id]?.trim() || submitting === a.id) ? 'rgba(15,111,255,0.4)' : 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: (!drafts[a.id]?.trim() || submitting === a.id) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-head)', letterSpacing: 0.5 }}>
                      {submitting === a.id ? 'Submitting…' : 'Submit Assignment'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {displayed.length === 0 && assignments.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--white)', marginBottom: 4 }}>
              {tab === 'pending' ? 'All caught up!' : 'Nothing submitted yet.'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {tab === 'pending' ? 'No pending assignments right now.' : 'Submit your first assignment to see it here.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
