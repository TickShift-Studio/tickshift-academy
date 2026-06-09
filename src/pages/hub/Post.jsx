import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import PublicNav from '../../components/PublicNav'

const CAT_COLORS = {
  Analysis: { bg: 'rgba(15,111,255,0.12)', border: 'rgba(15,111,255,0.3)', color: '#6BA3FF' },
  Strategy: { bg: 'rgba(60,203,255,0.1)',  border: 'rgba(60,203,255,0.28)', color: 'var(--cyan)' },
  Mindset:  { bg: 'rgba(155,81,224,0.1)',  border: 'rgba(155,81,224,0.28)', color: '#B47FE8' },
  Recap:    { bg: 'rgba(46,204,113,0.1)',  border: 'rgba(46,204,113,0.28)', color: 'var(--success)' },
  Tips:     { bg: 'rgba(230,180,0,0.1)',   border: 'rgba(230,180,0,0.28)',  color: '#F0C040' },
}

function CategoryPill({ cat }) {
  const s = CAT_COLORS[cat] || { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.15)', color: 'var(--silver)' }
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 20, padding: '4px 12px' }}>
      {cat}
    </span>
  )
}

// Render body text: each double-newline = new paragraph, single newline = line break
function ArticleBody({ body }) {
  if (!body) return null
  const paragraphs = body.split(/\n\n+/)
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 15.5, color: 'var(--silver)', lineHeight: 1.85 }}>
      {paragraphs.map((para, i) => {
        // H2: lines starting with ##
        if (para.startsWith('## ')) {
          return (
            <h2 key={i} style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, color: 'var(--white)', margin: '2rem 0 0.75rem', lineHeight: 1.3 }}>
              {para.slice(3)}
            </h2>
          )
        }
        // H3: lines starting with ###
        if (para.startsWith('### ')) {
          return (
            <h3 key={i} style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16.5, color: 'var(--white)', margin: '1.5rem 0 0.6rem', lineHeight: 1.35 }}>
              {para.slice(4)}
            </h3>
          )
        }
        // Bullet list: lines starting with -
        if (para.trim().startsWith('- ')) {
          const items = para.split('\n').filter(l => l.trim().startsWith('- '))
          return (
            <ul key={i} style={{ paddingLeft: '1.5rem', margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {items.map((item, j) => (
                <li key={j} style={{ color: 'var(--silver)', fontSize: 15 }}>{item.trim().slice(2)}</li>
              ))}
            </ul>
          )
        }
        // Callout: lines starting with >
        if (para.trim().startsWith('> ')) {
          return (
            <blockquote key={i} style={{
              margin: '1.5rem 0',
              padding: '1rem 1.25rem',
              borderLeft: '3px solid var(--blue)',
              background: 'rgba(15,111,255,0.06)',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              color: 'var(--silver)',
              fontStyle: 'italic',
            }}>
              {para.trim().slice(2)}
            </blockquote>
          )
        }
        // Regular paragraph
        return (
          <p key={i} style={{ margin: '0 0 1.25rem' }}>
            {para.split('\n').map((line, j, arr) => (
              <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

export default function Post() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost]       = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (!data) { setNotFound(true); setLoading(false); return }
      setPost(data)

      // Load related (same category, different post)
      const { data: rel } = await supabase
        .from('posts')
        .select('id, title, slug, category, thumbnail_url, excerpt, youtube_id, published_at')
        .eq('published', true)
        .eq('category', data.category)
        .neq('id', data.id)
        .order('published_at', { ascending: false })
        .limit(3)
      setRelated(rel || [])
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PublicNav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ width: 32, height: 32, border: '2.5px solid rgba(15,111,255,0.18)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PublicNav />
      <div style={{ maxWidth: 600, margin: '6rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 24, color: 'var(--white)', marginBottom: 12 }}>Post not found</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '1.5rem' }}>This article may have been removed or the link is incorrect.</p>
        <button onClick={() => navigate('/hub')} style={{ padding: '10px 24px', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13 }}>← Back to Trading Hub</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PublicNav />

      <main style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {/* Back */}
        <button
          onClick={() => navigate('/hub')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5, padding: 0, marginBottom: '2rem', transition: 'color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
        >← Trading Hub</button>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <CategoryPill cat={post.category} />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(24px, 4vw, 36px)', color: 'var(--white)', lineHeight: 1.2, marginBottom: '1rem' }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.75, marginBottom: '2rem', borderLeft: '3px solid var(--blue)', paddingLeft: '1rem' }}>
            {post.excerpt}
          </p>
        )}

        {/* Thumbnail */}
        {post.thumbnail_url && !post.youtube_id && (
          <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '2.5rem' }}>
            <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* YouTube embed */}
        {post.youtube_id && (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '2.5rem', background: '#000' }}>
            <iframe
              src={`https://www.youtube.com/embed/${post.youtube_id}?rel=0`}
              allowFullScreen
              title={post.title}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: '2.5rem' }} />

        {/* Article body */}
        <ArticleBody body={post.body} />

        {/* CTA */}
        <div style={{
          marginTop: '3.5rem',
          background: 'linear-gradient(135deg, rgba(15,111,255,0.12), rgba(60,203,255,0.06))',
          border: '1px solid rgba(15,111,255,0.25)',
          borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 10 }}>Want more?</div>
          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20, color: 'var(--white)', marginBottom: 10 }}>
            Join TickShift Academy
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 400, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
            Full curriculum, live assignments, and a community of traders committed to consistency.
          </p>
          <a href="https://whop.com/tickshift" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '11px 28px', background: 'var(--blue)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13, letterSpacing: 1, textDecoration: 'none' }}>
            Get Access on Whop →
          </a>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div style={{ marginTop: '3.5rem' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>More {post.category}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {related.map(r => (
                <div key={r.id} onClick={() => { navigate(`/hub/${r.slug}`); window.scrollTo(0, 0) }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,111,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {r.thumbnail_url && <div style={{ height: 120, overflow: 'hidden' }}><img src={r.thumbnail_url} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                  <div style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>{new Date(r.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--white)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
