import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const BADGE_COLORS = ['badge-blue', 'badge-cyan', 'badge-silver', 'badge-green']

export default function ManageAssignments() {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', due_date: '', course_id: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedSubs, setExpandedSubs] = useState(null)
  const [subDetails, setSubDetails] = useState([])

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
      .insert({ title: form.title.trim(), description: form.description.trim(), due_date: form.due_date.trim(), course_id: form.course_id || null })
      .select('*, courses(title)')
      .single()
    if (!error) {
      setAssignments(prev => [data, ...prev])
      setForm({ title: '', description: '', due_date: '', course_id: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function deleteAssignment(id) {
    if (!confirm('Delete this assignment and all submissions?')) return
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

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div className="main-content">
      <div className="row-header">
        <div className="page-title" style={{ marginBottom: 0 }}>Assignments</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add Assignment</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: 1, marginBottom: '0.75rem', color: 'var(--silver)', textTransform: 'uppercase' }}>
            New Assignment
          </div>
          <div className="form-group">
            <label className="form-label">Course (optional)</label>
            <select className="form-select" value={form.course_id} onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))}>
              <option value="">No specific course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" placeholder="e.g. Week 1 Reflection" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Instructions for Students</label>
            <textarea className="form-textarea" placeholder="What should students do and submit?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-input" placeholder="e.g. April 30, 2026" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={addAssignment} disabled={saving}>
              {saving ? 'Saving...' : 'Save Assignment'}
            </button>
            <button className="btn btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {assignments.length === 0 && !showForm && (
        <div className="info-box">No assignments yet. Click "+ Add Assignment" to create one.</div>
      )}

      {assignments.map((a, i) => (
        <div key={a.id} className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)', fontSize: 14, marginBottom: 5 }}>{a.title}</div>
              {a.courses && <span className={`badge ${BADGE_COLORS[i % BADGE_COLORS.length]}`}>{a.courses.title}</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
              {a.due_date && <span style={{ fontSize: 11, color: 'var(--slate)' }}>Due {a.due_date}</span>}
              <button className="btn btn-sm btn-danger" onClick={() => deleteAssignment(a.id)}>Delete</button>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--silver)', lineHeight: 1.7, marginBottom: 12 }}>{a.description}</p>

          <button
            className="btn btn-sm"
            style={{ color: subCount(a.id) > 0 ? 'var(--cyan)' : 'var(--slate)' }}
            onClick={() => viewSubmissions(a.id)}
          >
            {subCount(a.id)} submission{subCount(a.id) !== 1 ? 's' : ''} {expandedSubs === a.id ? '▲' : '▼'}
          </button>

          {expandedSubs === a.id && (
            <div style={{ marginTop: 12 }}>
              {subDetails.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--slate)' }}>No submissions yet.</p>
              )}
              {subDetails.map(sub => (
                <div key={sub.id} style={{ background: 'rgba(8,22,46,0.6)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-head)' }}>
                      {sub.profiles?.full_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--slate)' }}>
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--silver)', lineHeight: 1.6 }}>{sub.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
