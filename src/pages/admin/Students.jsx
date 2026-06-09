import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../supabase'

export default function AdminStudents() {
  const [students, setStudents]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting]   = useState(false)
  const [inviteMsg, setInviteMsg] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_admin, created_at')
        .order('created_at', { ascending: false })
      if (mountedRef.current) {
        setStudents(data || [])
        setLoading(false)
      }
    }
    load()
  }, [])

  async function invite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true); setInviteMsg(null)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', email: inviteEmail.trim() }),
      })
      const json = await res.json()
      if (!mountedRef.current) return
      if (res.ok) {
        setInviteMsg({ type: 'success', text: `Invite sent to ${inviteEmail}.` })
        setInviteEmail('')
      } else {
        setInviteMsg({ type: 'error', text: json.error || 'Failed to invite.' })
      }
    } catch (err) {
      if (mountedRef.current) setInviteMsg({ type: 'error', text: err.message })
    } finally {
      if (mountedRef.current) setInviting(false)
    }
  }

  async function grantAccess(userId) {
    setActionLoading(userId + '_grant')
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'grant', userId }),
    })
    if (mountedRef.current) setActionLoading(null)
  }

  async function revokeAccess(userId) {
    if (!confirm('Revoke this student's membership?')) return
    setActionLoading(userId + '_revoke')
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke', userId }),
    })
    if (mountedRef.current) setActionLoading(null)
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return !q || (s.full_name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
  })

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 28, color: 'var(--white)', marginBottom: 4 }}>Students</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Manage access and invite new members.</p>
      </div>

      {/* Invite card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem 1.4rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Invite Student</div>
        <form onSubmit={invite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="student@email.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '9px 12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
            onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
          />
          <button type="submit" disabled={inviting || !inviteEmail.trim()}
            style={{ padding: '9px 20px', background: (!inviteEmail.trim() || inviting) ? 'rgba(15,111,255,0.4)' : 'var(--blue)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: (!inviteEmail.trim() || inviting) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12 }}>
            {inviting ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
        {inviteMsg && (
          <div style={{ marginTop: '0.75rem', padding: '9px 12px', borderRadius: 7, background: inviteMsg.type === 'success' ? 'rgba(46,204,113,0.08)' : 'rgba(231,76,60,0.08)', border: `1px solid ${inviteMsg.type === 'success' ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)'}`, color: inviteMsg.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: 13 }}>
            {inviteMsg.text}
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 360, padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
          onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      {/* Count */}
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: '0.75rem' }}>
        {loading ? 'Loading…' : `${filtered.length} student${filtered.length !== 1 ? 's' : ''}${search ? ' matching search' : ''}`}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.75rem', padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          {['Name', 'Email', 'Joined', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(15,111,255,0.18)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '1.5rem', fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
            {search ? 'No students match your search.' : 'No students yet.'}
          </div>
        ) : (
          filtered.map((s, i) => (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.75rem', alignItems: 'center', padding: '0.85rem 1.25rem', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--blue-dim)', border: '1px solid rgba(15,111,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, color: 'var(--blue)', flexShrink: 0 }}>
                  {(s.full_name || s.email || '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.full_name || '—'}</div>
                  {s.is_admin && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, background: 'rgba(15,111,255,0.15)', border: '1px solid rgba(15,111,255,0.3)', color: 'var(--blue)', borderRadius: 20, padding: '1px 7px' }}>ADMIN</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--silver)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  disabled={actionLoading === s.id + '_grant'}
                  onClick={() => grantAccess(s.id)}
                  style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-head)', fontWeight: 700, opacity: actionLoading === s.id + '_grant' ? 0.5 : 1 }}>
                  Grant
                </button>
                <button
                  disabled={actionLoading === s.id + '_revoke'}
                  onClick={() => revokeAccess(s.id)}
                  style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-head)', fontWeight: 700, opacity: actionLoading === s.id + '_revoke' ? 0.5 : 1 }}>
                  Revoke
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
