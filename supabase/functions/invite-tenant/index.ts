// Invite a tenant by email. Admin-only.
//
// POST { email, full_name, phone?, apartment_id, preferred_lang?, redirect_to? }
// -> 200 { id }
// -> 400 { error: { code: 'validation', message } }
// -> 403 { error: { code: 'forbidden', message } }
// -> 409 { error: { code: 'email_exists', message } }
// -> 500 { error: { code: 'internal', message } }

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(status: number, code: string, message: string) {
  return json(status, { error: { code, message } })
}

interface Payload {
  email?: unknown
  full_name?: unknown
  phone?: unknown
  apartment_id?: unknown
  preferred_lang?: unknown
  redirect_to?: unknown
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceKey) return fail(500, 'internal', 'Function is not configured')

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return fail(401, 'unauthorized', 'Missing bearer token')

  // 1. Verify the caller is an active admin, using their own JWT so RLS applies.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: isAdmin, error: adminErr } = await callerClient.rpc('is_admin')
  if (adminErr) return fail(401, 'unauthorized', 'Invalid session')
  if (!isAdmin) return fail(403, 'forbidden', 'Admins only')

  // 2. Validate input.
  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return fail(400, 'validation', 'Body must be JSON')
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
  const phone = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null
  const apartmentId = typeof body.apartment_id === 'string' ? body.apartment_id : ''
  const preferredLang = body.preferred_lang === 'ar' ? 'ar' : 'en'
  const redirectTo = typeof body.redirect_to === 'string' ? body.redirect_to : undefined

  if (!EMAIL_RE.test(email)) return fail(400, 'validation', 'Invalid email')
  if (fullName.length < 2 || fullName.length > 80) return fail(400, 'validation', 'Invalid name')
  if (phone && phone.length > 30) return fail(400, 'validation', 'Invalid phone')
  if (!UUID_RE.test(apartmentId)) return fail(400, 'validation', 'Invalid apartment')

  // 3. Do the privileged work with the service role.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: apartment, error: aptErr } = await admin.from('apartments').select('id').eq('id', apartmentId).maybeSingle()
  if (aptErr) return fail(500, 'internal', aptErr.message)
  if (!apartment) return fail(400, 'validation', 'Apartment not found')

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, preferred_lang: preferredLang },
    redirectTo,
  })
  if (inviteErr) {
    const msg = inviteErr.message.toLowerCase()
    if (msg.includes('already') || (inviteErr as { status?: number }).status === 422) {
      return fail(409, 'email_exists', 'A user with this email already exists')
    }
    return fail(500, 'internal', inviteErr.message)
  }

  const userId = invited.user.id
  const { error: profileErr } = await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      phone,
      role: 'tenant',
      apartment_id: apartmentId,
      preferred_lang: preferredLang,
      is_active: true,
    },
    { onConflict: 'id' },
  )
  if (profileErr) return fail(500, 'internal', profileErr.message)

  return json(200, { id: userId })
})
