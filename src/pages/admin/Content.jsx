import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const CATEGORIES = ['Analysis', 'Strategy', 'Mindset', 'Recap', 'Tips']

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const EMPTY = {
  title: '', slug: '', category: 'Analysis', thumbnail_url: '', excerpt: '',
  body: '', youtube_id: '', published: false, published_at: new Date().toISOString().split('T')[0],
}

export default function AdminContent() {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(null)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    supabase.from('posts').select('id, title, slug, category, published, published_at, youtube_id').order('created_at', { ascending: false }).then(({ data }) => {
      setPosts(data || [])
      setLoading(false)
    })
  }, [])

  function openNew() {
    setForm({ ...EMPTY })
    setErr(''); setPreview(false)
  }

  function openEdit(post) {
    supabase.from('posts').select('*').eq('id', post.id).single().then(({ data }) => {
      setForm({ ...data, published_at: data.published_at?.split('T')[0] || new Date().toISOString().split('T')[0] })
      setErr(''); setPreview(false)
    })
  }

  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) { setErr('Title is required.'); return }
    if (!form.body.trim()) { setErr('Body content is required.'); return }
    setSaving(true); setErr('')

    const slug = form.slug.trim() || slugify(form.title)
    const payload = {
      title: form.title.trim(),
      slug,
      category: form.category,
      thumbnail_url: form.thumbnail_url.trim() || null,
      excerpt: form.excerpt.trim() || null,
      body: form.body.trim(),
      youtube_id: form.youtube_id.trim() || null,
      published: form.published,
      published_at: form.published_at || new Date().toISOString().split('T')[0],
    }

    let data, error
    const { id } = form
    if (id) {
      ({ data, error } = await supabase.from('posts').update(payload).eq('id', id).select('id, title, slug, category, published, published_at, youtube_id').single())
      if (!error) setPosts(prev => prev.map(p => p.id === id ? data : p))
    } else {
      ({ data, error } = await supabase.from('posts').insert(payload).select('id, title, slug, category, published, published_at, youtube_id').single())
      if (!error) setPosts(prev => [data, ...prev])
    }

    if (error) setErr(error.message)
    else setForm(null)
    setSaving(false)
  }

  async function togglePublish(post) {
    const { data } = await supabase.from('posts').update({ published: !post.published }).eq('id', post.id).select('id, title, slug, category, published, published_at, youtube_id').single()
    if (data) setPosts(prev => prev.map(p => p.id === data.id ? data : p))
  }

  async function del(id) {
    if (!confirm("Delete this post?")) return
    await supabase.from('posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const inputStyle = { display: 'block', width: '100%', padding: '9px 11px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 28, color: 'var(--white)', marginBottom: 4 }}>Trading Hub Content</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Create and manage your public articles and videos.</p>
        </div>
        <button onClick={openNew}
          style={{ padding: '10px 18px', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12 }}>
          + New Post
        </button>
      </div>

      {/* Formatting guide */}
      <div style={{ background: 'rgba(60,203,255,0.04)', border: '1px solid rgba(60,203,255,0.15)', borderRadius: 'var(--radius-sm)', padding: '0.9rem 1.1rem', marginBottom: '1.5rem', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.8 }}>
        <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>✦ Body formatting:</span>{'  '}
        Double line break = new paragraph{'  '}·{'  '}
        <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3 }}>## Heading</code>{'  '}·{'  '}
        <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3 }}>### Sub-heading</code>{'  '}·{'  '}
        <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3 }}>- bullet point</code>{'  '}·{'  '}
        <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3 }}>{`> callout block`}</code>
      </div>

      {/* Form modal */}
      {form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.75rem', width: '100%', maxWidth: 680, marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, color: 'var(--white)' }}>{form.id ? 'Edit Post' : 'New Post'}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setPreview(p => !p)}
                  style={{ padding: '7px 14px', background: preview ? 'var(--blue-dim)' : 'transparent', border: `1px solid ${preview ? 'rgba(15,111,255,0.4)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', color: preview ? 'var(--cyan)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 11 }}>
                  {preview ? 'Edit' : 'Preview'}
                </button>
                <button type="button" onClick={() => setForm(null)}
                  style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 11 }}>
                  Close
                </button>
              </div>
            </div>

            {preview ? (
              <div style={{ fontSize: 13.5, color: 'var(--silver)', lineHeight: 1.8, maxHeight: 500, overflowY: 'auto', padding: '0.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 22, color: 'var(--white)', marginBottom: 8 }}>{form.title || 'No title'}</h2>
                <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 12 }}>{form.category} · {form.published_at}</p>
                {form.excerpt && <p style={{ borderLeft: '3px solid var(--blue)', paddingLeft: '1rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 16 }}>{form.excerpt}</p>}
                {form.youtube_id && <div style={{ background: '#000', borderRadius: 8, padding: '1rem', marginBottom: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>▶ YouTube: {form.youtube_id}</div>}
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{form.body}</div>
              </div>
            ) : (
              <form onSubmit={save}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', marginBottom: '0.9rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Title *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value, slug: slugify(e.target.value) }))} style={inputStyle} placeholder="Article title" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Slug (URL path)</label>
                    <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} style={inputStyle} placeholder="auto-generated" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>/hub/{form.slug || '...'}</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Excerpt (shown on card)</label>
                    <textarea value={form.excerpt || ''} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="1–2 sentence summary…" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Thumbnail URL</label>
                    <input value={form.thumbnail_url || ''} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} style={inputStyle} placeholder="https://..." onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>YouTube Video ID (optional)</label>
                    <input value={form.youtube_id || ''} onChange={e => setForm(p => ({ ...p, youtube_id: e.target.value }))} style={inputStyle} placeholder="dQw4w9WgXcQ" onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Article Body *</label>
                    <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={14} style={{ ...inputStyle, resize: 'vertical', minHeight: 260, fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.7 }} placeholder={'## Section heading\n\nYour paragraph text here...\n\n- Bullet point one\n- Bullet point two\n\n> Callout or key point here\n\nAnother paragraph...'} onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{form.body.length} characters · {form.body.split(/\n\n+/).filter(p => p.trim()).length} paragraphs</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Publish Date</label>
                    <input type="date" value={form.published_at} onChange={e => setForm(p => ({ ...p, published_at: e.target.value }))} style={inputStyle} onFocus={e => { e.target.style.borderColor = 'var(--blue)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                    <button type="button" onClick={() => setForm(p => ({ ...p, published: !p.published }))}
                      style={{ position: 'relative', width: 44, height: 24, borderRadius: 12, background: form.published ? 'var(--success)' : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 3, left: form.published ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </button>
                    <span style={{ fontSize: 12, color: form.published ? 'var(--success)' : 'var(--muted)', fontWeight: 600 }}>
                      {form.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {err && <div style={{ padding: '9px 12px', borderRadius: 7, marginBottom: '1rem', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--danger)', fontSize: 13 }}>{err}</div>}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setForm(null)} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12 }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding: '9px 24px', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : form.published ? 'Publish Post' : 'Save Draft'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div style={{ width: 28, height: 28, border: '2px solid rgba(15,111,255,0.18)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        </div>
      ) : posts.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>✍️</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--white)', marginBottom: 4 }}>No posts yet</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Click "+ New Post" to write your first Trading Hub article.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {posts.map(post => (
            <div key={post.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 12, padding: '0.85rem 1.25rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--white)', marginBottom: 4 }}>{post.title}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, color: 'var(--muted)', textTransform: 'uppercase' }}>{post.category}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{post.published_at?.split('T')[0]}</span>
                  {post.youtube_id && <span style={{ fontSize: 9.5, fontWeight: 700, color: '#FF6B6B', letterSpacing: 0.5 }}>▶ VIDEO</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: post.published ? 'rgba(46,204,113,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${post.published ? 'rgba(46,204,113,0.3)' : 'rgba(255,255,255,0.1)'}`, color: post.published ? 'var(--success)' : 'var(--muted)' }}>
                  {post.published ? 'Published' : 'Draft'}
                </span>
                <a href={`/hub/${post.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '5px 11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-head)', fontWeight: 700, textDecoration: 'none' }}>
                  View
                </a>
                <button onClick={() => togglePublish(post)}
                  style={{ padding: '5px 11px', background: 'transparent', border: `1px solid ${post.published ? 'rgba(231,76,60,0.3)' : 'rgba(46,204,113,0.3)'}`, borderRadius: 'var(--radius-sm)', color: post.published ? 'var(--danger)' : 'var(--success)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-head)', fontWeight: 700 }}>
                  {post.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => openEdit(post)}
                  style={{ padding: '5px 11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--silver)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-head)', fontWeight: 700 }}>
                  Edit
                </button>
                <button onClick={() => del(post.id)}
                  style={{ padding: '5px 11px', background: 'transparent', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-head)', fontWeight: 700 }}>
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
