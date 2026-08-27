import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailService } from '@/lib/email/EmailService'
import { RateLimitService } from '@/lib/auth/RateLimitService'
import { generateSecureOtp6, hashOtp, hashWithSecret } from '@/lib/auth/hash'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const fullName = String(body.fullName || body.full_name || '').trim()
    const dob = body.dob || null

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields', code: 'VALIDATION_ERROR' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters', code: 'PASSWORD_TOO_WEAK' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
    const rl = new RateLimitService(supabase)
    const ipLimit = await rl.check(`REGISTER:IP:${hashWithSecret(ip)}`, 5, 900)
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please wait before trying again.', code: 'RATE_LIMITED' }, { status: 429 })
    }
    const emailLimit = await rl.check(`REGISTER:EMAIL:${hashWithSecret(email)}`, 5, 900)
    if (!emailLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please wait before trying again.', code: 'RATE_LIMITED' }, { status: 429 })
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: undefined, // DSRT owns verification via OTP
      },
    })

    if (authError || !authData.user) {
      // Anti-enumeration-ish message for duplicates
      return NextResponse.json(
        { error: authError?.message || 'Unable to create account', code: 'REGISTER_FAILED' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    if (dob) {
      await supabase.from('users').update({ dob, full_name: fullName }).eq('id', userId)
    } else {
      await supabase.from('users').update({ full_name: fullName }).eq('id', userId)
    }

    // Invalidate old challenges
    await supabase
      .from('email_verification_challenges')
      .update({ status: 'EXPIRED' })
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')

    const otp = generateSecureOtp6()
    const codeHash = hashOtp(otp)
    const ttl = Number(process.env.AUTH_EMAIL_OTP_TTL_SECONDS || 600)
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()

    const { error: chErr } = await supabase.from('email_verification_challenges').insert({
      user_id: userId,
      email,
      code_hash: codeHash,
      expires_at: expiresAt,
      created_ip_hash: hashWithSecret(ip),
      created_user_agent_hash: hashWithSecret(request.headers.get('user-agent') || 'unknown'),
    })

    if (chErr) {
      console.error('[register] challenge insert failed')
      return NextResponse.json({ error: 'Unable to start verification', code: 'CHALLENGE_FAILED' }, { status: 500 })
    }

    const sent = await EmailService.sendVerificationOtp(email, otp)
    await supabase.from('security_events').insert({
      user_id: userId,
      event_type: sent.ok ? 'EMAIL_VERIFICATION_SENT' : 'EMAIL_DELIVERY_FAILED',
      success: sent.ok,
      metadata: { email },
    })

    // Never return OTP
    return NextResponse.json({
      success: true,
      nextState: 'EMAIL_VERIFICATION_REQUIRED',
      email,
      emailDelivered: sent.ok,
    })
  } catch (e: any) {
    console.error('[register] fatal')
    return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'INTERNAL' }, { status: 500 })
  }
}