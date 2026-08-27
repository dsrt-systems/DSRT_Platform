import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmailService } from '@/lib/email/EmailService'
import { RateLimitService } from '@/lib/auth/RateLimitService'
import { generateSecureOtp6, hashOtp, hashWithSecret } from '@/lib/auth/hash'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 })
    }

    // 1. Rate Limit Checks
    const rl = new RateLimitService(adminSupabase)
    const perMin = await rl.check(`RESEND:USER:${user.id}`, 1, 60)
    if (!perMin.allowed) {
      return NextResponse.json({
        error: `Please wait ${perMin.retry_after_seconds || 60} seconds before requesting another code.`
      }, { status: 429 })
    }

    // 2. Expire old challenges using Admin Client
    await adminSupabase
      .from('email_verification_challenges')
      .update({ status: 'EXPIRED' })
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')

    // 3. Generate New OTP Challenge
    const otp = generateSecureOtp6()
    const ttl = Number(process.env.AUTH_EMAIL_OTP_TTL_SECONDS || 600)
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'

    const { error: insertErr } = await adminSupabase.from('email_verification_challenges').insert({
      user_id: user.id,
      email: user.email,
      code_hash: hashOtp(otp),
      expires_at: expiresAt,
      created_ip_hash: hashWithSecret(ip),
      created_user_agent_hash: hashWithSecret(request.headers.get('user-agent') || 'unknown'),
    })

    if (insertErr) {
      console.error('[resend-verification] Database insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to generate verification challenge in database' }, { status: 500 })
    }

    // 4. Send Email via Resend
    const sent = await EmailService.sendVerificationOtp(user.email, otp)

    await adminSupabase.from('security_events').insert({
      user_id: user.id,
      event_type: sent.ok ? 'EMAIL_VERIFICATION_SENT' : 'EMAIL_DELIVERY_FAILED',
      success: sent.ok,
      metadata: { error: sent.error || null }
    })

    if (!sent.ok) {
      return NextResponse.json({ 
        error: sent.error || 'Could not send verification email. Please check your email configuration.' 
      }, { status: 502 })
    }

    return NextResponse.json({ success: true, cooldown: 60 })
  } catch (err: any) {
    console.error('[resend-verification] Exception:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}