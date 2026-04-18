const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

module.exports.config = { api: { bodyParser: false } }

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk.toString() })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false
  const parts = signatureHeader.split(',')
  if (parts.length < 2) return false
  const timestamp = parts[0].replace('t=', '')
  const v1 = parts[1].replace('v1=', '')
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  try { return crypto.timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex')) } catch { return false }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const rawBody = await getRawBody(req)
  const secret = process.env.WHOP_WEBHOOK_SECRET
  if (!secret || !verifySignature(rawBody, req.headers['whop-signature'], secret)) return res.status(401).json({ error: 'Invalid signature' })
  let payload
  try { payload = JSON.parse(rawBody) } catch { return res.status(400).json({ error: 'Invalid JSON' }) }
  const { action, data } = payload
  if (!action || !data) return res.status(400).json({ error: 'Missing action or data' })
  const email = data?.email ?? data?.user?.email ?? data?.customer?.email
  const whopMembershipId = data?.id
  if (!email || !whopMembershipId) return res.status(400).json({ error: 'Missing email or membership ID' })
  const supabase = getSupabase()
  try {
    if (action === 'membership_activated') {
      const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
      if (listErr) throw listErr
      const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (existingUser) {
        await supabase.from('memberships').upsert({ user_id: existingUser.id, email: email.toLowerCase(), source: 'whop', tier: 'tickshift_membership', status: 'active', whop_membership_id: whopMembershipId, starts_at: new Date().toISOString(), ends_at: null }, { onConflict: 'whop_membership_id' })
        await supabase.auth.admin.generateLink({ type: 'recovery', email: existingUser.email })
      } else {
        const { data: newUserData, error: createErr } = await supabase.auth.admin.createUser({ email, email_confirm: true, user_metadata: { source: 'whop', full_name: data?.user?.name ?? '' } })
        if (createErr) throw createErr
        const userId = newUserData.user.id
        await supabase.from('profiles').upsert({ id: userId, email: email.toLowerCase(), full_name: data?.user?.name ?? email.split('@')[0], role: 'student' }, { onConflict: 'id' })
        await supabase.from('memberships').insert({ user_id: userId, email: email.toLowerCase(), source: 'whop', tier: 'tickshift_membership', status: 'active', whop_membership_id: whopMembershipId, starts_at: new Date().toISOString() })
        await supabase.auth.admin.generateLink({ type: 'recovery', email })
      }
    } else if (action === 'membership_deactivated') {
      await supabase.from('memberships').update({ status: 'inactive' }).eq('whop_membership_id', whopMembershipId)
    } else if (['membership_cancel_at_period_end_changed', 'membership_deleted', 'membership_banned'].includes(action)) {
      await supabase.from('memberships').update({ status: 'revoked' }).eq('whop_membership_id', whopMembershipId)
    }
    return res.status(200).json({ received: true, action })
  } catch (err) {
    console.error('Whop webhook error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
