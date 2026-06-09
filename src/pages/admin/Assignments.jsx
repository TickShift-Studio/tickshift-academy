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

  const inputStyle = { display: 'block', width: '100%', padding: '9px 11px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }
  const labelStyle = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 28, color: 'var(--white)', marginBottom: 4 }}>Assignments</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Create and review student work.</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY }); setErr('') }}
          style={{ padding: '10px 18px', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12 }}>
          + New Assignment
        </button>
      </div>

      {/* Form modal */}
      {form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 17, color: 'var(--white)', marginBottom: '1.25rem' }}>{form.id ? 'Edit Assignment' : 'New Assignment'}</h2>
            <form onSubmit={save}>
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}>Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} placeholder="Assignment title" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
              </div>
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}>Instructions</label>
                <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="What should students do?" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <label style={labelStyle}>Course (optional)</label>
                  <select value={form.course_id || ''} onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))}
                    style={{ ...inputStyle }}>
                    <option value="">— General —</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input type="date" value={form.due_date || ''} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} style={inputStyle} onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                </div>
              </div>
              {err && <div style={{ padding: '9px 12px', borderRadius: 7, marginBottom: '0.9rem', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setForm(null)} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div style={{ width: 28, height: 28, border: '2px solid rgba(15,111,255,0.18)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        </div>
      ) : assignments.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
          No assignments yet. Click "+ New Assignment" to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {assignments.map(a => {
            const subs = assignmentSubs(a.id)
            const open = expanded === a.id
            return (
              <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.25rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--white)', marginBottom: 4 }}>{a.title}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {a.courses && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, background: 'var(--blue-dim)', border: '1px solid rgba(15,111,255,0.25)', color: 'var(--cyan)', borderRadius: 20, padding: '2px 9px' }}>{a.courses.title}</span>}
                      {a.due_date && <span style={{ fontSize: 10, color: 'var(--muted)' }}>Due {a.due_date}</span>}
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{subs.length} submission{subs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <button onClick={() => setExpanded(open ? null : a.id)}
                    style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--silver)', cursor: 'pointer', padding: '5px 11px', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700 }}>
                    {open ? 'Hide' : `Submissions (${subs.length})`}
                  </button>
                  <button onClick={() => { setForm({ ...a, course_id: a.course_id || '' }); setErr('') }}
                    style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--silver)', cursor: 'pointer', padding: '5px 11px', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700 }}>Edit</button>
                  <button onClick={() => del(a.id)}
                    style={{ background: 'transparent', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer', padding: '5px 11px', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700 }}>Del</button>
                </div>

                {open && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {subs.length === 0 ? (
                      <div style={{ padding: '1rem 1.25rem', fontSize: 12, color: 'var(--muted)' }}>No submissions yet.</div>
                    ) : (
                      subs.map((sub, i) => (
                        <div key={sub.id} style={{ padding: '1rem 1.25rem', borderBottom: i < subs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--blue-dim)', border: '1px solid rgba(15,111,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>
                              {(sub.profiles?.full_name || sub.profiles?.email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--white)' }}>{sub.profiles?.full_name || sub.profiles?.email || 'Unknown'}</div>
                              {sub.submitted_at && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--silver)', lineHeight: 1.7, background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '0.7rem 0.9rem' }}>{sub.content}</div>
                        </div>
                      ))
                    )}
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
