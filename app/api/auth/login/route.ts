import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RateLimitService } from '@/lib/auth/RateLimitService'
import { hashWithSecret } from '@/lib/auth/hash'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { email, password } = await request.json()
    const identifier = String(email || '').trim().toLowerCase()
    const pwd = String(password || '')

    if (!identifier || !pwd) {
      return NextResponse.json({ error: 'Email and password required', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
    const rl = new RateLimitService(supabase)

    const ipLimit = await rl.check(`LOGIN:IP:${hashWithSecret(ip)}`, 10, 900)
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please wait before trying again.', code: 'RATE_LIMITED' }, { status: 429 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: pwd,
    })

    if (error || !data.user) {
      await supabase.from('security_events').insert({
        event_type: 'LOGIN_FAILED',
        success: false,
        ip_hash: hashWithSecret(ip),
        metadata: { identifier_hash: hashWithSecret(identifier) },
      })
      return NextResponse.json({ error: 'Invalid credentials', code: 'AUTH_INVALID_CREDENTIALS' }, { status: 401 })
    }

    const userId = data.user.id
    const { data: profile } = await supabase
      .from('users')
      .select('account_state, onboarding_complete, email_verified_at')
      .eq('id', userId)
      .single()

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)

    await supabase.from('security_events').insert({
      user_id: userId,
      event_type: 'LOGIN_SUCCESS',
      success: true,
      ip_hash: hashWithSecret(ip),
    })

    const state = profile?.account_state || 'EMAIL_VERIFICATION_REQUIRED'

    let next =
      state === 'EMAIL_VERIFICATION_REQUIRED' ? '/auth/verify-email' :
      state === 'USERNAME_REQUIRED' ? '/auth/username' :
      state === 'ONBOARDING_REQUIRED' || !profile?.onboarding_complete ? '/onboarding' :
      state === 'SUSPENDED' || state === 'LOCKED' ? '/account-locked' :
      '/home'

    return NextResponse.json({
      success: true,
      account_state: state,
      next,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'INTERNAL' }, { status: 500 })
  }
}