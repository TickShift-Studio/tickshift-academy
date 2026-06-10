import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../supabase'

async function adminFetch(action, params = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''
  return fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...params }),
  })
}

function TierBadge({ tier }) {
  if (!tier) return null
  const isPro = tier === 'pro'
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
      background: isPro ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${isPro ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.12)'}`,
      color: isPro ? 'var(--gold-2)' : 'var(--muted)',
      borderRadius: 20, padding: '2px 8px',
    }}>{tier}</span>
  )
}

export default function AdminStudents() {
  const [students, setStudents]       = useState([])
  const [memberships, setMemberships] = useState({})
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteTier, setInviteTier]   = useState('free')
  const [inviting, setInviting]       = useState(false)
  const [inviteMsg, setInviteMsg]     = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  useEffect(() => {
    async function load() {
      const [{ data: profiles }, { data: membData }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }),
        supabase.from('memberships').select('user_id, tier, status').order('created_at', { ascending: false }),
      ])
      if (!mountedRef.current) return
      const map = {}
      ;(membData || []).forEach(m => { if (!map[m.user_id]) map[m.user_id] = m })
      setStudents(profiles || [])
      setMemberships(map)
      setLoading(false)
    }
    load()
  }, [])

  async function invite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true); setInviteMsg(null)
    try {
      const res  = await adminFetch('invite-student', { email: inviteEmail.trim(), tier: inviteTier })
      const json = await res.json()
      if (!mountedRef.current) return
      if (res.ok) {
        setInviteMsg({ type: 'success', text: `Invite sent to ${inviteEmail} (${inviteTier}).` })
        setInviteEmail('')
      } else {
        setInviteMsg({ type: 'error', text: json.error || 'Failed to send invite.' })
      }
    } catch (err) {
      if (mountedRef.current) setInviteMsg({ type: 'error', text: err.message })
    } finally {
      if (mountedRef.current) setInviting(false)
    }
  }

  async function grantAccess(userId, tier = 'pro') {
    setActionLoading(userId + '_grant')
    const res  = await adminFetch('grant-access', { userId, tier })
    const json = await res.json().catch(() => ({}))
    if (mountedRef.current) {
      setActionLoading(null)
      if (res.ok) setMemberships(prev => ({ ...prev, [userId]: { tier, status: 'active' } }))
      else alert(json.error || 'Failed to grant access.')
    }
  }

  async function revokeAccess(userId) {
    if (!confirm("Revoke this student's access?")) return
    setActionLoading(userId + '_revoke')
    const res  = await adminFetch('revoke-access', { userId })
    const json = await res.json().catch(() => ({}))
    if (mountedRef.current) {
      setActionLoading(null)
      if (res.ok) setMemberships(prev => ({ ...prev, [userId]: { ...prev[userId], status: 'revoked' } }))
      else alert(json.error || 'Failed to revoke access.')
    }
  }

  async function setTier(userId, tier) {
    setActionLoading(userId + '_tier')
    const res  = await adminFetch('set-tier', { userId, tier })
    const json = await res.json().catch(() => ({}))
    if (mountedRef.current) {
      setActionLoading(null)
      if (res.ok) setMemberships(prev => ({ ...prev, [userId]: { ...prev[userId], tier } }))
      else alert(json.error || 'Failed to update tier.')
    }
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return !q || (s.full_name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
  })

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, var(--white) 0%, rgba(248,248,250,0.65) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 6,
        }}>Students</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Invite members and manage Free / Pro access.</p>
      </div>

      {/* Invite card */}
      <div className="glow-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', cursor: 'default' }}>
        <p className="section-label" style={{ marginBottom: '0.85rem' }}>Invite Student</p>
        <form onSubmit={invite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <input
            type="email"
            placeholder="student@email.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="field-input"
            style={{ flex: 1, minWidth: 200 }}
          />

          {/* Tier picker */}
          <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
            {['free', 'pro'].map(t => (
              <button
                key={t} type="button" onClick={() => setInviteTier(t)}
                style={{
                  padding: '9px 18px', border: 'none', cursor: 'pointer',
                  background: inviteTier === t
                    ? (t === 'pro' ? 'linear-gradient(135deg, var(--gold), var(--gold-2))' : 'rgba(255,255,255,0.08)')
                    : 'transparent',
                  color: inviteTier === t ? (t === 'pro' ? '#000' : 'var(--white)') : 'var(--muted)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                  letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.15s',
                }}
              >{t}</button>
            ))}
          </div>

          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="btn-primary"
            style={{ flexShrink: 0, padding: '10px 20px', opacity: (!inviteEmail.trim() || inviting) ? 0.55 : 1 }}
          >
            {inviting ? (
              <>
                <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                Sending…
              </>
            ) : 'Send Invite'}
          </button>
        </form>

        {inviteMsg && (
          <div style={{
            marginTop: '0.75rem', padding: '9px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13,
            background: inviteMsg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${inviteMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: inviteMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
          }}>{inviteMsg.text}</div>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: '0.75rem' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--dim)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="field-input"
          style={{ paddingLeft: 36 }}
        />
      </div>

      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: '0.75rem' }}>
        {loading ? 'Loading…' : `${filtered.length} student${filtered.length !== 1 ? 's' : ''}${search ? ' matching search' : ''}`}
      </div>

      {/* Students table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.75rem', padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          {['Name / Tier', 'Email', 'Joined', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(139,92,246,0.15)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '1.5rem', fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
            {search ? 'No students match your search.' : 'No students yet. Use Invite above to add the first one.'}
          </div>
        ) : (
          filtered.map((s, i) => {
            const mem      = memberships[s.id]
            const isActive = mem?.status === 'active'
            const tier     = isActive ? (mem?.tier ?? 'free') : null
            const isLoading = (key) => actionLoading === s.id + '_' + key

            return (
              <div
                key={s.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr auto auto',
                  gap: '0.75rem', alignItems: 'center',
                  padding: '0.85rem 1.25rem',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                {/* Name + badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--violet-dim)', border: '1px solid rgba(139,92,246,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--violet-2)',
                  }}>
                    {(s.full_name || s.email || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
                      {s.full_name || '—'}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {s.role === 'admin' && (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--violet-2)', borderRadius: 20, padding: '1px 7px', textTransform: 'uppercase' }}>Admin</span>
                      )}
                      {tier && <TierBadge tier={tier} />}
                      {mem && !isActive && (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--danger)', borderRadius: 20, padding: '1px 7px', textTransform: 'uppercase' }}>Revoked</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div style={{ fontSize: 12, color: 'var(--silver)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</div>

                {/* Joined */}
                <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {isActive ? (
                    <>
                      {tier === 'free' ? (
                        <button
                          disabled={isLoading('tier')}
                          onClick={() => setTier(s.id, 'pro')}
                          className="btn-ghost"
                          style={{ padding: '5px 10px', fontSize: 11, color: 'var(--gold-2)', borderColor: 'rgba(245,158,11,0.35)', opacity: isLoading('tier') ? 0.5 : 1 }}
                        >→ Pro</button>
                      ) : (
                        <button
                          disabled={isLoading('tier')}
                          onClick={() => setTier(s.id, 'free')}
                          className="btn-ghost"
                          style={{ padding: '5px 10px', fontSize: 11, opacity: isLoading('tier') ? 0.5 : 1 }}
                        >→ Free</button>
                      )}
                      <button
                        disabled={isLoading('revoke')}
                        onClick={() => revokeAccess(s.id)}
                        className="btn-danger"
                        style={{ padding: '5px 10px', fontSize: 11, opacity: isLoading('revoke') ? 0.5 : 1 }}
                      >Revoke</button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled={isLoading('grant')}
                        onClick={() => grantAccess(s.id, 'free')}
                        className="btn-ghost"
                        style={{ padding: '5px 10px', fontSize: 11, opacity: isLoading('grant') ? 0.5 : 1 }}
                      >Free</button>
                      <button
                        disabled={isLoading('grant')}
                        onClick={() => grantAccess(s.id, 'pro')}
                        className="btn-ghost"
                        style={{ padding: '5px 10px', fontSize: 11, color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)', opacity: isLoading('grant') ? 0.5 : 1 }}
                      >Pro</button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
