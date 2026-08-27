import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailService } from '@/lib/email/EmailService'
import { RateLimitService } from '@/lib/auth/RateLimitService'
import { generateSecureOtp6, hashOtp, hashWithSecret } from '@/lib/auth/hash'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const rl = new RateLimitService(supabase)
    const perMin = await rl.check(`RESEND:USER:${user.id}`, 1, 60)
    if (!perMin.allowed) {
      return NextResponse.json({
        error: 'Please wait before requesting another code.',
        code: 'RATE_LIMITED',
        retry_after_seconds: perMin.retry_after_seconds || 60,
      }, { status: 429 })
    }
    const perHour = await rl.check(`RESEND:USER:HOUR:${user.id}`, 5, 3600)
    if (!perHour.allowed) {
      return NextResponse.json({ error: 'Too many resend attempts. Try later.', code: 'RATE_LIMITED' }, { status: 429 })
    }

    await supabase
      .from('email_verification_challenges')
      .update({ status: 'EXPIRED' })
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')

    const otp = generateSecureOtp6()
    const ttl = Number(process.env.AUTH_EMAIL_OTP_TTL_SECONDS || 600)
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'

    await supabase.from('email_verification_challenges').insert({
      user_id: user.id,
      email: user.email,
      code_hash: hashOtp(otp),
      expires_at: expiresAt,
      created_ip_hash: hashWithSecret(ip),
      created_user_agent_hash: hashWithSecret(request.headers.get('user-agent') || 'unknown'),
    })

    const sent = await EmailService.sendVerificationOtp(user.email, otp)

    await supabase.from('security_events').insert({
      user_id: user.id,
      event_type: sent.ok ? 'EMAIL_VERIFICATION_SENT' : 'EMAIL_DELIVERY_FAILED',
      success: sent.ok,
    })

    if (!sent.ok) {
      return NextResponse.json({ error: 'Could not send email. Try again shortly.', code: 'EMAIL_DELIVERY_FAILED' }, { status: 502 })
    }

    return NextResponse.json({ success: true, cooldown: 60 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'INTERNAL' }, { status: 500 })
  }
}