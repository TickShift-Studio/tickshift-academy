import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

function StatusBadge({ status }) {
  const map = {
    active:   { bg: 'rgba(46,204,113,0.12)', border: 'rgba(46,204,113,0.3)',  color: '#2ECC71', label: 'Active' },
    inactive: { bg: 'rgba(231,76,60,0.1)',   border: 'rgba(231,76,60,0.3)',   color: '#E74C3C', label: 'Inactive' },
    revoked:  { bg: 'rgba(149,165,166,0.1)', border: 'rgba(149,165,166,0.3)', color: '#95A5A6', label: 'Revoked' },
    none:     { bg: 'rgba(110,123,143,0.1)', border: 'rgba(110,123,143,0.3)', color: '#6E7B8F', label: 'No Access' },
  }
  const s = map[status] ?? map.none
  return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 20, padding: '2px 10px' }}>{s.label}</span>
}

export default function AdminStudents() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [memberships, setMemberships] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [p, m] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
      supabase.from('memberships').select('*'),
    ])
    setStudents(p.data || [])
    const map = {}
    for (const mb of m.data || []) map[mb.user_id] = mb
    setMemberships(map)
    setLoading(false)
  }

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function callAdmin(body) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  async function grantAccess(userId) {
    const r = await callAdmin({ action: 'grant-access', userId })
    if (r.success) { showToast('Access granted'); loadData() }
    else showToast(r.error || 'Failed', false)
  }

  async function revokeAccess(userId) {
    const r = await callAdmin({ action: 'revoke-access', userId })
    if (r.success) { showToast('Access revoked'); loadData() }
    else showToast(r.error || 'Failed', false)
  }

  async function resendEmail(email) {
    const r = await callAdmin({ action: 'resend-invite', email })
    if (r.success) showToast('Email sent!')
    else showToast(r.error || 'Failed', false)
  }

  async function inviteStudent(e) {
    e.preventDefault()
    setInviting(true)
    const r = await callAdmin({ action: 'invite-student', email: inviteEmail, fullName: inviteName })
    setInviting(false)
    if (r.success) { showToast('Student invited!'); setInviteOpen(false); setInviteEmail(''); setInviteName(''); loadData() }
    else showToast(r.error || 'Failed', false)
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#08162E', padding: '2rem 2.25rem', fontFamily: "'Open Sans', sans-serif" }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, background: toast.ok ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)', border: `1px solid ${toast.ok ? 'rgba(46,204,113,0.4)' : 'rgba(231,76,60,0.4)'}`, borderRadius: 10, padding: '0.75rem 1.25rem', color: toast.ok ? '#2ECC71' : '#E74C3C', fontSize: 13, fontWeight: 600 }}>{toast.msg}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 24, color: '#fff', margin: '0 0 4px' }}>Students</h1>
          <p style={{ color: '#6E7B8F', fontSize: 13, margin: 0 }}>{students.length} total students</p>
        </div>
        <button onClick={() => setInviteOpen(true)} style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)', border: 'none', borderRadius: 9, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, cursor: 'pointer' }}>+ Invite Student</button>
      </div>

      <input
        placeholder="Search by name or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', maxWidth: 380, background: 'rgba(15,111,255,0.06)', border: '1px solid rgba(60,203,255,0.2)', borderRadius: 9, padding: '0.65rem 1rem', color: '#fff', fontSize: 13, outline: 'none', marginBottom: '1.25rem', boxSizing: 'border-box' }}
      />

      {loading ? (
        <div style={{ color: '#6E7B8F', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ background: '#0B1628', border: '1px solid rgba(15,111,255,0.14)', borderRadius: 14, overflow: 'hidden' }}>
          {filtered.map((student, i) => {
            const mb = memberships[student.id]
            const status = mb?.status ?? 'none'
            return (
              <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: i < filtered.length - 1 ? '1px solid rgba(15,111,255,0.08)' : 'none', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {student.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.full_name || 'Unknown'}</div>
                    <div style={{ fontSize: 11, color: '#6E7B8F', marginTop: 2 }}>{student.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                  <StatusBadge status={status} />
                  {status !== 'active'
                    ? <button onClick={() => grantAccess(student.id)} style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ECC71', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Grant</button>
                    : <button onClick={() => revokeAccess(student.id)} style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#E74C3C', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Revoke</button>
                  }
                  <button onClick={() => resendEmail(student.email)} style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(15,111,255,0.1)', border: '1px solid rgba(15,111,255,0.3)', color: '#3CCBFF', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Resend Email</button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#6E7B8F', fontSize: 13 }}>No students found.</div>}
        </div>
      )}

      {inviteOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#0B1628', border: '1px solid rgba(60,203,255,0.2)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 420 }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: '0.5rem' }}>Invite Student</div>
            <p style={{ fontSize: 13, color: '#6E7B8F', marginBottom: '1.5rem' }}>Creates their account, grants access, and sends a password setup email.</p>
            <form onSubmit={inviteStudent}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#3CCBFF', textTransform: 'uppercase', marginBottom: 6 }}>Email</label>
              <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="student@example.com" style={{ width: '100%', background: 'rgba(15,111,255,0.06)', border: '1px solid rgba(60,203,255,0.2)', borderRadius: 9, padding: '0.7rem 1rem', color: '#fff', fontSize: 13, outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }} />
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#3CCBFF', textTransform: 'uppercase', marginBottom: 6 }}>Full Name (optional)</label>
              <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="John Doe" style={{ width: '100%', background: 'rgba(15,111,255,0.06)', border: '1px solid rgba(60,203,255,0.2)', borderRadius: 9, padding: '0.7rem 1rem', color: '#fff', fontSize: 13, outline: 'none', marginBottom: '1.5rem', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={inviting} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #0F6FFF, #3CCBFF)', border: 'none', borderRadius: 9, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, cursor: inviting ? 'not-allowed' : 'pointer' }}>{inviting ? 'Sending…' : 'Send Invite'}</button>
                <button type="button" onClick={() => setInviteOpen(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid rgba(60,203,255,0.2)', borderRadius: 9, color: '#6E7B8F', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
