import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import PublicNav from '../../components/PublicNav'

const CATEGORIES = ['All', 'Analysis', 'Strategy', 'Mindset', 'Recap', 'Tips']

const CAT_COLORS = {
  Analysis: { bg: 'rgba(15,111,255,0.12)', border: 'rgba(15,111,255,0.3)', color: '#6BA3FF' },
  Strategy: { bg: 'rgba(60,203,255,0.1)',  border: 'rgba(60,203,255,0.28)', color: 'var(--cyan)' },
  Mindset:  { bg: 'rgba(155,81,224,0.1)',  border: 'rgba(155,81,224,0.28)', color: '#B47FE8' },
  Recap:    { bg: 'rgba(46,204,113,0.1)',  border: 'rgba(46,204,113,0.28)', color: 'var(--success)' },
  Tips:     { bg: 'rgba(230,180,0,0.1)',   border: 'rgba(230,180,0,0.28)',  color: '#F0C040' },
}

function CategoryPill({ cat, size = 'sm' }) {
  const s = CAT_COLORS[cat] || { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.15)', color: 'var(--silver)' }
  return (
    <span style={{
      fontSize: size === 'lg' ? 11 : 9.5,
      fontWeight: 700, letterSpacing: 1.2,
      textTransform: 'uppercase',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 20, padding: size === 'lg' ? '4px 12px' : '3px 9px',
      whiteSpace: 'nowrap',
    }}>{cat}</span>
  )
}

function PostCard({ post, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'rgba(15,111,255,0.4)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 180, overflow: 'hidden', background: '#0B1628', position: 'relative', flexShrink: 0,
      }}>
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.04)' : 'scale(1)' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(15,111,255,0.15), rgba(60,203,255,0.08))' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 13, letterSpacing: 3, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>TICKSHIFT</div>
          </div>
        )}
        {post.youtube_id && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.75)', borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#FF4444', fontSize: 11 }}>▶</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>VIDEO</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.65rem' }}>
          <CategoryPill cat={post.category} />
          <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>
            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 15,
          color: hovered ? 'var(--white)' : 'var(--silver)',
          lineHeight: 1.4, marginBottom: '0.6rem',
          transition: 'color 0.15s',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{post.title}</h3>
        {post.excerpt && (
          <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.65, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.excerpt}
          </p>
        )}
        <div style={{ marginTop: '1rem', fontSize: 12, fontWeight: 700, color: 'var(--blue)', fontFamily: 'var(--font-head)', display: 'flex', alignItems: 'center', gap: 5 }}>
          Read {post.youtube_id ? '& Watch' : 'More'} <span style={{ transition: 'transform 0.15s', transform: hovered ? 'translateX(3px)' : 'translateX(0)' }}>→</span>
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
    const matchCat = filter === 'All' || p.category === filter
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PublicNav />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
        {/* Hero header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 12 }}>Free Content</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 48px)', color: 'var(--white)', lineHeight: 1.15, marginBottom: 16 }}>
            Trading Hub
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 520, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Free analysis, strategies, and insights to sharpen your edge — no sign-up required.
          </p>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 400, margin: '0 auto' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 14 }}>🔍</span>
            <input
              placeholder="Search articles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '2rem', justifyContent: 'center' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '7px 16px', borderRadius: 20,
                border: `1px solid ${filter === cat ? 'var(--blue)' : 'var(--border)'}`,
                background: filter === cat ? 'var(--blue-dim)' : 'transparent',
                color: filter === cat ? 'var(--white)' : 'var(--muted)',
                cursor: 'pointer', fontSize: 12, fontWeight: 700,
                fontFamily: 'var(--font-head)', letterSpacing: 0.5,
                transition: 'all 0.15s',
              }}
            >{cat}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', height: 340, animation: 'pulse 1.4s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--white)', marginBottom: 6 }}>
              {search ? 'No results found' : 'No posts yet'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {search ? 'Try a different search term.' : 'Content is coming soon — check back shortly.'}
            </div>
          </div>
        ) : (
          <>
            {/* Featured post (first result) */}
            {featured && !search && filter === 'All' && (
              <div
                onClick={() => navigate(`/hub/${featured.slug}`)}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  overflow: 'hidden', cursor: 'pointer', marginBottom: '2rem',
                  display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                  transition: 'border-color 0.15s', minHeight: 260,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,111,255,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <div style={{ background: '#0B1628', overflow: 'hidden', position: 'relative', minHeight: 260 }}>
                  {featured.thumbnail_url ? (
                    <img src={featured.thumbnail_url} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(15,111,255,0.2), rgba(60,203,255,0.1))' }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16, letterSpacing: 4, color: 'rgba(255,255,255,0.15)' }}>TICKSHIFT</div>
                    </div>
                  )}
                  {featured.youtube_id && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 18, marginLeft: 3 }}>▶</span>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding: '2rem 2rem 1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, color: 'var(--cyan)', textTransform: 'uppercase' }}>Featured</span>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <CategoryPill cat={featured.category} />
                    <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                      {new Date(featured.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(17px, 2.5vw, 24px)', color: 'var(--white)', lineHeight: 1.3, marginBottom: '0.85rem' }}>
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.75, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {featured.excerpt}
                    </p>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', fontFamily: 'var(--font-head)' }}>
                    {featured.youtube_id ? 'Read & Watch →' : 'Read Article →'}
                  </div>
                </div>
              </div>
            )}

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {(search || filter !== 'All' ? filtered : rest).map(post => (
                <PostCard key={post.id} post={post} onClick={() => navigate(`/hub/${post.slug}`)} />
              ))}
            </div>
          </>
        )}

        {/* Join CTA */}
        <div style={{
          marginTop: '4rem',
          background: 'linear-gradient(135deg, rgba(15,111,255,0.12), rgba(60,203,255,0.06))',
          border: '1px solid rgba(15,111,255,0.25)',
          borderRadius: 'var(--radius)', padding: '2.5rem 2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 12 }}>Ready to go deeper?</div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(20px, 3vw, 28px)', color: 'var(--white)', marginBottom: 12 }}>
            Join TickShift Academy
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', maxWidth: 460, margin: '0 auto 1.75rem', lineHeight: 1.7 }}>
            Get access to the full curriculum, assignments, and a community of serious traders.
          </p>
          <a
            href="https://whop.com/tickshift"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--blue)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13, letterSpacing: 1, textDecoration: 'none' }}
          >Get Access on Whop →</a>
        </div>
      </main>
    </div>
  )
}
