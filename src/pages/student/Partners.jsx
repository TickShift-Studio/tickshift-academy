import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

export default function Partners() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('partners').select('*').order('position').then(({ data }) => {
      setPartners(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(139,92,246,0.15)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.85s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, var(--white) 0%, rgba(248,248,250,0.65) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 6,
        }}>Partners &amp; Discounts</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Exclusive deals curated for TickShift Academy members.</p>
      </div>

      {partners.length === 0 ? (
        <div className="glow-card" style={{ padding: '3rem 2rem', textAlign: 'center', cursor: 'default' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--violet-dim)', border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--violet-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--white)', marginBottom: 6 }}>
            Partner deals coming soon
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}>
            We're working on exclusive perks for members. Check back soon!
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {partners.map(p => (
            <div
              key={p.id}
              className="glow-card"
              style={{ display: 'flex', flexDirection: 'column', cursor: p.url ? 'pointer' : 'default' }}
              onClick={() => p.url && window.open(p.url, '_blank', 'noopener,noreferrer')}
            >
              {/* Logo area */}
              <div style={{
                height: 120,
                background: 'rgba(255,255,255,0.02)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1.25rem',
                borderBottom: '1px solid var(--border)',
              }}>
                {p.logo_url ? (
                  <img
                    src={p.logo_url}
                    alt={p.name}
                    style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain' }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: 18, color: 'var(--violet-2)',
                    letterSpacing: '0.08em',
                  }}>
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ padding: '1.1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--white)', marginBottom: 4 }}>
                  {p.name}
                </div>
                {p.description && (
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 'auto', paddingBottom: '1rem' }}>
                    {p.description}
                  </p>
                )}

                {p.discount_code && (
                  <div style={{
                    background: 'var(--violet-dim)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.9rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Promo code</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--violet-2)', letterSpacing: '0.08em' }}>
                      {p.discount_code}
                    </span>
                  </div>
                )}

                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="btn-primary"
                    style={{ textAlign: 'center', fontSize: 12, padding: '10px' }}
                  >
                    Visit Partner
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
