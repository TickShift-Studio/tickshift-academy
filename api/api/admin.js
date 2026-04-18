const { createClient } = require('@supabase/supabase-js')

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}

async function requireAdmin(req, supabase) {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '').trim()
  if (!token) return null
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const supabase = getSupabase()
  const admin = await requireAdmin(req, supabase)
  if (!admin) return res.status(403).json({ error: 'Forbidden: admin access required' })
  const { action, ...params } = req.body ?? {}
  try {
    if (action === 'invite-student') {
      const { email, fullName } = params
      if (!email) return res.status(400).json({ error: 'email required' })
      const normalEmail = email.toLowerCase().trim()
      const { data: { users } } = await supabase.auth.admin.listUsers()
      let userId
      const existing = users.find(u => u.email?.toLowerCase() === normalEmail)
      if (existing) {
        userId = existing.id
        await supabase.from('profiles').upsert({ id: userId, email: normalEmail, full_name: fullName ?? normalEmail.split('@')[0], role: 'student' }, { onConflict: 'id' })
      } else {
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({ email: normalEmail, email_confirm: true, user_metadata: { full_name: fullName ?? normalEmail.split('@')[0] } })
        if (createErr) throw createErr
        userId = newUser.user.id
        await supabase.from('profiles').insert({ id: userId, email: normalEmail, full_name: fullName ?? normalEmail.split('@')[0], role: 'student' })
      }
      await supabase.from('memberships').upsert({ user_id: userId, email: normalEmail, source: 'manual', tier: 'tickshift_membership', status: 'active', starts_at: new Date().toISOString() }, { onConflict: 'user_id' })
      const { error: linkErr } = await supabase.auth.admin.generateLink({ type: 'recovery', email: normalEmail })
      if (linkErr) throw linkErr
      return res.status(200).json({ success: true, userId })
    }
    if (action === 'grant-access') {
      const { userId } = params
      if (!userId) return res.status(400).json({ error: 'userId required' })
      const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(userId)
      if (userErr || !user) return res.status(404).json({ error: 'User not found' })
      await supabase.from('memberships').upsert({ user_id: userId, email: user.email, source: 'manual', tier: 'tickshift_membership', status: 'active', starts_at: new Date().toISOString() }, { onConflict: 'user_id' })
      return res.status(200).json({ success: true })
    }
    if (action === 'revoke-access') {
      const { userId } = params
      if (!userId) return res.status(400).json({ error: 'userId required' })
      await supabase.from('memberships').update({ status: 'revoked' }).eq('user_id', userId)
      return res.status(200).json({ success: true })
    }
    if (action === 'resend-invite') {
      const { email } = params
      if (!email) return res.status(400).json({ error: 'email required' })
      const { error: linkErr } = await supabase.auth.admin.generateLink({ type: 'recovery', email: email.toLowerCase().trim() })
      if (linkErr) throw linkErr
      return res.status(200).json({ success: true })
    }
    return res.status(400).json({ error: `Unknown action: ${action}` })
  } catch (err) {
    console.error('Admin API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}
