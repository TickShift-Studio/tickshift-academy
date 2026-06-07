// api/whop-webhook.js
// Vercel Serverless Function — receives Whop purchase/cancellation webhooks
// and updates Supabase membership records accordingly.

const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

// Disable Vercel's automatic body parsing so we can read the raw body
// for HMAC signature verification.
module.exports.config = {
  api: { bodyParser: false },
}

// ── Supabase admin client (service role bypasses RLS) ──────────────────────
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// ── Read raw request body ───────────────────────────────────────────────────
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk.toString() })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

// ── Verify Whop HMAC-SHA256 signature ──────────────────────────────────────
function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false
  const parts = signatureHeader.split(',')
  if (parts.length < 2) return false

  const timestamp = parts[0].replace('t=', '')
  const v1        = parts[1].replace('v1=', '')

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

// ── Look up Supabase user by email (efficient — no full user dump) ──────────
async function findUserByEmail(supabase, email) {
  // First try profiles table (fast indexed lookup)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (profile?.id) return profile.id

  // Fallback: search auth.users via admin API with email filter
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const match = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
  return match?.id ?? null
}

// ── Main handler ────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await getRawBody(req)

  // Verify webhook authenticity
  const signatureHeader = req.headers['whop-signature']
  const secret = process.env.WHOP_WEBHOOK_SECRET
  if (!secret || !verifySignature(rawBody, signatureHeader, secret)) {
    console.error('Whop webhook: invalid signature')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  // Log the raw event so we can see exactly what Whop sends
  console.log('Whop webhook received:', JSON.stringify({ action: payload.action, dataKeys: Object.keys(payload.data || {}) }))

  const { action, data } = payload
  if (!action || !data) {
    return res.status(400).json({ error: 'Missing action or data' })
  }

  // Extract email — Whop nests it differently depending on event type
  const email = (
    data?.email ||
    data?.user?.email ||
    data?.customer?.email ||
    data?.membership?.user?.email ||
    ''
  ).toLowerCase().trim()

  // Extract membership ID
  const whopMembershipId = data?.id || data?.membership?.id

  if (!email || !whopMembershipId) {
    console.error('Whop webhook: missing email or membership ID', { action, email, whopMembershipId, dataKeys: Object.keys(data) })
    return res.status(400).json({ error: 'Missing email or membership ID' })
  }

  const supabase = getSupabase()

  try {
    // ── ACTIVATE — handles both dot and underscore format from Whop ──────────
    // Whop sends: "membership.activated", "membership.went_valid", or legacy "membership_activated"
    const isActivation = [
      'membership.activated',
      'membership.went_valid',
      'membership.renewed',
      'membership_activated',
    ].includes(action)

    // ── DEACTIVATE ────────────────────────────────────────────────────────────
    const isDeactivation = [
      'membership.deactivated',
      'membership.went_invalid',
      'membership.expired',
      'membership.cancelled',
      'membership_deactivated',
    ].includes(action)

    // ── REVOKE ────────────────────────────────────────────────────────────────
    const isRevoke = [
      'membership.banned',
      'membership.deleted',
      'membership_banned',
      'membership_deleted',
      'membership_cancel_at_period_end_changed',
    ].includes(action)

    if (isActivation) {
      const existingUserId = await findUserByEmail(supabase, email)

      if (existingUserId) {
        // Known user — upsert membership
        const { error: upsertErr } = await supabase.from('memberships').upsert(
          {
            user_id:            existingUserId,
            email,
            source:             'whop',
            tier:               'tickshift_membership',
            status:             'active',
            whop_membership_id: whopMembershipId,
            starts_at:          new Date().toISOString(),
            ends_at:            null,
          },
          { onConflict: 'whop_membership_id' }
        )
        if (upsertErr) throw upsertErr
        console.log('Membership activated for existing user:', existingUserId)
      } else {
        // Brand new user — create auth account + profile + membership
        const { data: newUserData, error: createErr } = await supabase.auth.admin.createUser({
          email,
          email_confirm:  true,
          user_metadata:  { source: 'whop', full_name: data?.user?.name ?? '' },
        })
        if (createErr) throw createErr

        const userId = newUserData.user.id

        await supabase.from('profiles').upsert(
          {
            id:        userId,
            email,
            full_name: data?.user?.name ?? email.split('@')[0],
            role:      'student',
          },
          { onConflict: 'id' }
        )

        await supabase.from('memberships').insert({
          user_id:            userId,
          email,
          source:             'whop',
          tier:               'tickshift_membership',
          status:             'active',
          whop_membership_id: whopMembershipId,
          starts_at:          new Date().toISOString(),
        })

        // Send password setup link so new student can log in
        await supabase.auth.admin.generateLink({
          type:  'recovery',
          email,
        })

        console.log('New user created and membership activated:', userId)
      }
    } else if (isDeactivation) {
      await supabase
        .from('memberships')
        .update({ status: 'inactive', ends_at: new Date().toISOString() })
        .eq('whop_membership_id', whopMembershipId)
      console.log('Membership deactivated:', whopMembershipId)
    } else if (isRevoke) {
      await supabase
        .from('memberships')
        .update({ status: 'revoked', ends_at: new Date().toISOString() })
        .eq('whop_membership_id', whopMembershipId)
      console.log('Membership revoked:', whopMembershipId)
    } else {
      // Unknown event — log it so we can see what Whop is sending
      console.log('Whop webhook: unhandled action:', action)
    }

    return res.status(200).json({ received: true, action })

  } catch (err) {
    console.error('Whop webhook error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
