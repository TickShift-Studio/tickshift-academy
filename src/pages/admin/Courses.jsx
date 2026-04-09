import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const BADGE_COLORS = ['badge-blue', 'badge-cyan', 'badge-silver', 'badge-green']

export default function ManageCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [openLesson, setOpenLesson] = useState(null)

  const [newCourse, setNewCourse] = useState({ title: '', description: '' })
  const [newLesson, setNewLesson] = useState({ title: '', youtube_id: '', duration: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('courses')
      .select('*, lessons(*)')
      .order('position')
    setCourses(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function addCourse() {
    if (!newCourse.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('courses')
      .insert({ title: newCourse.title.trim(), description: newCourse.description.trim(), position: courses.length })
      .select()
      .single()
    if (!error) {
      setCourses(prev => [...prev, { ...data, lessons: [] }])
      setNewCourse({ title: '', description: '' })
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
      .split('&')[0]
      .split('?')[0]

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        title: newLesson.title.trim(),
        youtube_id: youtubeId,
        duration: newLesson.duration.trim() || '0:00',
        position: course?.lessons?.length || 0,
      })
      .select()
      .single()

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

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div className="main-content">
      <div className="row-header">
        <div className="page-title" style={{ marginBottom: 0 }}>Courses</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddCourse(true)}>
          + Add Course
        </button>
      </div>

      {/* Add Course Form */}
      {showAddCourse && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: 1, marginBottom: '0.75rem', color: 'var(--silver)', textTransform: 'uppercase' }}>
            New Course
          </div>
          <div className="form-group">
            <label className="form-label">Course Title</label>
            <input className="form-input" placeholder="e.g. Sales Mastery" value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" placeholder="Short description..." value={newCourse.description} onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={addCourse} disabled={saving}>
              {saving ? 'Saving...' : 'Save Course'}
            </button>
            <button className="btn btn-sm" onClick={() => setShowAddCourse(false)}>Cancel</button>
          </div>
        </div>
      )}

      {courses.length === 0 && !showAddCourse && (
        <div className="info-box">No courses yet. Click "+ Add Course" to create your first one.</div>
      )}

      {/* Course list */}
      {courses.map((course, ci) => (
        <div key={course.id} className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <span className={`badge ${BADGE_COLORS[ci % BADGE_COLORS.length]}`} style={{ marginBottom: 6 }}>
                {course.title}
              </span>
              <p style={{ fontSize: 12, color: 'var(--slate)' }}>{course.description}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
              <button className="btn btn-sm" onClick={() => setOpenLesson(openLesson === course.id ? null : course.id)}>
                + Add Lesson
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => deleteCourse(course.id)}>Delete</button>
            </div>
          </div>

          {/* Add Lesson Form */}
          {openLesson === course.id && (
            <div style={{ background: 'rgba(8,22,46,0.6)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Lesson Title</label>
                <input className="form-input" placeholder="Lesson name" value={newLesson.title} onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">YouTube Video ID or URL</label>
                <input className="form-input" placeholder="e.g. dQw4w9WgXcQ or full YouTube URL" value={newLesson.youtube_id} onChange={e => setNewLesson(p => ({ ...p, youtube_id: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (optional)</label>
                <input className="form-input" placeholder="e.g. 12:34" value={newLesson.duration} onChange={e => setNewLesson(p => ({ ...p, duration: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => addLesson(course.id)} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Lesson'}
                </button>
                <button className="btn btn-sm" onClick={() => setOpenLesson(null)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Lessons list */}
          {course.lessons?.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--slate)', padding: '6px 0' }}>No lessons yet — add one above.</p>
          )}
          {(course.lessons || []).sort((a, b) => a.position - b.position).map((lesson, li) => (
            <div key={lesson.id} className="lesson-row" style={{ cursor: 'default' }}>
              <div className="check-circle" style={{ borderColor: 'var(--blue)', color: 'var(--cyan)', fontSize: 11, fontWeight: 700 }}>
                {li + 1}
              </div>
              <div style={{ flex: 1, fontSize: 13 }}>{lesson.title}</div>
              <div style={{ fontSize: 11, color: 'var(--slate)', marginRight: 8 }}>{lesson.duration}</div>
              <button className="btn btn-sm btn-danger" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => deleteLesson(course.id, lesson.id)}>✕</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
