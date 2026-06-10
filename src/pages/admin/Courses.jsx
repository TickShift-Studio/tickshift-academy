import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const EMPTY_COURSE = { title: '', description: '', emoji: '', position: 0 }
const EMPTY_LESSON = { title: '', youtube_id: '', duration: '', position: 0, course_id: '' }

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--white)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

function FormError({ err }) {
  if (!err) return null
  return (
    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', fontSize: 13, display: 'flex', gap: 8 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {err}
    </div>
  )
}

export default function AdminCourses() {
  const [courses, setCourses]         = useState([])
  const [lessons, setLessons]         = useState([])
  const [expanded, setExpanded]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [courseForm, setCourseForm]   = useState(null)
  const [savingCourse, setSavingCourse] = useState(false)
  const [courseErr, setCourseErr]     = useState('')
  const [lessonForm, setLessonForm]   = useState(null)
  const [savingLesson, setSavingLesson] = useState(false)
  const [lessonErr, setLessonErr]     = useState('')

  useEffect(() => {
    async function load() {
      const [c, l] = await Promise.all([
        supabase.from('courses').select('*').order('position'),
        supabase.from('lessons').select('*').order('position'),
      ])
      setCourses(c.data || [])
      setLessons(l.data || [])
      setLoading(false)
    }
    load()
  }, [])

  function courseLessons(cid) { return lessons.filter(l => l.course_id === cid) }

  async function saveCourse(e) {
    e.preventDefault()
    if (!courseForm.title.trim()) { setCourseErr('Title is required.'); return }
    setSavingCourse(true); setCourseErr('')
    const { id, ...fields } = courseForm
    let data, error
    if (id) {
      ({ data, error } = await supabase.from('courses').update(fields).eq('id', id).select().single())
      if (!error) setCourses(prev => prev.map(c => c.id === id ? data : c))
    } else {
      ({ data, error } = await supabase.from('courses').insert(fields).select().single())
      if (!error) setCourses(prev => [...prev, data])
    }
    if (error) setCourseErr(error.message)
    else setCourseForm(null)
    setSavingCourse(false)
  }

  async function deleteCourse(id) {
    if (!confirm('Delete this course and all its lessons?')) return
    await supabase.from('courses').delete().eq('id', id)
    setCourses(prev => prev.filter(c => c.id !== id))
    setLessons(prev => prev.filter(l => l.course_id !== id))
    if (expanded === id) setExpanded(null)
  }

  async function saveLesson(e) {
    e.preventDefault()
    if (!lessonForm.title.trim()) { setLessonErr('Title is required.'); return }
    setSavingLesson(true); setLessonErr('')
    const { id, ...fields } = lessonForm
    let data, error
    if (id) {
      ({ data, error } = await supabase.from('lessons').update(fields).eq('id', id).select().single())
      if (!error) setLessons(prev => prev.map(l => l.id === id ? data : l))
    } else {
      ({ data, error } = await supabase.from('lessons').insert(fields).select().single())
      if (!error) setLessons(prev => [...prev, data])
    }
    if (error) setLessonErr(error.message)
    else setLessonForm(null)
    setSavingLesson(false)
  }

  async function deleteLesson(id) {
    await supabase.from('lessons').delete().eq('id', id)
    setLessons(prev => prev.filter(l => l.id !== id))
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
          }}>Courses</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Build and manage your curriculum.</p>
        </div>
        <button
          onClick={() => { setCourseForm({ ...EMPTY_COURSE }); setCourseErr('') }}
          className="btn-primary"
          style={{ flexShrink: 0, padding: '10px 18px', fontSize: 13 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Course
        </button>
      </div>

      {/* Course form modal */}
      {courseForm && (
        <Modal title={courseForm.id ? 'Edit Course' : 'New Course'} onClose={() => setCourseForm(null)}>
          <form onSubmit={saveCourse}>
            <FormField label="Title *">
              <input className="field-input" value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Futures Foundations" />
            </FormField>
            <FormField label="Description">
              <textarea className="field-input" value={courseForm.description || ''} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Brief course overview" style={{ resize: 'vertical' }} />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <FormField label="Emoji">
                <input className="field-input" value={courseForm.emoji || ''} onChange={e => setCourseForm(p => ({ ...p, emoji: e.target.value }))} placeholder="📈" />
              </FormField>
              <FormField label="Position">
                <input className="field-input" type="number" value={courseForm.position || 0} onChange={e => setCourseForm(p => ({ ...p, position: parseInt(e.target.value) || 0 }))} />
              </FormField>
            </div>
            <FormError err={courseErr} />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCourseForm(null)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={savingCourse} className="btn-primary" style={{ padding: '10px 22px' }}>
                {savingCourse ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                    Saving…
                  </>
                ) : 'Save Course'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lesson form modal */}
      {lessonForm && (
        <Modal title={lessonForm.id ? 'Edit Lesson' : 'New Lesson'} onClose={() => setLessonForm(null)}>
          <form onSubmit={saveLesson}>
            <FormField label="Title *">
              <input className="field-input" value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Intro to Order Flow" />
            </FormField>
            <FormField label="YouTube Video ID">
              <input className="field-input" value={lessonForm.youtube_id || ''} onChange={e => setLessonForm(p => ({ ...p, youtube_id: e.target.value }))} placeholder="dQw4w9WgXcQ" />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <FormField label="Duration">
                <input className="field-input" value={lessonForm.duration || ''} onChange={e => setLessonForm(p => ({ ...p, duration: e.target.value }))} placeholder="12:45" />
              </FormField>
              <FormField label="Position">
                <input className="field-input" type="number" value={lessonForm.position || 0} onChange={e => setLessonForm(p => ({ ...p, position: parseInt(e.target.value) || 0 }))} />
              </FormField>
            </div>
            <FormError err={lessonErr} />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setLessonForm(null)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={savingLesson} className="btn-primary" style={{ padding: '10px 22px' }}>
                {savingLesson ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                    Saving…
                  </>
                ) : 'Save Lesson'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Course list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div style={{ width: 28, height: 28, border: '2px solid rgba(139,92,246,0.15)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.85s linear infinite' }} />
        </div>
      ) : courses.length === 0 ? (
        <div className="glow-card" style={{ padding: '2.5rem', textAlign: 'center', cursor: 'default' }}>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No courses yet. Click "New Course" to add one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {courses.map(course => {
            const cl   = courseLessons(course.id)
            const open = expanded === course.id
            return (
              <div
                key={course.id}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color 0.2s' }}
              >
                {/* Course header row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.25rem', cursor: 'pointer' }}
                  onClick={() => setExpanded(open ? null : course.id)}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'var(--violet-dim)', border: '1px solid rgba(139,92,246,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--violet-2)',
                  }}>
                    {(course.title?.[0] || 'C').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--white)', marginBottom: 2 }}>
                      {course.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cl.length} lesson{cl.length !== 1 ? 's' : ''}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setCourseForm({ ...course }); setCourseErr('') }}
                    className="btn-ghost"
                    style={{ padding: '6px 12px', fontSize: 11 }}
                  >Edit</button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteCourse(course.id) }}
                    className="btn-danger"
                    style={{ padding: '6px 12px', fontSize: 11 }}
                  >Delete</button>
                  <div style={{ color: 'var(--dim)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded: lesson list */}
                {open && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                      <button
                        onClick={() => { setLessonForm({ ...EMPTY_LESSON, course_id: course.id }); setLessonErr('') }}
                        className="btn-ghost"
                        style={{ padding: '7px 14px', fontSize: 12, color: 'var(--violet-2)', borderColor: 'rgba(139,92,246,0.3)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add Lesson
                      </button>
                    </div>
                    {cl.length === 0 ? (
                      <div style={{ padding: '1rem 1.25rem', fontSize: 13, color: 'var(--muted)' }}>No lessons yet. Add one above.</div>
                    ) : cl.map((lesson, i) => (
                      <div
                        key={lesson.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1.25rem', borderBottom: i < cl.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--dim)', flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--silver)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</div>
                          {lesson.duration && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{lesson.duration}</div>}
                        </div>
                        <button onClick={() => { setLessonForm({ ...lesson }); setLessonErr('') }} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }}>Edit</button>
                        <button onClick={() => deleteLesson(lesson.id)} className="btn-danger" style={{ padding: '5px 10px', fontSize: 11 }}>Del</button>
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
