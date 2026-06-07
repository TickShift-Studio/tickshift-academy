// api/admin.js
// Vercel Serverless Function — admin actions requiring service-role access.
// All requests must carry the caller's Supabase JWT in Authorization: Bearer <token>
// and the caller must have role = 'admin' in the profiles table.

const { createClient } = require('@supabase/supabase-js')

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// ── Verify that the calling user is an admin ────────────────────────────────
async function requireAdmin(req, supabase) {
  const authHeader = req.headers.authorization ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
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

// ── Upsert membership safely (no unique constraint on user_id) ──────────────
async function upsertMembership(supabase, userId, email, source = 'manual') {
  // Check for existing membership for this user
  const { data: existing } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    // Update existing membership to active
    return supabase
      .from('memberships')
      .update({
        status:    'active',
        source,
        starts_at: new Date().toISOString(),
        ends_at:   null,
      })
      .eq('id', existing.id)
  } else {
    // Insert new membership
    return supabase
      .from('memberships')
      .insert({
        user_id:   userId,
        email:     email.toLowerCase().trim(),
        source,
        tier:      'tickshift_membership',
        status:    'active',
        starts_at: new Date().toISOString(),
      })
  }
}

// ── Main handler ────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = getSupabase()

  const admin = await requireAdmin(req, supabase)
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden: admin access required' })
  }

  const { action, ...params } = req.body ?? {}

  try {

    // ── invite-student ──────────────────────────────────────────────────────
    // Creates a new user + membership + sends invite email.
    // params: { email, fullName? }
    if (action === 'invite-student') {
      const { email, fullName } = params
      if (!email) return res.status(400).json({ error: 'email required' })

      const normalEmail = email.toLowerCase().trim()
      const displayName = fullName?.trim() || normalEmail.split('@')[0]

      // Check if user already exists via profiles table (fast)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', normalEmail)
        .maybeSingle()

      let userId

      if (existingProfile?.id) {
        // User exists — just make sure profile is up to date
        userId = existingProfile.id
        await supabase.from('profiles').update({
          full_name: fullName ? displayName : undefined,
          role: 'student',
        }).eq('id', userId)

        // Resend password reset so they can log in
        await supabase.auth.admin.generateLink({
          type:  'recovery',
          email: normalEmail,
        })
      } else {
        // Brand new user — invite them (sends a clean "Set up your account" email)
        const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
          normalEmail,
          { data: { full_name: displayName } }
        )
        if (inviteErr) throw inviteErr

        userId = invited.user.id

        // Create profile
        await supabase.from('profiles').insert({
          id:        userId,
          email:     normalEmail,
          full_name: displayName,
          role:      'student',
        })
      }

      // Upsert membership safely
      const { error: memberErr } = await upsertMembership(supabase, userId, normalEmail, 'manual')
      if (memberErr) throw memberErr

      return res.status(200).json({ success: true, userId })
    }

    // ── grant-access ────────────────────────────────────────────────────────
    // Activates an existing user's membership.
    // params: { userId }
    if (action === 'grant-access') {
      const { userId } = params
      if (!userId) return res.status(400).json({ error: 'userId required' })

      const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(userId)
      if (userErr || !user) return res.status(404).json({ error: 'User not found' })

      const { error: memberErr } = await upsertMembership(supabase, userId, user.email, 'manual')
      if (memberErr) throw memberErr

      return res.status(200).json({ success: true })
    }

    // ── revoke-access ───────────────────────────────────────────────────────
    // Sets all memberships for a user to revoked.
    // params: { userId }
    if (action === 'revoke-access') {
      const { userId } = params
      if (!userId) return res.status(400).json({ error: 'userId required' })

      const { error: updateErr } = await supabase
        .from('memberships')
        .update({ status: 'revoked', ends_at: new Date().toISOString() })
        .eq('user_id', userId)
      if (updateErr) throw updateErr

      return res.status(200).json({ success: true })
    }

    // ── resend-invite ───────────────────────────────────────────────────────
    // Resends a password reset email to an existing student.
    // params: { email }
    if (action === 'resend-invite') {
      const { email } = params
      if (!email) return res.status(400).json({ error: 'email required' })

      const { error: linkErr } = await supabase.auth.admin.generateLink({
        type:  'recovery',
        email: email.toLowerCase().trim(),
      })
      if (linkErr) throw linkErr

      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })

  } catch (err) {
    console.error('Admin API error:', err.message ?? err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}
