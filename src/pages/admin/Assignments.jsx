import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const EMPTY = { title: '', description: '', due_date: '', course_id: '' }

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses]         = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [form, setForm]               = useState(null)
  const [saving, setSaving]           = useState(false)
  const [err, setErr]                 = useState('')
  const [expanded, setExpanded]       = useState(null)

  useEffect(() => {
    async function load() {
      const [a, c, s] = await Promise.all([
        supabase.from('assignments').select('*, courses(title)').order('created_at', { ascending: false }),
        supabase.from('courses').select('id, title').order('position'),
        supabase.from('submissions').select('*, profiles(full_name, email)'),
      ])
      setAssignments(a.data || [])
      setCourses(c.data || [])
      setSubmissions(s.data || [])
      setLoading(false)
    }
    load()
  }, [])

  function assignmentSubs(aId) { return submissions.filter(s => s.assignment_id === aId) }

  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) { setErr('Title is required.'); return }
    setSaving(true); setErr('')
    const { id, ...fields } = form
    const payload = { ...fields, course_id: fields.course_id || null }
    let data, error
    if (id) {
      ({ data, error } = await supabase.from('assignments').update(payload).eq('id', id).select('*, courses(title)').single())
      if (!error) setAssignments(prev => prev.map(a => a.id === id ? data : a))
    } else {
      ({ data, error } = await supabase.from('assignments').insert(payload).select('*, courses(title)').single())
      if (!error) setAssignments(prev => [data, ...prev])
    }
    if (error) setErr(error.message)
    else setForm(null)
    setSaving(false)
  }

  async function del(id) {
    if (!confirm('Delete this assignment?')) return
    await supabase.from('assignments').delete().eq('id', id)
    setAssignments(prev => prev.filter(a => a.id !== id))
    setSubmissions(prev => prev.filter(s => s.assignment_id !== id))
    if (expanded === id) setExpanded(null)
  }

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, var(--white) 0%, rgba(248,248,250,0.65) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 6,
          }}>Assignments</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Create and review student work.</p>
        </div>
        <button
          onClick={() => { setForm({ ...EMPTY }); setErr('') }}
          className="btn-primary"
          style={{ flexShrink: 0, padding: '10px 18px', fontSize: 13 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Assignment
        </button>
      </div>

      {/* Form modal */}
      {form && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setForm(null) }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--white)' }}>
                {form.id ? 'Edit Assignment' : 'New Assignment'}
              </h2>
              <button onClick={() => setForm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={save}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="field-label">Title *</label>
                <input className="field-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Assignment title" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="field-label">Instructions</label>
                <textarea className="field-input" value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} style={{ resize: 'vertical' }} placeholder="What should students do?" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">Course (optional)</label>
                  <select className="field-input" value={form.course_id || ''} onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))}>
                    <option value="">— General —</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">Due Date</label>
                  <input type="date" className="field-input" value={form.due_date || ''} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
              </div>
              {err && (
                <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', fontSize: 13 }}>{err}</div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setForm(null)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 22px' }}>
                  {saving ? (
                    <>
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                      Saving…
                    </>
                  ) : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div style={{ width: 28, height: 28, border: '2px solid rgba(139,92,246,0.15)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        </div>
      ) : assignments.length === 0 ? (
        <div className="glow-card" style={{ padding: '2.5rem', textAlign: 'center', cursor: 'default' }}>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No assignments yet. Click "New Assignment" to create one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {assignments.map(a => {
            const subs = assignmentSubs(a.id)
            const open = expanded === a.id
            return (
              <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--white)', marginBottom: 5 }}>{a.title}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {a.courses && (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', background: 'var(--violet-dim)', border: '1px solid rgba(139,92,246,0.25)', color: 'var(--violet-2)', borderRadius: 20, padding: '2px 9px', textTransform: 'uppercase' }}>
                          {a.courses.title}
                        </span>
                      )}
                      {a.due_date && <span style={{ fontSize: 11, color: 'var(--muted)' }}>Due {a.due_date}</span>}
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{subs.length} submission{subs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setExpanded(open ? null : a.id)} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }}>
                      {open ? 'Hide' : `Submissions (${subs.length})`}
                    </button>
                    <button onClick={() => { setForm({ ...a, course_id: a.course_id || '' }); setErr('') }} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }}>Edit</button>
                    <button onClick={() => del(a.id)} className="btn-danger" style={{ padding: '6px 12px', fontSize: 11 }}>Del</button>
                  </div>
                </div>

                {open && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {subs.length === 0 ? (
                      <div style={{ padding: '1rem 1.25rem', fontSize: 13, color: 'var(--muted)' }}>No submissions yet.</div>
                    ) : subs.map((sub, i) => (
                      <div key={sub.id} style={{ padding: '1rem 1.25rem', borderBottom: i < subs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--violet-dim)', border: '1px solid rgba(139,92,246,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: 'var(--violet-2)',
                          }}>
                            {(sub.profiles?.full_name || sub.profiles?.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--white)' }}>{sub.profiles?.full_name || sub.profiles?.email || 'Unknown'}</div>
                            {(sub.submitted_at ?? sub.created_at) && (
                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                {new Date(sub.submitted_at ?? sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--silver)', lineHeight: 1.7, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '0.7rem 0.9rem' }}>
                          {sub.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
