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
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(15,111,255,0.18)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 28, color: 'var(--white)', marginBottom: 4 }}>Partners & Discounts</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Exclusive deals curated for TickShift Academy members.</p>
      </div>

      {partners.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🤝</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--white)', marginBottom: 4 }}>Partner deals coming soon</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>We're working on exclusive perks for members. Check back soon!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {partners.map(p => (
            <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.15s, transform 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,111,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {p.logo_url && (
                <div style={{ height: 130, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <img src={p.logo_url} alt={p.name} style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <div style={{ padding: '1.1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--white)', marginBottom: 4 }}>{p.name}</div>
                {p.description && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 'auto', paddingBottom: '1rem' }}>{p.description}</p>}
                {p.discount_code && (
                  <div style={{ background: 'var(--blue-dim)', border: '1px solid rgba(15,111,255,0.25)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Promo code</span>
                    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--cyan)', letterSpacing: 1 }}>{p.discount_code}</span>
                  </div>
                )}
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'var(--blue)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textDecoration: 'none' }}>
                    Visit Partner →
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
