import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const EMPTY_COURSE  = { title: '', description: '', emoji: '', position: 0 }
const EMPTY_LESSON  = { title: '', youtube_id: '', duration: '', position: 0, course_id: '' }

export default function AdminCourses() {
  const [courses, setCourses]         = useState([])
  const [lessons, setLessons]         = useState([])
  const [expanded, setExpanded]       = useState(null)
  const [loading, setLoading]         = useState(true)

  // Course form
  const [courseForm, setCourseForm]   = useState(null)
  const [savingCourse, setSavingCourse] = useState(false)
  const [courseErr, setCourseErr]     = useState('')

  // Lesson form
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

  const inputStyle = { display: 'block', width: '100%', padding: '9px 11px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }
  const labelStyle = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 28, color: 'var(--white)', marginBottom: 4 }}>Courses</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Build and manage your curriculum.</p>
        </div>
        <button onClick={() => { setCourseForm({ ...EMPTY_COURSE }); setCourseErr('') }}
          style={{ padding: '10px 18px', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12 }}>
          + New Course
        </button>
      </div>

      {/* Course form modal */}
      {courseForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 17, color: 'var(--white)', marginBottom: '1.25rem' }}>
              {courseForm.id ? 'Edit Course' : 'New Course'}
            </h2>
            <form onSubmit={saveCourse}>
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}>Title *</label>
                <input value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} placeholder="e.g. Futures Foundations" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
              </div>
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}>Description</label>
                <textarea value={courseForm.description || ''} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Brief course overview" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <label style={labelStyle}>Emoji</label>
                  <input value={courseForm.emoji || ''} onChange={e => setCourseForm(p => ({ ...p, emoji: e.target.value }))} style={inputStyle} placeholder="📈" />
                </div>
                <div>
                  <label style={labelStyle}>Position</label>
                  <input type="number" value={courseForm.position || 0} onChange={e => setCourseForm(p => ({ ...p, position: parseInt(e.target.value) || 0 }))} style={inputStyle} onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                </div>
              </div>
              {courseErr && <div style={{ padding: '9px 12px', borderRadius: 7, marginBottom: '0.9rem', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--danger)', fontSize: 13 }}>{courseErr}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setCourseForm(null)} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12 }}>Cancel</button>
                <button type="submit" disabled={savingCourse} style={{ padding: '9px 20px', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: savingCourse ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, opacity: savingCourse ? 0.6 : 1 }}>{savingCourse ? 'Saving…' : 'Save Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson form modal */}
      {lessonForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 17, color: 'var(--white)', marginBottom: '1.25rem' }}>
              {lessonForm.id ? 'Edit Lesson' : 'New Lesson'}
            </h2>
            <form onSubmit={saveLesson}>
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}>Title *</label>
                <input value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} placeholder="e.g. Intro to Order Flow" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
              </div>
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}>YouTube ID</label>
                <input value={lessonForm.youtube_id || ''} onChange={e => setLessonForm(p => ({ ...p, youtube_id: e.target.value }))} style={inputStyle} placeholder="dQw4w9WgXcQ" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <label style={labelStyle}>Duration</label>
                  <input value={lessonForm.duration || ''} onChange={e => setLessonForm(p => ({ ...p, duration: e.target.value }))} style={inputStyle} placeholder="12:45" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label style={labelStyle}>Position</label>
                  <input type="number" value={lessonForm.position || 0} onChange={e => setLessonForm(p => ({ ...p, position: parseInt(e.target.value) || 0 }))} style={inputStyle} onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                </div>
              </div>
              {lessonErr && <div style={{ padding: '9px 12px', borderRadius: 7, marginBottom: '0.9rem', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--danger)', fontSize: 13 }}>{lessonErr}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setLessonForm(null)} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12 }}>Cancel</button>
                <button type="submit" disabled={savingLesson} style={{ padding: '9px 20px', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: savingLesson ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, opacity: savingLesson ? 0.6 : 1 }}>{savingLesson ? 'Saving…' : 'Save Lesson'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div style={{ width: 28, height: 28, border: '2px solid rgba(15,111,255,0.18)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        </div>
      ) : courses.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
          No courses yet. Click "+ New Course" to add one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {courses.map(course => {
            const cl = courseLessons(course.id)
            const open = expanded === course.id
            return (
              <div key={course.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.25rem', cursor: 'pointer' }}
                  onClick={() => setExpanded(open ? null : course.id)}>
                  <span style={{ fontSize: 20 }}>{course.emoji || '📈'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>{course.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cl.length} lesson{cl.length !== 1 ? 's' : ''}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setCourseForm({ ...course }); setCourseErr('') }}
                    style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--silver)', cursor: 'pointer', padding: '5px 11px', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700 }}>Edit</button>
                  <button onClick={e => { e.stopPropagation(); deleteCourse(course.id) }}
                    style={{ background: 'transparent', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer', padding: '5px 11px', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700 }}>Delete</button>
                  <span style={{ color: 'var(--muted)', fontSize: 13, userSelect: 'none' }}>{open ? '▲' : '▼'}</span>
                </div>

                {open && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                      <button onClick={() => { setLessonForm({ ...EMPTY_LESSON, course_id: course.id }); setLessonErr('') }}
                        style={{ padding: '7px 14px', background: 'var(--blue-dim)', border: '1px solid rgba(15,111,255,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--cyan)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 11 }}>
                        + Add Lesson
                      </button>
                    </div>
                    {cl.length === 0 ? (
                      <div style={{ padding: '1rem 1.25rem', fontSize: 12, color: 'var(--muted)' }}>No lessons yet. Add one above.</div>
                    ) : (
                      cl.map((lesson, i) => (
                        <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1.25rem', borderBottom: i < cl.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{i + 1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: 'var(--silver)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</div>
                            {lesson.duration && <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{lesson.duration}</div>}
                          </div>
                          <button onClick={() => { setLessonForm({ ...lesson }); setLessonErr('') }}
                            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--silver)', cursor: 'pointer', padding: '4px 10px', fontSize: 10, fontFamily: 'var(--font-head)', fontWeight: 700 }}>Edit</button>
                          <button onClick={() => deleteLesson(lesson.id)}
                            style={{ background: 'transparent', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer', padding: '4px 10px', fontSize: 10, fontFamily: 'var(--font-head)', fontWeight: 700 }}>Del</button>
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
