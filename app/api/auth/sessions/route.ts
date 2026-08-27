import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch active session records and login history
    const [{ data: history }, { data: twoFA }] = await Promise.all([
      supabase.from('security_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('user_2fa').select('is_enabled, verified_at').eq('user_id', user.id).maybeSingle()
    ])

    return NextResponse.json({
      mfaEnabled: !!twoFA?.is_enabled,
      securityEvents: history || []
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = createClient()
    // Sign out user across all sessions
    await supabase.auth.signOut({ scope: 'global' })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}