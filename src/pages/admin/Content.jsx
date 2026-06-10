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

const CAT_COLOR = {
  Analysis: 'var(--violet-2)',
  Strategy: 'var(--cyan)',
  Mindset:  'var(--gold-2)',
  Recap:    '#34D399',
  Tips:     '#F87171',
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

  function openNew() { setForm({ ...EMPTY }); setErr(''); setPreview(false) }

  function openEdit(post) {
    supabase.from('posts').select('*').eq('id', post.id).single().then(({ data }) => {
      setForm({ ...data, published_at: data.published_at?.split('T')[0] || new Date().toISOString().split('T')[0] })
      setErr(''); setPreview(false)
    })
  }

  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) { setErr('Title is required.'); return }
    if (!form.body.trim())  { setErr('Body content is required.'); return }
    setSaving(true); setErr('')

    const slug = form.slug.trim() || slugify(form.title)
    const payload = {
      title: form.title.trim(), slug,
      category: form.category,
      thumbnail_url: form.thumbnail_url.trim() || null,
      excerpt: form.excerpt.trim() || null,
      body: form.body.trim(),
      youtube_id: form.youtube_id.trim() || null,
      published: form.published,
      published_at: form.published_at || new Date().toISOString().split('T')[0],
    }

    const { id } = form
    let data, error
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
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, var(--white) 0%, rgba(248,248,250,0.65) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 6,
          }}>Trading Hub Content</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Create and manage public articles and videos.</p>
        </div>
        <button onClick={openNew} className="btn-primary" style={{ flexShrink: 0, padding: '10px 18px', fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Post
        </button>
      </div>

      {/* Formatting guide */}
      <div style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.1rem', marginBottom: '1.5rem', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.85 }}>
        <span style={{ color: 'var(--violet-2)', fontWeight: 700 }}>✦ Body formatting:</span>{'  '}
        Double line break = new paragraph{'  '}·{'  '}
        <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3 }}>## Heading</code>{'  '}·{'  '}
        <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3 }}>### Sub-heading</code>{'  '}·{'  '}
        <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3 }}>- bullet</code>{'  '}·{'  '}
        <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3 }}>{`> callout`}</code>
      </div>

      {/* Form modal */}
      {form && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '2rem', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setForm(null) }}>
          <div className="modal-card" style={{ maxWidth: 700, width: '100%', marginBottom: '2rem' }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--white)' }}>
                {form.id ? 'Edit Post' : 'New Post'}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPreview(p => !p)}
                  className="btn-ghost"
                  style={{ padding: '7px 14px', fontSize: 11, ...(preview ? { color: 'var(--violet-2)', borderColor: 'rgba(139,92,246,0.4)' } : {}) }}
                >{preview ? 'Edit' : 'Preview'}</button>
                <button type="button" onClick={() => setForm(null)} className="btn-ghost" style={{ padding: '7px 14px', fontSize: 11 }}>Close</button>
              </div>
            </div>

            {preview ? (
              <div style={{ fontSize: 13.5, color: 'var(--silver)', lineHeight: 1.8, maxHeight: 520, overflowY: 'auto', padding: '0.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: 'var(--white)', marginBottom: 8 }}>{form.title || 'No title'}</h2>
                <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 12 }}>{form.category} · {form.published_at}</p>
                {form.excerpt && <p style={{ borderLeft: '3px solid var(--violet)', paddingLeft: '1rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 16 }}>{form.excerpt}</p>}
                {form.youtube_id && <div style={{ background: '#000', borderRadius: 8, padding: '1rem', marginBottom: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>▶ YouTube: {form.youtube_id}</div>}
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{form.body}</div>
              </div>
            ) : (
              <form onSubmit={save}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Title *</label>
                    <input className="field-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value, slug: slugify(e.target.value) }))} placeholder="Article title" />
                  </div>
                  <div>
                    <label className="field-label">Slug (URL path)</label>
                    <input className="field-input" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" />
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>/hub/{form.slug || '…'}</div>
                  </div>
                  <div>
                    <label className="field-label">Category</label>
                    <select className="field-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Excerpt (shown on card)</label>
                    <textarea className="field-input" value={form.excerpt || ''} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} style={{ resize: 'vertical' }} placeholder="1–2 sentence summary…" />
                  </div>
                  <div>
                    <label className="field-label">Thumbnail URL</label>
                    <input className="field-input" value={form.thumbnail_url || ''} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://…" />
                  </div>
                  <div>
                    <label className="field-label">YouTube Video ID</label>
                    <input className="field-input" value={form.youtube_id || ''} onChange={e => setForm(p => ({ ...p, youtube_id: e.target.value }))} placeholder="dQw4w9WgXcQ" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Article Body *</label>
                    <textarea
                      className="field-input"
                      value={form.body}
                      onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                      rows={14}
                      style={{ resize: 'vertical', minHeight: 260, fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.7 }}
                      placeholder={'## Section heading\n\nYour paragraph text here...\n\n- Bullet point one\n- Bullet point two\n\n> Callout or key point here\n\nAnother paragraph...'}
                    />
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                      {form.body.length} chars · {form.body.split(/\n\n+/).filter(p => p.trim()).length} paragraphs
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Publish Date</label>
                    <input type="date" className="field-input" value={form.published_at} onChange={e => setForm(p => ({ ...p, published_at: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, published: !p.published }))}
                      style={{
                        position: 'relative', width: 44, height: 24, borderRadius: 12,
                        background: form.published ? 'var(--success)' : 'rgba(255,255,255,0.12)',
                        border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                      }}
                    >
                      <div style={{ position: 'absolute', top: 3, left: form.published ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </button>
                    <span style={{ fontSize: 12, color: form.published ? 'var(--success)' : 'var(--muted)', fontWeight: 600 }}>
                      {form.published ? 'Published' : 'Draft'}
                    </span>
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
                    ) : form.published ? 'Publish Post' : 'Save Draft'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div style={{ width: 28, height: 28, border: '2px solid rgba(139,92,246,0.15)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="glow-card" style={{ padding: '3rem', textAlign: 'center', cursor: 'default' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--violet-dim)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--violet-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--white)', marginBottom: 4 }}>No posts yet</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Click "New Post" to write your first Trading Hub article.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {posts.map(post => (
            <div
              key={post.id}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 12, padding: '0.85rem 1.25rem', flexWrap: 'wrap', transition: 'border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-2)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--white)', marginBottom: 4 }}>{post.title}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', color: CAT_COLOR[post.category] || 'var(--muted)', textTransform: 'uppercase' }}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{post.published_at?.split('T')[0]}</span>
                  {post.youtube_id && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: '#F87171', letterSpacing: '0.05em' }}>▶ VIDEO</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em',
                  background: post.published ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${post.published ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  color: post.published ? 'var(--success)' : 'var(--muted)',
                }}>
                  {post.published ? 'Published' : 'Draft'}
                </span>
                <a href={`/hub/${post.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '5px 11px', fontSize: 10, textDecoration: 'none' }}>
                  View
                </a>
                <button onClick={() => togglePublish(post)} className={post.published ? 'btn-danger' : 'btn-ghost'} style={{ padding: '5px 11px', fontSize: 10, ...(post.published ? {} : { color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' }) }}>
                  {post.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => openEdit(post)} className="btn-ghost" style={{ padding: '5px 11px', fontSize: 10 }}>Edit</button>
                <button onClick={() => del(post.id)} className="btn-danger" style={{ padding: '5px 11px', fontSize: 10 }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
