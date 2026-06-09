// api/admin.js
// Vercel Serverless Function — admin actions requiring service-role access.
// ESM syntax (matches root "type": "module").
// All requests must carry the caller's Supabase JWT as Authorization: Bearer <token>
// and the caller must have role = 'admin' in the profiles table.

import { createClient } from '@supabase/supabase-js'

const VALID_TIERS = ['free', 'pro']

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// ── Verify the calling user is an admin ─────────────────────────────────────
async function requireAdmin(req, supabase) {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '').trim()
  if (!token) return null

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user : null
}

// ── Upsert a membership row ──────────────────────────────────────────────────
async function upsertMembership(supabase, userId, email, source = 'manual', tier = 'pro') {
  const { data: existing } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    return supabase
      .from('memberships')
      .update({ status: 'active', source, tier, starts_at: new Date().toISOString(), ends_at: null })
      .eq('id', existing.id)
  } else {
    return supabase
      .from('memberships')
      .insert({
        user_id:   userId,
        email:     email.toLowerCase().trim(),
        source,
        tier,
        status:    'active',
        starts_at: new Date().toISOString(),
      })
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const supabase = getSupabase()

    const admin = await requireAdmin(req, supabase)
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden: admin access required' })
    }

    const { action, ...params } = req.body ?? {}

    // ── invite-student ────────────────────────────────────────────────────────
    // Invites a new or existing user and grants membership.
    // params: { email, fullName?, tier? }  tier defaults to 'free'
    if (action === 'invite-student') {
      const { email, fullName, tier = 'free' } = params
      if (!email) return res.status(400).json({ error: 'email required' })
      if (!VALID_TIERS.includes(tier)) return res.status(400).json({ error: 'tier must be free or pro' })

      const normalEmail = email.toLowerCase().trim()
      const displayName = fullName?.trim() || normalEmail.split('@')[0]

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalEmail)
        .maybeSingle()

      let userId

      if (existingProfile?.id) {
        userId = existingProfile.id
        // Update role and send a password-reset / login email
        await supabase.from('profiles').update({ role: 'student' }).eq('id', userId)
        await fetch(`${process.env.SUPABASE_URL}/auth/v1/recover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': process.env.SUPABASE_ANON_KEY },
          body: JSON.stringify({ email: normalEmail, gotrue_meta_security: {} }),
        })
      } else {
        // Brand new user — invite sends a "Set up your account" email automatically
        const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
          normalEmail,
          { data: { full_name: displayName } }
        )
        if (inviteErr) throw inviteErr
        userId = invited.user.id

        await supabase.from('profiles').insert({
          id: userId, email: normalEmail, full_name: displayName, role: 'student',
        })
      }

      const { error: memberErr } = await upsertMembership(supabase, userId, normalEmail, 'manual', tier)
      if (memberErr) throw memberErr

      return res.status(200).json({ success: true, userId })
    }

    // ── grant-access ──────────────────────────────────────────────────────────
    // Activates an existing user's membership.
    // params: { userId, tier? }  tier defaults to 'pro'
    if (action === 'grant-access') {
      const { userId, tier = 'pro' } = params
      if (!userId) return res.status(400).json({ error: 'userId required' })
      if (!VALID_TIERS.includes(tier)) return res.status(400).json({ error: 'tier must be free or pro' })

      const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(userId)
      if (userErr || !user) return res.status(404).json({ error: 'User not found' })

      const { error: memberErr } = await upsertMembership(supabase, userId, user.email, 'manual', tier)
      if (memberErr) throw memberErr

      return res.status(200).json({ success: true })
    }

    // ── revoke-access ─────────────────────────────────────────────────────────
    // Revokes all memberships for a user.
    // params: { userId }
    if (action === 'revoke-access') {
      const { userId } = params
      if (!userId) return res.status(400).json({ error: 'userId required' })

      const { error } = await supabase
        .from('memberships')
        .update({ status: 'revoked', ends_at: new Date().toISOString() })
        .eq('user_id', userId)
      if (error) throw error

      return res.status(200).json({ success: true })
    }

    // ── set-tier ──────────────────────────────────────────────────────────────
    // Changes an existing active membership's tier without revoking.
    // params: { userId, tier }
    if (action === 'set-tier') {
      const { userId, tier } = params
      if (!userId || !tier) return res.status(400).json({ error: 'userId and tier required' })
      if (!VALID_TIERS.includes(tier)) return res.status(400).json({ error: 'tier must be free or pro' })

      const { error } = await supabase
        .from('memberships')
        .update({ tier })
        .eq('user_id', userId)
        .eq('status', 'active')
      if (error) throw error

      return res.status(200).json({ success: true })
    }

    // ── resend-invite ─────────────────────────────────────────────────────────
    // Sends a password-reset email so an existing user can log in.
    // params: { email }
    if (action === 'resend-invite') {
      const { email } = params
      if (!email) return res.status(400).json({ error: 'email required' })

      const recoverRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': process.env.SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: email.toLowerCase().trim(), gotrue_meta_security: {} }),
      })
      if (!recoverRes.ok) {
        const body = await recoverRes.json().catch(() => ({}))
        throw new Error(body.msg || body.error_description || `recover returned ${recoverRes.status}`)
      }

      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })

  } catch (err) {
    console.error('Admin API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}
