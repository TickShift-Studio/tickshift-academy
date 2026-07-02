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

const TIER_STYLES = {
  pro:  { label: 'PRO',  bg: 'rgba(15,111,255,0.15)',  border: 'rgba(15,111,255,0.35)',  color: 'var(--cyan)' },
  free: { label: 'FREE', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', color: 'var(--muted)' },
}

function TierBadge({ tier }) {
  if (!tier) return null
  const s = TIER_STYLES[tier] ?? TIER_STYLES.free
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 1,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase',
    }}>{s.label}</span>
  )
}

export default function AdminStudents() {
  const [students, setStudents]       = useState([])
  const [memberships, setMemberships] = useState({})   // userId → { tier, status }
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteTier, setInviteTier]   = useState('free')
  const [inviting, setInviting]       = useState(false)
  const [inviteMsg, setInviteMsg]     = useState(null)

  // Action loading: e.g. "userId_grant" | "userId_revoke" | "userId_tier"
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

      // Build a membership map keyed by user_id (most recent first, already ordered)
      const map = {}
      ;(membData || []).forEach(m => {
        if (!map[m.user_id]) map[m.user_id] = m   // keep most recent
      })

      setStudents(profiles || [])
      setMemberships(map)
      setLoading(false)
    }
    load()
  }, [])

  // ── Invite ──────────────────────────────────────────────────────────────────
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

  // ── Grant access (defaults to Pro) ─────────────────────────────────────────
  async function grantAccess(userId, tier = 'pro') {
    setActionLoading(userId + '_grant')
    const res  = await adminFetch('grant-access', { userId, tier })
    const json = await res.json().catch(() => ({}))
    if (mountedRef.current) {
      setActionLoading(null)
      if (res.ok) {
        setMemberships(prev => ({ ...prev, [userId]: { tier, status: 'active' } }))
      } else {
        alert(json.error || 'Failed to grant access.')
      }
    }
  }

  // ── Revoke access ───────────────────────────────────────────────────────────
  async function revokeAccess(userId) {
    if (!confirm("Revoke this student's access?")) return
    setActionLoading(userId + '_revoke')
    const res  = await adminFetch('revoke-access', { userId })
    const json = await res.json().catch(() => ({}))
    if (mountedRef.current) {
      setActionLoading(null)
      if (res.ok) {
        setMemberships(prev => ({ ...prev, [userId]: { ...prev[userId], status: 'revoked' } }))
      } else {
        alert(json.error || 'Failed to revoke access.')
      }
    }
  }

  // ── Change tier ─────────────────────────────────────────────────────────────
  async function setTier(userId, tier) {
    setActionLoading(userId + '_tier')
    const res  = await adminFetch('set-tier', { userId, tier })
    const json = await res.json().catch(() => ({}))
    if (mountedRef.current) {
      setActionLoading(null)
      if (res.ok) {
        setMemberships(prev => ({ ...prev, [userId]: { ...prev[userId], tier } }))
      } else {
        alert(json.error || 'Failed to update tier.')
      }
    }
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return !q || (s.full_name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
  })

  const inputStyle = {
    padding: '9px 12px', background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)',
    color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
  }
  const btnStyle = (color = 'var(--border)', text = 'var(--silver)') => ({
    padding: '5px 10px', background: 'transparent',
    border: `1px solid ${color}`, borderRadius: 'var(--radius-sm)',
    color: text, cursor: 'pointer', fontSize: 10,
    fontFamily: 'var(--font-head)', fontWeight: 700,
  })

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 28, color: 'var(--white)', marginBottom: 4 }}>Students</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Invite members and manage Free / Pro access.</p>
      </div>

      {/* ── Invite card ─────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem 1.4rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Invite Student
        </div>

        <form onSubmit={invite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <input
            type="email" placeholder="student@email.com"
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
            onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
          />

          {/* Tier picker */}
          <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            {['free', 'pro'].map(t => (
              <button
                key={t} type="button" onClick={() => setInviteTier(t)}
                style={{
                  padding: '9px 16px', border: 'none', cursor: 'pointer',
                  background: inviteTier === t ? (t === 'pro' ? 'var(--blue)' : 'rgba(255,255,255,0.1)') : 'transparent',
                  color: inviteTier === t ? '#fff' : 'var(--muted)',
                  fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 11,
                  letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.15s',
                }}
              >{t}</button>
            ))}
          </div>

          <button
            type="submit" disabled={inviting || !inviteEmail.trim()}
            style={{
              ...inputStyle,
              background: (!inviteEmail.trim() || inviting) ? 'rgba(15,111,255,0.4)' : 'var(--blue)',
              cursor: (!inviteEmail.trim() || inviting) ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, border: 'none',
              color: '#fff', flexShrink: 0,
            }}
          >{inviting ? 'Sending…' : 'Send Invite'}</button>
        </form>

        {inviteMsg && (
          <div style={{
            marginTop: '0.75rem', padding: '9px 12px', borderRadius: 7, fontSize: 13,
            background: inviteMsg.type === 'success' ? 'rgba(46,204,113,0.08)' : 'rgba(231,76,60,0.08)',
            border: `1px solid ${inviteMsg.type === 'success' ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)'}`,
            color: inviteMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
          }}>{inviteMsg.text}</div>
        )}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: '100%', maxWidth: 360, background: 'var(--surface)', border: '1px solid var(--border)' }}
          onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
          onBlur={e =>  { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: '0.75rem' }}>
        {loading ? 'Loading…' : `${filtered.length} student${filtered.length !== 1 ? 's' : ''}${search ? ' matching search' : ''}`}
      </div>

      {/* ── Student table ────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.75rem', padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          {['Name / Tier', 'Email', 'Joined', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(15,111,255,0.18)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '1.5rem', fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
            {search ? 'No students match your search.' : 'No students yet. Use Invite above to add the first one.'}
          </div>
        ) : (
          filtered.map((s, i) => {
            const mem       = memberships[s.id]
            const isActive  = mem?.status === 'active'
            const tier      = isActive ? (mem?.tier ?? 'free') : null
            const isLoading = (key) => actionLoading === s.id + '_' + key

            return (
              <div
                key={s.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr auto auto',
                  gap: '0.75rem', alignItems: 'center',
                  padding: '0.85rem 1.25rem',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* Name + badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--blue-dim)', border: '1px solid rgba(15,111,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, color: 'var(--blue)',
                  }}>
                    {(s.full_name || s.email || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
                      {s.full_name || '—'}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {s.role === 'admin' && (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, background: 'rgba(15,111,255,0.15)', border: '1px solid rgba(15,111,255,0.3)', color: 'var(--blue)', borderRadius: 20, padding: '1px 7px' }}>ADMIN</span>
                      )}
                      {tier && <TierBadge tier={tier} />}
                      {mem && !isActive && (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', color: 'var(--danger)', borderRadius: 20, padding: '1px 7px' }}>REVOKED</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div style={{ fontSize: 12, color: 'var(--silver)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.email}
                </div>

                {/* Joined */}
                <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {isActive ? (
                    <>
                      {/* Tier toggle */}
                      {tier === 'free' ? (
                        <button
                          disabled={isLoading('tier')}
                          onClick={() => setTier(s.id, 'pro')}
                          style={{ ...btnStyle('rgba(15,111,255,0.35)', 'var(--cyan)'), opacity: isLoading('tier') ? 0.5 : 1 }}
                        >→ Pro</button>
                      ) : (
                        <button
                          disabled={isLoading('tier')}
                          onClick={() => setTier(s.id, 'free')}
                          style={{ ...btnStyle('rgba(255,255,255,0.15)', 'var(--muted)'), opacity: isLoading('tier') ? 0.5 : 1 }}
                        >→ Free</button>
                      )}
                      {/* Revoke */}
                      <button
                        disabled={isLoading('revoke')}
                        onClick={() => revokeAccess(s.id)}
                        style={{ ...btnStyle('rgba(231,76,60,0.3)', 'var(--danger)'), opacity: isLoading('revoke') ? 0.5 : 1 }}
                      >Revoke</button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled={isLoading('grant')}
                        onClick={() => grantAccess(s.id, 'free')}
                        style={{ ...btnStyle('rgba(255,255,255,0.15)', 'var(--muted)'), opacity: isLoading('grant') ? 0.5 : 1 }}
                      >Free</button>
                      <button
                        disabled={isLoading('grant')}
                        onClick={() => grantAccess(s.id, 'pro')}
                        style={{ ...btnStyle('rgba(46,204,113,0.3)', 'var(--success)'), opacity: isLoading('grant') ? 0.5 : 1 }}
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
