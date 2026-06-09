import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const css = `@keyframes spin { to { transform: rotate(360deg) } }`

const inputStyle = {
  display: 'block', width: '100%', padding: '9px 12px',
  background: 'rgba(5,14,34,0.8)', border: '1px solid rgba(60,203,255,0.15)',
  borderRadius: 8, color: '#F8FFFF',
  fontFamily: "'Open Sans', sans-serif", fontSize: 13, outline: 'none',
  transition: 'border-color 0.15s', boxSizing: 'border-box',
}

function Label({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: 10, fontWeight: 700,
      letterSpacing: 1, textTransform: 'uppercase',
      color: '#6E7B8F', marginBottom: 5,
    }}>{children}</label>
  )
}

function GradientBtn({ children, danger, sm, disabled, onClick, type = 'button' }) {
  const base = {
    padding: sm ? '6px 14px' : '10px 20px',
    borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
    fontSize: sm ? 11 : 12, letterSpacing: 0.5,
    opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
  }
  if (danger) return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...base, background: 'rgba(231,76,60,0.1)',
      border: '1px solid rgba(231,76,60,0.3)', color: '#E74C3C',
    }}>{children}</button>
  )
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...base,
      background: disabled ? 'rgba(13,95,224,0.4)' : 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
      color: '#fff', boxShadow: disabled ? 'none' : '0 4px 14px rgba(15,111,255,0.3)',
    }}>{children}</button>
  )
}

export default function ManageAssignments() {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses]         = useState([])
  const [submissions, setSubmissions] = useState([])
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm] = useState({ title: '', description: '', due_date: '', course_id: '' })
  const [saving, setSaving]           = useState(false)
  const [loading, setLoading]         = useState(true)
  const [expandedSubs, setExpandedSubs] = useState(null)
  const [subDetails, setSubDetails]   = useState([])

  useEffect(() => {
    async function load() {
      const [a, c, s] = await Promise.all([
        supabase.from('assignments').select('*, courses(title)').order('created_at', { ascending: false }),
        supabase.from('courses').select('id, title').order('position'),
        supabase.from('submissions').select('assignment_id'),
      ])
      setAssignments(a.data || [])
      setCourses(c.data || [])
      setSubmissions(s.data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function addAssignment() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        title:       form.title.trim(),
        description: form.description.trim(),
        due_date:    form.due_date.trim(),
        course_id:   form.course_id || null,
      })
      .select('*, courses(title)').single()
    if (!error) {
      setAssignments(prev => [data, ...prev])
      setForm({ title: '', description: '', due_date: '', course_id: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function deleteAssignment(id) {
    if (!confirm('Delete this assignment and all student submissions?')) return
    await supabase.from('assignments').delete().eq('id', id)
    setAssignments(prev => prev.filter(a => a.id !== id))
  }

  async function viewSubmissions(assignmentId) {
    if (expandedSubs === assignmentId) { setExpandedSubs(null); return }
    const { data } = await supabase
      .from('submissions')
      .select('*, profiles(full_name, email)')
      .eq('assignment_id', assignmentId)
    setSubDetails(data || [])
    setExpandedSubs(assignmentId)
  }

  const subCount = id => submissions.filter(s => s.assignment_id === id).length

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 24, color: '#fff', marginBottom: 4 }}>
            Assignments
          </div>
          <p style={{ fontSize: 13, color: '#6E7B8F', margin: 0 }}>
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} · {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <GradientBtn onClick={() => setShowForm(true)}>+ Add Assignment</GradientBtn>
      </div>

      {/* New Assignment Form */}
      {showForm && (
        <div style={{
          background: 'rgba(11,22,40,0.95)', border: '1px solid rgba(60,203,255,0.2)',
          borderRadius: 14, padding: '1.5rem', marginBottom: '1.25rem',
        }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: '#3CCBFF', marginBottom: '1rem', letterSpacing: 0.5 }}>
            New Assignment
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <Label>Course (optional)</Label>
            <select
              value={form.course_id}
              onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))}
              style={{ ...inputStyle }}
              onFocus={e => { e.target.style.borderColor = '#0F6FFF' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(60,203,255,0.15)' }}
            >
              <option value="">No specific course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <Label>Title</Label>
            <input
              style={inputStyle} placeholder="e.g. Week 1 Reflection"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = '#0F6FFF' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(60,203,255,0.15)' }}
            />
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <Label>Instructions for Students</Label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What should students do and submit?"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }}
              onFocus={e => { e.target.style.borderColor = '#0F6FFF' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(60,203,255,0.15)' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Label>Due Date</Label>
            <input
              style={inputStyle} placeholder="e.g. July 15, 2026"
              value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = '#0F6FFF' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(60,203,255,0.15)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <GradientBtn onClick={addAssignment} disabled={saving}>
              {saving ? 'Saving...' : 'Save Assignment'}
            </GradientBtn>
            <GradientBtn danger onClick={() => setShowForm(false)}>Cancel</GradientBtn>
          </div>
        </div>
      )}

      {assignments.length === 0 && !showForm && (
        <div style={{
          background: 'rgba(15,111,255,0.04)', border: '1px solid rgba(15,111,255,0.12)',
          borderRadius: 12, padding: '1.5rem', fontSize: 13, color: '#6E7B8F',
        }}>
          No assignments yet. Click "+ Add Assignment" to create one.
        </div>
      )}

      {/* Assignment list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {assignments.map((a) => {
          const count = subCount(a.id)
          const isExpanded = expandedSubs === a.id
          return (
            <div key={a.id} style={{
              background: 'rgba(11,22,40,0.9)', border: '1px solid rgba(15,111,255,0.14)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, #0F6FFF, #3CCBFF)' }} />

              <div style={{ padding: '1.25rem 1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#F8FFFF', marginBottom: 6 }}>
                      {a.title}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {a.due_date && <span style={{ fontSize: 11, color: '#6E7B8F' }}>Due {a.due_date}</span>}
                    <GradientBtn sm danger onClick={() => deleteAssignment(a.id)}>Delete</GradientBtn>
                  </div>
                </div>

                <p style={{ fontSize: 12.5, color: '#8CA0BE', lineHeight: 1.7, marginBottom: '1rem' }}>
                  {a.description}
                </p>

                {/* Submissions toggle */}
                <button
                  onClick={() => viewSubmissions(a.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: count > 0 ? 'rgba(60,203,255,0.08)' : 'rgba(255,255,255,0.04)',
                    color: count > 0 ? '#3CCBFF' : '#6E7B8F',
                    fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
                    fontSize: 11, letterSpacing: 0.3, transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    background: count > 0 ? 'rgba(60,203,255,0.15)' : 'rgba(255,255,255,0.08)',
                    borderRadius: '50%', width: 20, height: 20,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900,
                  }}>{count}</span>
                  Submission{count !== 1 ? 's' : ''} {isExpanded ? '▲' : '▼'}
                </button>

                {/* Expanded submissions */}
                {isExpanded && (
                  <div style={{ marginTop: '1rem' }}>
                    {subDetails.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#6E7B8F', padding: '0.5rem 0' }}>No submissions yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {subDetails.map(sub => (
                          <div key={sub.id} style={{
                            background: 'rgba(5,14,34,0.7)',
                            border: '1px solid rgba(15,111,255,0.12)',
                            borderRadius: 10, padding: '1rem 1.1rem',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: '#F8FFFF' }}>
                                {sub.profiles?.full_name || sub.profiles?.email || 'Student'}
                              </div>
                              <div style={{ fontSize: 10.5, color: '#6E7B8F' }}>
                                {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                            <p style={{ fontSize: 12.5, color: '#C9D1DC', lineHeight: 1.7, margin: 0 }}>{sub.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
