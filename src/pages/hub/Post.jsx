import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import PublicNav from '../../components/PublicNav'
import AnimatedBg from '../../components/AnimatedBg'

const CAT_COLORS = {
  Analysis: { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)', color: 'var(--violet-2)' },
  Strategy: { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.25)', color: 'var(--cyan)' },
  Mindset:  { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', color: 'var(--gold-2)' },
  Recap:    { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', color: '#34D399' },
  Tips:     { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', color: '#F87171' },
}

function CategoryPill({ cat }) {
  const s = CAT_COLORS[cat] || { bg: 'rgba(255,255,255,0.06)', border: 'var(--border-2)', color: 'var(--silver)' }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 20, padding: '4px 12px' }}>
      {cat}
    </span>
  )
}

function ArticleBody({ body }) {
  if (!body) return null
  const paragraphs = body.split(/\n\n+/)
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--silver)', lineHeight: 1.85 }}>
      {paragraphs.map((para, i) => {
        if (para.startsWith('## ')) return (
          <h2 key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--white)', margin: '2.5rem 0 0.75rem', lineHeight: 1.25 }}>
            {para.slice(3)}
          </h2>
        )
        if (para.startsWith('### ')) return (
          <h3 key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--white)', margin: '1.75rem 0 0.6rem', lineHeight: 1.3 }}>
            {para.slice(4)}
          </h3>
        )
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
        if (para.trim().startsWith('> ')) return (
          <blockquote key={i} style={{
            margin: '1.75rem 0',
            padding: '1rem 1.5rem',
            borderLeft: '3px solid var(--violet)',
            background: 'var(--violet-dim)',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            color: 'var(--silver)',
            fontStyle: 'italic',
          }}>
            {para.trim().slice(2)}
          </blockquote>
        )
        return (
          <p key={i} style={{ margin: '0 0 1.4rem' }}>
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
  const [post, setPost]         = useState(null)
  const [related, setRelated]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('posts').select('*').eq('slug', slug).eq('published', true).single()
      if (!data) { setNotFound(true); setLoading(false); return }
      setPost(data)
      const { data: rel } = await supabase
        .from('posts')
        .select('id, title, slug, category, thumbnail_url, excerpt, youtube_id, published_at')
        .eq('published', true).eq('category', data.category).neq('id', data.id)
        .order('published_at', { ascending: false }).limit(3)
      setRelated(rel || [])
      setLoading(false)
    }
    load()
  }, [slug])

  const shell = (children) => (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', position: 'relative' }}>
      <AnimatedBg />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <PublicNav />
        {children}
      </div>
    </div>
  )

  if (loading) return shell(
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(139,92,246,0.15)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.85s linear infinite' }} />
    </div>
  )

  if (notFound) return shell(
    <div style={{ maxWidth: 600, margin: '6rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--white)', marginBottom: 12 }}>Post not found</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '1.5rem' }}>This article may have been removed or the link is incorrect.</p>
      <button onClick={() => navigate('/hub')} className="btn-primary" style={{ padding: '11px 28px' }}>
        Back to Trading Hub
      </button>
    </div>
  )

  return shell(
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 1.5rem 5rem', animation: 'fadeUp 0.3s ease' }}>
      {/* Back */}
      <button
        onClick={() => navigate('/hub')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: '2rem', transition: 'color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Trading Hub
      </button>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <CategoryPill cat={post.category} />
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: 'clamp(26px, 4.5vw, 40px)', letterSpacing: '-0.02em',
        lineHeight: 1.15, color: 'var(--white)', marginBottom: '1rem',
      }}>
        {post.title}
      </h1>

      {/* Excerpt */}
      {post.excerpt && (
        <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.7, marginBottom: '2rem', borderLeft: '3px solid var(--violet)', paddingLeft: '1.1rem' }}>
          {post.excerpt}
        </p>
      )}

      {/* Thumbnail */}
      {post.thumbnail_url && !post.youtube_id && (
        <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '2.5rem', border: '1px solid var(--border)' }}>
          <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', maxHeight: 440, objectFit: 'cover', display: 'block' }} loading="lazy" />
        </div>
      )}

      {/* YouTube */}
      {post.youtube_id && (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '2.5rem', background: '#000', border: '1px solid var(--border)' }}>
          <iframe
            src={`https://www.youtube.com/embed/${post.youtube_id}?rel=0`}
            allowFullScreen title={post.title}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      )}

      <div className="divider" />

      <ArticleBody body={post.body} />

      {/* CTA */}
      <div style={{
        marginTop: '3.5rem',
        background: 'linear-gradient(135deg, var(--violet-dim) 0%, rgba(34,211,238,0.04) 100%)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--violet-2)', textTransform: 'uppercase', marginBottom: 10 }}>Want more?</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em', color: 'var(--white)', marginBottom: 10 }}>
          Join TickShift Academy
        </h3>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', maxWidth: 400, margin: '0 auto 1.5rem', lineHeight: 1.75 }}>
          Full curriculum, live assignments, and a community of traders committed to consistency.
        </p>
        <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '12px 32px', fontSize: 14 }}>
          Get Access
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <div style={{ marginTop: '3.5rem' }}>
          <p className="section-label">More {post.category}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {related.map(r => (
              <div
                key={r.id}
                onClick={() => { navigate(`/hub/${r.slug}`); window.scrollTo(0, 0) }}
                className="glow-card"
                style={{ cursor: 'pointer', overflow: 'hidden' }}
              >
                {r.thumbnail_url && (
                  <div style={{ height: 120, overflow: 'hidden', borderRadius: 'var(--radius) var(--radius) 0 0' }}>
                    <img src={r.thumbnail_url} alt={r.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>
                    {new Date(r.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--white)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
