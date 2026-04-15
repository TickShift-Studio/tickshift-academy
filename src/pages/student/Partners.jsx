import { useState } from 'react'

const partners = [
  {
    id: 'lucid',
    name: 'Lucid Trading',
    tagline: 'Prop Firm Evaluation Platform',
    description: 'Take your trading to the next level with Lucid Trading. Get funded and start earning with one of the most trader-friendly prop firms in the game. Trusted by TickShift students.',
    discount: '40% OFF',
    code: 'ARTHUR',
    href: 'https://lucidtrading.com/ref/ARTHUR',
    icon: '💡',
    highlight: '#3CCBFF',
    highlightBg: 'rgba(60,203,255,0.07)',
    highlightBorder: 'rgba(60,203,255,0.2)',
    stats: [
      { label: 'Discount', value: '40%' },
      { label: 'Student Payout', value: '$1,500' },
    ],
  },
  {
    id: 'topone',
    name: 'Top One Futures',
    tagline: 'Elite Futures Prop Firm',
    description: 'One of the top-rated futures prop firms available. Scalable funding from $50K up. TickShift students have used this platform to get funded — get your discount today.',
    discount: '40% OFF',
    code: 'AnixWallo',
    href: 'https://toponefutures.com/?linkId=lp_707970&sourceId=andre-evans&tenantId=toponefutures',
    icon: '🚀',
    highlight: '#0F6FFF',
    highlightBg: 'rgba(15,111,255,0.07)',
    highlightBorder: 'rgba(15,111,255,0.25)',
    stats: [
      { label: 'Discount', value: '40%' },
      { label: 'Student Funded', value: '$50K' },
    ],
  },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={copy}
      style={{
        padding: '5px 12px', borderRadius: 6,
        background: copied ? 'rgba(46,204,113,0.15)' : 'rgba(15,111,255,0.12)',
        border: `1px solid ${copied ? 'rgba(46,204,113,0.35)' : 'rgba(60,203,255,0.25)'}`,
        color: copied ? '#2ECC71' : '#3CCBFF',
        cursor: 'pointer', fontSize: 11, fontWeight: 700,
        fontFamily: "'Open Sans', sans-serif",
        transition: 'all 0.2s', letterSpacing: 0.3,
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ Copied!' : 'Copy Code'}
    </button>
  )
}
function PartnerCard({ partner }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(13,31,60,0.9), rgba(8,18,46,0.95))',
      border: `1px solid ${partner.highlightBorder}`,
      borderRadius: 18, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: partner.highlightBg,
        borderBottom: `1px solid ${partner.highlightBorder}`,
        padding: '1.5rem 1.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(8,18,46,0.8)',
              border: `1px solid ${partner.highlightBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>{partner.icon}</div>
            <div>
              <div style={{
                fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
                fontSize: 18, color: '#F8FFFF', marginBottom: 4,
              }}>{partner.name}</div>
              <div style={{
                fontSize: 11, color: '#6E7B8F', letterSpacing: 0.5,
              }}>{partner.tagline}</div>
            </div>
          </div>

          {/* Discount badge */}
          <div style={{
            background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
            borderRadius: 10, padding: '6px 14px',
            textAlign: 'center', flexShrink: 0,
          }}>
            <div style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
              fontSize: 18, color: '#fff', lineHeight: 1,
            }}>{partner.discount}</div>
            <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>EXCLUSIVE</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.5rem 1.75rem', flex: 1 }}>
        <p style={{
          fontSize: 13, color: '#C9D1DC', lineHeight: 1.75, marginBottom: '1.5rem',
        }}>{partner.description}</p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {partner.stats.map(s => (
            <div key={s.label} style={{
              background: 'rgba(8,18,46,0.8)',
              border: '1px solid rgba(15,111,255,0.12)',
              borderRadius: 10, padding: '0.7rem 1.1rem', flex: 1,
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                color: '#6E7B8F', textTransform: 'uppercase', marginBottom: 4,
              }}>{s.label}</div>
              <div style={{
                fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
                fontSize: 20, color: partner.highlight,
              }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Discount code box */}
        <div style={{
          background: 'rgba(8,18,46,0.8)',
          border: `1px solid ${partner.highlightBorder}`,
          borderRadius: 10, padding: '1rem 1.1rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5,
            color: '#6E7B8F', textTransform: 'uppercase', marginBottom: 8,
          }}>Discount Code</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
              fontSize: 22, color: partner.highlight, letterSpacing: 2,
            }}>{partner.code}</div>
            <CopyButton text={partner.code} />
          </div>
        </div>

        {/* CTA */}
        <a
          href={partner.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px', borderRadius: 10,
            background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)',
            color: '#fff', textDecoration: 'none',
            fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
            fontSize: 12, letterSpacing: 2,
            boxShadow: '0 4px 20px rgba(15,111,255,0.3)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          GET {partner.discount} — VISIT SITE →
        </a>
      </div>
    </div>
  )
}
export default function Partners() {
  return (
    <div style={{
      minHeight: '100vh', background: '#08162E',
      padding: '2rem 2.25rem',
      fontFamily: "'Open Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{
          fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
          fontSize: 22, color: '#F8FFFF', marginBottom: 4,
        }}>Partners & Deals</div>
        <p style={{ fontSize: 12.5, color: '#6E7B8F', maxWidth: 520 }}>
          Exclusive discounts for TickShift Academy students. Use these tools to fund your trading journey.
        </p>
      </div>

      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15,111,255,0.12), rgba(60,203,255,0.06))',
        border: '1px solid rgba(60,203,255,0.2)',
        borderRadius: 14, padding: '1.1rem 1.5rem',
        marginBottom: '1.75rem',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: 24 }}>⚡</span>
        <div>
          <div style={{
            fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
            fontSize: 13, color: '#F8FFFF', marginBottom: 3,
          }}>TickShift Student Exclusive Deals</div>
          <div style={{ fontSize: 12, color: '#6E7B8F' }}>
            These affiliate links support the community and give you discounts. Use code at checkout.
          </div>
        </div>
      </div>

      {/* Partner cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '1.25rem',
      }}>
        {partners.map(p => <PartnerCard key={p.id} partner={p} />)}
      </div>

      {/* Bottom note */}
      <div style={{
        marginTop: '2rem', padding: '1rem 1.25rem',
        background: 'rgba(13,31,60,0.5)',
        border: '1px solid rgba(15,111,255,0.1)',
        borderRadius: 10, fontSize: 11, color: '#6E7B8F', lineHeight: 1.7,
      }}>
        <strong style={{ color: '#C9D1DC' }}>Disclosure:</strong> These are affiliate partnerships.
        When you use these links, TickShift earns a commission at no extra cost to you —
        which helps keep the Academy running. We only partner with platforms we actually use and trust.
      </div>
    </div>
  )
}
