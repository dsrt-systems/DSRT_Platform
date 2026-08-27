import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RateLimitService } from '@/lib/auth/RateLimitService'
import { hashOtp, hashWithSecret } from '@/lib/auth/hash'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { otp } = await request.json()
    const code = String(otp || '').trim()
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Enter a valid 6-digit code', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
    const rl = new RateLimitService(supabase)
    const limit = await rl.check(`VERIFY:USER:${user.id}`, 20, 3600)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please wait before trying again.', code: 'RATE_LIMITED' }, { status: 429 })
    }

    const { data: challenge } = await supabase
      .from('email_verification_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!challenge) {
      return NextResponse.json({ error: 'No active code. Request a new one.', code: 'NO_CHALLENGE' }, { status: 400 })
    }

    if (new Date(challenge.expires_at) < new Date()) {
      await supabase.from('email_verification_challenges').update({ status: 'EXPIRED' }).eq('id', challenge.id)
      return NextResponse.json({ error: 'Code expired. Request a new one.', code: 'OTP_EXPIRED' }, { status: 400 })
    }

    if (challenge.attempts >= challenge.max_attempts) {
      await supabase.from('email_verification_challenges').update({ status: 'LOCKED' }).eq('id', challenge.id)
      return NextResponse.json({ error: 'Too many failed attempts. Request a new code.', code: 'OTP_LOCKED' }, { status: 429 })
    }

    const inputHash = hashOtp(code)
    if (inputHash !== challenge.code_hash) {
      await supabase
        .from('email_verification_challenges')
        .update({
          attempts: challenge.attempts + 1,
          last_attempt_at: new Date().toISOString(),
          status: challenge.attempts + 1 >= challenge.max_attempts ? 'LOCKED' : 'ACTIVE',
        })
        .eq('id', challenge.id)

      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'EMAIL_VERIFICATION_FAILED',
        success: false,
        ip_hash: hashWithSecret(ip),
      })

      return NextResponse.json({ error: 'Incorrect verification code', code: 'OTP_INVALID' }, { status: 400 })
    }

    await supabase
      .from('email_verification_challenges')
      .update({ status: 'CONSUMED', consumed_at: new Date().toISOString() })
      .eq('id', challenge.id)

    await supabase
      .from('users')
      .update({
        account_state: 'USERNAME_REQUIRED',
        email_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    // Best-effort Supabase email confirm sync (service role preferred later)
    // DSRT state is authoritative for app routing; Supabase session still required.

    await supabase.from('security_events').insert({
      user_id: user.id,
      event_type: 'EMAIL_VERIFIED',
      success: true,
    })

    await supabase.from('event_outbox').insert({
      event_type: 'EmailVerified',
      aggregate_id: user.id,
      payload: { user_id: user.id, email: user.email },
    })

    return NextResponse.json({ success: true, nextState: 'USERNAME_REQUIRED' })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'INTERNAL' }, { status: 500 })
  }
}