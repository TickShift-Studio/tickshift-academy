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

function FormInput({ label, ...props }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <label style={{
        display: 'block', fontSize: 10, fontWeight: 700,
        letterSpacing: 1, textTransform: 'uppercase',
        color: '#6E7B8F', marginBottom: 5,
      }}>{label}</label>
      <input
        style={inputStyle}
        onFocus={e => { e.target.style.borderColor = '#0F6FFF' }}
        onBlur={e => { e.target.style.borderColor = 'rgba(60,203,255,0.15)' }}
        {...props}
      />
    </div>
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
      ...base, background: disabled ? 'rgba(13,95,224,0.4)' : 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
      color: '#fff', boxShadow: disabled ? 'none' : '0 4px 14px rgba(15,111,255,0.3)',
    }}>{children}</button>
  )
}

export default function ManageCourses() {
  const [courses, setCourses]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [openLesson, setOpenLesson] = useState(null)
  const [newCourse, setNewCourse]   = useState({ title: '', description: '', emoji: '' })
  const [newLesson, setNewLesson]   = useState({ title: '', youtube_id: '', duration: '' })
  const [saving, setSaving]         = useState(false)

  async function load() {
    const { data } = await supabase.from('courses').select('*, lessons(*)').order('position')
    setCourses(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function addCourse() {
    if (!newCourse.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title:       newCourse.title.trim(),
        description: newCourse.description.trim(),
        emoji:       newCourse.emoji.trim() || '📈',
        position:    courses.length,
      })
      .select().single()
    if (!error) {
      setCourses(prev => [...prev, { ...data, lessons: [] }])
      setNewCourse({ title: '', description: '', emoji: '' })
      setShowAddCourse(false)
    }
    setSaving(false)
  }

  async function deleteCourse(courseId) {
    if (!confirm('Delete this course and all its lessons?')) return
    await supabase.from('courses').delete().eq('id', courseId)
    setCourses(prev => prev.filter(c => c.id !== courseId))
  }

  async function addLesson(courseId) {
    if (!newLesson.title.trim() || !newLesson.youtube_id.trim()) return
    setSaving(true)
    const course = courses.find(c => c.id === courseId)
    const youtubeId = newLesson.youtube_id
      .replace('https://www.youtube.com/watch?v=', '')
      .replace('https://youtu.be/', '')
      .split('&')[0].split('?')[0]

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        title:     newLesson.title.trim(),
        youtube_id: youtubeId,
        duration:  newLesson.duration.trim() || '0:00',
        position:  course?.lessons?.length || 0,
      })
      .select().single()

    if (!error) {
      setCourses(prev => prev.map(c =>
        c.id === courseId ? { ...c, lessons: [...(c.lessons || []), data] } : c
      ))
      setNewLesson({ title: '', youtube_id: '', duration: '' })
      setOpenLesson(null)
    }
    setSaving(false)
  }

  async function deleteLesson(courseId, lessonId) {
    await supabase.from('lessons').delete().eq('id', lessonId)
    setCourses(prev => prev.map(c =>
      c.id === courseId ? { ...c, lessons: c.lessons.filter(l => l.id !== lessonId) } : c
    ))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#08162E' }}>
      <style>{css}</style>
      <div style={{ width: 38, height: 38, border: '3px solid rgba(15,111,255,0.2)', borderTopColor: '#0F6FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const gradients = [
    'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
    'linear-gradient(135deg, #3CCBFF, #0D5FE0)',
    'linear-gradient(135deg, #0D1F3C, #0F6FFF)',
    'linear-gradient(135deg, #1a3a6e, #3CCBFF)',
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#08162E', padding: '2rem 2.25rem', fontFamily: "'Open Sans', sans-serif" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 24, color: '#fff', marginBottom: 4 }}>
            Courses
          </div>
          <p style={{ fontSize: 13, color: '#6E7B8F', margin: 0 }}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} · {courses.reduce((a, c) => a + (c.lessons?.length || 0), 0)} total lessons
          </p>
        </div>
        <GradientBtn onClick={() => setShowAddCourse(true)}>+ Add Course</GradientBtn>
      </div>

      {/* Add Course Form */}
      {showAddCourse && (
        <div style={{
          background: 'rgba(11,22,40,0.95)', border: '1px solid rgba(60,203,255,0.2)',
          borderRadius: 14, padding: '1.5rem', marginBottom: '1.25rem',
        }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: '#3CCBFF', marginBottom: '1rem', letterSpacing: 0.5 }}>
            New Course
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
            <FormInput label="Course Title" placeholder="e.g. The OTE Model" value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))} />
            <FormInput label="Emoji" placeholder="📈" style={{ width: 70 }} value={newCourse.emoji} onChange={e => setNewCourse(p => ({ ...p, emoji: e.target.value }))} />
          </div>
          <FormInput label="Description" placeholder="Short description shown on course card" value={newCourse.description} onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <GradientBtn onClick={addCourse} disabled={saving}>{saving ? 'Saving...' : 'Save Course'}</GradientBtn>
            <GradientBtn danger onClick={() => setShowAddCourse(false)}>Cancel</GradientBtn>
          </div>
        </div>
      )}

      {courses.length === 0 && !showAddCourse && (
        <div style={{
          background: 'rgba(15,111,255,0.04)', border: '1px solid rgba(15,111,255,0.12)',
          borderRadius: 12, padding: '1.5rem', fontSize: 13, color: '#6E7B8F',
        }}>
          No courses yet. Click "+ Add Course" to create your first one.
        </div>
      )}

      {/* Course list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {courses.map((course, ci) => (
          <div key={course.id} style={{
            background: 'rgba(11,22,40,0.9)', border: '1px solid rgba(15,111,255,0.14)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {/* Course header bar */}
            <div style={{ height: 4, background: gradients[ci % gradients.length] }} />

            <div style={{ padding: '1.25rem 1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: gradients[ci % gradients.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>{course.emoji || '📈'}</div>
                  <div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#F8FFFF', marginBottom: 3 }}>
                      {course.title}
                    </div>
                    {course.description && (
                      <div style={{ fontSize: 12, color: '#6E7B8F' }}>{course.description}</div>
                    )}
                    <div style={{ fontSize: 10.5, color: '#4A6FA5', marginTop: 4 }}>
                      {course.lessons?.length || 0} lesson{course.lessons?.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <GradientBtn sm onClick={() => setOpenLesson(openLesson === course.id ? null : course.id)}>
                    + Add Lesson
                  </GradientBtn>
                  <GradientBtn sm danger onClick={() => deleteCourse(course.id)}>Delete</GradientBtn>
                </div>
              </div>

              {/* Add Lesson Form */}
              {openLesson === course.id && (
                <div style={{
                  background: 'rgba(5,14,34,0.7)', border: '1px solid rgba(60,203,255,0.15)',
                  borderRadius: 10, padding: '1rem', marginBottom: '0.75rem',
                }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, color: '#3CCBFF', marginBottom: '0.75rem', letterSpacing: 0.5 }}>
                    New Lesson
                  </div>
                  <FormInput label="Lesson Title" placeholder="e.g. Introduction to OTE" value={newLesson.title} onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))} />
                  <FormInput label="YouTube Video ID or URL" placeholder="e.g. dQw4w9WgXcQ or full URL" value={newLesson.youtube_id} onChange={e => setNewLesson(p => ({ ...p, youtube_id: e.target.value }))} />
                  <FormInput label="Duration (optional)" placeholder="e.g. 12:34" value={newLesson.duration} onChange={e => setNewLesson(p => ({ ...p, duration: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <GradientBtn sm onClick={() => addLesson(course.id)} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Lesson'}
                    </GradientBtn>
                    <GradientBtn sm danger onClick={() => setOpenLesson(null)}>Cancel</GradientBtn>
                  </div>
                </div>
              )}

              {/* Lesson list */}
              {course.lessons?.length === 0 ? (
                <div style={{ fontSize: 12, color: '#4A6FA5', padding: '6px 0' }}>No lessons yet — add one above.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[...(course.lessons || [])].sort((a, b) => a.position - b.position).map((lesson, li) => (
                    <div key={lesson.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 8,
                      background: 'rgba(5,14,34,0.5)',
                      border: '1px solid rgba(15,111,255,0.08)',
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(15,111,255,0.15)',
                        border: '1px solid rgba(60,203,255,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: '#3CCBFF',
                      }}>{li + 1}</div>
                      <div style={{ flex: 1, fontSize: 13, color: '#E2EAF4', fontWeight: 500 }}>{lesson.title}</div>
                      <div style={{ fontSize: 11, color: '#4A6FA5', marginRight: 6 }}>{lesson.duration}</div>
                      <button
                        onClick={() => deleteLesson(course.id, lesson.id)}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: '#E74C3C', fontSize: 13, padding: '2px 6px',
                          opacity: 0.6, transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.6' }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
