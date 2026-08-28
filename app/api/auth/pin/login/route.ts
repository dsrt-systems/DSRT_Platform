import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { hashPin } from '@/lib/auth/pinHash'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, pin } = await request.json()

    if (!email || !pin) {
      return NextResponse.json({ error: 'Email and PIN are required' }, { status: 400 })
    }

    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be 6 digits' }, { status: 400 })
    }

    // Get salt for this user
    const { data: saltData } = await adminClient.rpc('get_pin_salt', {
      p_email: email.trim().toLowerCase(),
    })

    if (!saltData?.has_pin) {
      return NextResponse.json({ error: 'PIN not set for this account. Please use password.' }, { status: 400 })
    }

    const pinHash = hashPin(pin, saltData.salt)

    const { data: verifyResult } = await adminClient.rpc('verify_user_pin_attempt', {
      p_email: email.trim().toLowerCase(),
      p_pin_hash: pinHash,
    })

    if (!verifyResult?.success) {
      return NextResponse.json({ 
        error: verifyResult?.error || 'Invalid PIN',
        attempts_remaining: verifyResult?.attempts_remaining,
      }, { status: 401 })
    }

    // Generate a magic link for verified PIN user
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email.trim().toLowerCase(),
    })

    if (linkError || !linkData.properties?.hashed_token) {
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      token_hash: linkData.properties.hashed_token,
      email: email.trim().toLowerCase(),
    })
  } catch (err: any) {
    console.error('[PIN LOGIN]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}