import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get('username') || ''
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase.rpc('check_username_availability', {
    p_username: username,
    p_user_id: user?.id ?? null,
  })

  if (error) {
    return NextResponse.json({ available: false, reason: 'Unable to check username' }, { status: 500 })
  }
  return NextResponse.json(data)
}