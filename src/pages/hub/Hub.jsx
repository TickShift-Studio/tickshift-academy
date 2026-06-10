import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import PublicNav from '../../components/PublicNav'
import AnimatedBg from '../../components/AnimatedBg'

const CATEGORIES = ['All', 'Analysis', 'Strategy', 'Mindset', 'Recap', 'Tips']

const CAT_COLORS = {
  Analysis: { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)', color: 'var(--violet-2)' },
  Strategy: { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.25)', color: 'var(--cyan)' },
  Mindset:  { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', color: 'var(--gold-2)' },
  Recap:    { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', color: '#34D399' },
  Tips:     { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', color: '#F87171' },
}

function CategoryPill({ cat, size = 'sm' }) {
  const s = CAT_COLORS[cat] || { bg: 'rgba(255,255,255,0.06)', border: 'var(--border-2)', color: 'var(--silver)' }
  return (
    <span style={{
      fontSize: size === 'lg' ? 11 : 9.5,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
      borderRadius: 20,
      padding: size === 'lg' ? '4px 12px' : '3px 9px',
      whiteSpace: 'nowrap',
    }}>{cat}</span>
  )
}

function PostCard({ post, onClick }) {
  return (
    <div
      onClick={onClick}
      className="glow-card"
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
    >
      {/* Thumbnail */}
      <div style={{ height: 180, overflow: 'hidden', background: 'var(--surface-2)', flexShrink: 0, borderRadius: 'var(--radius) var(--radius) 0 0', position: 'relative' }}>
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--violet-dim), rgba(34,211,238,0.04))',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>
              TICKSHIFT
            </div>
          </div>
        )}
        {post.youtube_id && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', borderRadius: 6, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#EF4444" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>VIDEO</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.65rem' }}>
          <CategoryPill cat={post.category} />
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 15,
          color: 'var(--white)',
          lineHeight: 1.35,
          marginBottom: '0.5rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{post.title}</h3>
        {post.excerpt && (
          <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
            {post.excerpt}
          </p>
        )}
        <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--violet-2)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
          {post.youtube_id ? 'Read & Watch' : 'Read More'}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function Hub() {
  const navigate = useNavigate()
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('All')
  const [search, setSearch]   = useState('')

  useEffect(() => {
    supabase
      .from('posts')
      .select('id, title, slug, category, thumbnail_url, excerpt, youtube_id, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false) })
  }, [])

  const filtered = posts.filter(p => {
    const matchCat    = filter === 'All' || p.category === filter
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const featured = !search && filter === 'All' ? filtered[0] : null
  const rest     = !search && filter === 'All' ? filtered.slice(1) : filtered

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', position: 'relative' }}>
      <AnimatedBg />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <PublicNav />

        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '3.5rem 1.5rem 5rem' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--violet-2)', textTransform: 'uppercase', marginBottom: 12 }}>
              Free Content
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(32px, 6vw, 56px)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              background: 'linear-gradient(135deg, var(--white) 0%, rgba(248,248,250,0.6) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 16,
            }}>Trading Hub</h1>
            <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 500, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
              Free analysis, strategies, and insights to sharpen your edge — no sign-up required.
            </p>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: 420, margin: '0 auto' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input
                className="field-input"
                placeholder="Search articles…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 40, background: 'rgba(255,255,255,0.05)' }}
              />
            </div>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '2.5rem', justifyContent: 'center' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '7px 18px',
                  borderRadius: 99,
                  border: `1px solid ${filter === cat ? 'rgba(139,92,246,0.4)' : 'var(--border-2)'}`,
                  background: filter === cat ? 'var(--violet-dim)' : 'transparent',
                  color: filter === cat ? 'var(--violet-2)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.04em',
                  transition: 'all 0.15s',
                }}
              >{cat}</button>
            ))}
          </div>

          {/* Loading skeletons */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="skeleton" style={{ height: 340, borderRadius: 'var(--radius)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--white)', marginBottom: 6 }}>
                {search ? 'No results found' : 'No posts yet'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {search ? 'Try a different search term.' : 'Content is coming soon — check back shortly.'}
              </div>
            </div>
          ) : (
            <>
              {/* Featured post */}
              {featured && (
                <div
                  onClick={() => navigate(`/hub/${featured.slug}`)}
                  className="glow-card"
                  style={{
                    cursor: 'pointer',
                    marginBottom: '2rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    minHeight: 280,
                  }}
                >
                  {/* Image side */}
                  <div style={{ background: 'var(--surface-2)', overflow: 'hidden', borderRadius: 'var(--radius) 0 0 var(--radius)', position: 'relative', minHeight: 280 }}>
                    {featured.thumbnail_url ? (
                      <img src={featured.thumbnail_url} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--violet-dim), rgba(34,211,238,0.04))' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.1)' }}>TICKSHIFT</div>
                      </div>
                    )}
                    {featured.youtube_id && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#333" stroke="none" style={{ marginLeft: 2 }}>
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content side */}
                  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--gold-2)', textTransform: 'uppercase' }}>Featured</span>
                      <span style={{ color: 'var(--dim)' }}>·</span>
                      <CategoryPill cat={featured.category} size="lg" />
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(featured.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 style={{
                      fontFamily: 'var(--font-display)', fontWeight: 800,
                      fontSize: 'clamp(18px, 2.5vw, 26px)', lineHeight: 1.2,
                      color: 'var(--white)', marginBottom: '0.75rem',
                    }}>
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {featured.excerpt}
                      </p>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--violet-2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {featured.youtube_id ? 'Read & Watch' : 'Read Article'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {rest.map(post => (
                  <PostCard key={post.id} post={post} onClick={() => navigate(`/hub/${post.slug}`)} />
                ))}
              </div>
            </>
          )}

          {/* Join CTA */}
          <div style={{
            marginTop: '4rem',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(34,211,238,0.04) 100%)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--violet-2)', textTransform: 'uppercase', marginBottom: 12 }}>
              Ready to go deeper?
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px, 3.5vw, 32px)', letterSpacing: '-0.02em', color: 'var(--white)', marginBottom: 12 }}>
              Join TickShift Academy
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 460, margin: '0 auto 2rem', lineHeight: 1.75 }}>
              Get access to the full curriculum, live assignments, and a community of serious traders.
            </p>
            <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '14px 36px', fontSize: 15 }}>
              Get Access
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
