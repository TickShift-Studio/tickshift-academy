import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

export default function Homework() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [drafts, setDrafts] = useState({})
  const [submitting, setSubmitting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')

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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#08162E' }}>
      <div style={{
        width: 38, height: 38, border: '3px solid rgba(15,111,255,0.2)',
        borderTopColor: '#0F6FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const pending = assignments.filter(a => !submissions[a.id])
  const submitted = assignments.filter(a => submissions[a.id])
  const displayed = tab === 'pending' ? pending : submitted
  return (
    <div style={{
      minHeight: '100vh', background: '#08162E',
      padding: '2rem 2.25rem',
      fontFamily: "'Open Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{
          fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
          fontSize: 22, color: '#F8FFFF', marginBottom: 4,
        }}>Assignments</div>
        <p style={{ fontSize: 12.5, color: '#6E7B8F' }}>
          Complete your assignments to reinforce what you've learned.
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Pending', value: pending.length, color: pending.length > 0 ? '#E74C3C' : '#2ECC71', bg: pending.length > 0 ? 'rgba(231,76,60,0.08)' : 'rgba(46,204,113,0.08)', border: pending.length > 0 ? 'rgba(231,76,60,0.2)' : 'rgba(46,204,113,0.2)' },
          { label: 'Submitted', value: submitted.length, color: '#3CCBFF', bg: 'rgba(60,203,255,0.06)', border: 'rgba(60,203,255,0.18)' },
          { label: 'Total', value: assignments.length, color: '#C9D1DC', bg: 'rgba(201,209,220,0.05)', border: 'rgba(201,209,220,0.15)' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: stat.bg, border: `1px solid ${stat.border}`,
            borderRadius: 10, padding: '0.75rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
              fontSize: 22, color: stat.color,
            }}>{stat.value}</span>
            <span style={{ fontSize: 11, color: '#6E7B8F', fontWeight: 600, letterSpacing: 0.5 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: '1.5rem',
        background: 'rgba(13,31,60,0.5)',
        border: '1px solid rgba(15,111,255,0.12)',
        borderRadius: 10, padding: 4, width: 'fit-content',
      }}>
        {[
          { key: 'pending', label: `Pending (${pending.length})` },
          { key: 'submitted', label: `Submitted (${submitted.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px', borderRadius: 7, border: 'none',
              background: tab === t.key ? 'rgba(15,111,255,0.22)' : 'transparent',
              color: tab === t.key ? '#3CCBFF' : '#6E7B8F',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              fontFamily: "'Montserrat', sans-serif", letterSpacing: 0.5,
              transition: 'all 0.15s',
              boxShadow: tab === t.key ? 'inset 0 0 0 1px rgba(60,203,255,0.3)' : 'none',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Empty state */}
      {assignments.length === 0 && (
        <div style={{
          background: 'rgba(15,111,255,0.05)',
          border: '1px solid rgba(15,111,255,0.15)',
          borderRadius: 12, padding: '1.5rem',
          fontSize: 13, color: '#6E7B8F',
        }}>
          No assignments yet. Your mentor will post them soon!
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayed.map((a) => {
          const sub = submissions[a.id]
          return (
            <div
              key={a.id}
              style={{
                background: 'linear-gradient(135deg, rgba(13,31,60,0.85), rgba(8,18,46,0.9))',
                border: `1px solid ${sub ? 'rgba(46,204,113,0.18)' : 'rgba(15,111,255,0.15)'}`,
                borderRadius: 14, overflow: 'hidden',
              }}
            >
              <div style={{
                height: 3,
                background: sub
                  ? 'linear-gradient(90deg, #2ECC71, #27AE60)'
                  : 'linear-gradient(90deg, #0F6FFF, #3CCBFF)',
              }} />

              <div style={{ padding: '1.25rem 1.4rem' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: '0.75rem', gap: 12,
                }}>
                  <div>
                    <div style={{
                      fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
                      fontSize: 15, color: '#F8FFFF', marginBottom: 6,
                    }}>{a.title}</div>
                    {a.courses && (
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8,
                        background: 'rgba(15,111,255,0.12)',
                        border: '1px solid rgba(60,203,255,0.2)',
                        color: '#3CCBFF', borderRadius: 100, padding: '2px 10px',
                      }}>{a.courses.title}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {sub && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                        color: '#2ECC71', background: 'rgba(46,204,113,0.1)',
                        border: '1px solid rgba(46,204,113,0.25)',
                        borderRadius: 100, padding: '3px 10px',
                      }}>✓ SUBMITTED</span>
                    )}
                    {a.due_date && (
                      <span style={{ fontSize: 11, color: '#6E7B8F' }}>Due {a.due_date}</span>
                    )}
                  </div>
                </div>

                <p style={{
                  fontSize: 13, color: '#C9D1DC', lineHeight: 1.75,
                  marginBottom: sub ? 0 : '1.25rem',
                }}>{a.description}</p>

                {sub && (
                  <div style={{
                    marginTop: '1rem',
                    background: 'rgba(46,204,113,0.04)',
                    border: '1px solid rgba(46,204,113,0.15)',
                    borderRadius: 10, padding: '1rem 1.1rem',
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                      color: '#2ECC71', marginBottom: 8, textTransform: 'uppercase',
                    }}>
                      Your Response — {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <p style={{ fontSize: 12.5, color: '#C9D1DC', lineHeight: 1.7 }}>{sub.content}</p>
                  </div>
                )}

                {!sub && (
                  <>
                    <div>
                      <label style={{
                        fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
                        color: '#6E7B8F', textTransform: 'uppercase',
                        display: 'block', marginBottom: 6,
                      }}>Your Response</label>
                      <textarea
                        placeholder="Type your response here..."
                        value={drafts[a.id] || ''}
                        onChange={e => setDrafts(prev => ({ ...prev, [a.id]: e.target.value }))}
                        rows={5}
                        style={{
                          display: 'block', width: '100%',
                          padding: '11px 13px',
                          background: 'rgba(5,14,34,0.8)',
                          border: '1px solid rgba(15,111,255,0.15)',
                          borderRadius: 9, color: '#F8FFFF',
                          fontFamily: "'Open Sans', sans-serif",
                          fontSize: 13, lineHeight: 1.6,
                          resize: 'vertical', outline: 'none',
                          transition: 'border-color 0.15s',
                          minHeight: 110,
                        }}
                        onFocus={e => e.target.style.borderColor = '#0F6FFF'}
                        onBlur={e => e.target.style.borderColor = 'rgba(15,111,255,0.15)'}
                      />
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button
                        onClick={() => handleSubmit(a.id)}
                        disabled={submitting === a.id || !drafts[a.id]?.trim()}
                        style={{
                          padding: '11px 24px', borderRadius: 9,
                          background: (!drafts[a.id]?.trim() || submitting === a.id)
                            ? 'rgba(13,95,224,0.4)'
                            : 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
                          border: 'none', color: '#fff',
                          cursor: (!drafts[a.id]?.trim() || submitting === a.id) ? 'not-allowed' : 'pointer',
                          fontSize: 12, fontWeight: 700,
                          fontFamily: "'Montserrat', sans-serif", letterSpacing: 1.5,
                          transition: 'all 0.15s',
                          boxShadow: drafts[a.id]?.trim() ? '0 4px 16px rgba(15,111,255,0.3)' : 'none',
                          opacity: (!drafts[a.id]?.trim()) ? 0.5 : 1,
                        }}
                      >
                        {submitting === a.id ? 'Submitting...' : 'Submit Assignment'}
                      </button>
                      {drafts[a.id]?.length > 0 && (
                        <span style={{ fontSize: 11, color: '#6E7B8F' }}>{drafts[a.id].length} characters</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {displayed.length === 0 && assignments.length > 0 && (
          <div style={{
            background: 'rgba(46,204,113,0.05)',
            border: '1px solid rgba(46,204,113,0.15)',
            borderRadius: 12, padding: '1.5rem 1.75rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>🎯</div>
            <div style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
              fontSize: 14, color: '#2ECC71', marginBottom: 4,
            }}>
              {tab === 'pending' ? 'All caught up!' : 'Nothing submitted yet.'}
            </div>
            <div style={{ fontSize: 12, color: '#6E7B8F' }}>
              {tab === 'pending'
                ? 'You have no pending assignments right now.'
                : 'Submit your first assignment to see it here.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
