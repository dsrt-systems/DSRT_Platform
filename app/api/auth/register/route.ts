import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { EmailService } from '@/lib/email/EmailService'
import { hashOtp, hashWithSecret, generateSecureOtp6 } from '@/lib/auth/hash'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { email, password, fullName, dob } = await request.json()

    // 1. Supabase Auth Signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Registration failed' }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Save Profile Data & Identity State (using Admin Client)
    await adminClient.from('users').update({ 
      dob, 
      full_name: fullName,
      account_state: 'EMAIL_VERIFICATION_REQUIRED' 
    }).eq('id', userId)

    // 3. Generate & Save OTP (using Admin Client to bypass RLS)
    const otp = generateSecureOtp6()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: dbError } = await adminClient.from('email_verification_challenges').insert({
      user_id: userId,
      email,
      code_hash: hashOtp(otp),
      expires_at: expiresAt,
      status: 'ACTIVE'
    })

    if (dbError) {
      console.error('Database Error:', dbError)
      return NextResponse.json({ error: 'Failed to save verification code' }, { status: 500 })
    }

    // 4. Send Email via Resend
    const emailResult = await EmailService.sendVerificationOtp(email, otp)
    
    // Log the event
    await adminClient.from('security_events').insert({
      user_id: userId,
      event_type: emailResult.ok ? 'EMAIL_VERIFICATION_SENT' : 'EMAIL_DELIVERY_FAILED',
      success: emailResult.ok,
      metadata: { error: emailResult.error }
    })

    return NextResponse.json({ success: true, email })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}