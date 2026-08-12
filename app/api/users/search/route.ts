import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 25)

  if (q.length < 2) return NextResponse.json({ users: [] })

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, username, avatar_url, is_verified, tagline')
      .or('full_name.ilike.%' + q + '%,username.ilike.%' + q + '%')
      .limit(limit)

    if (error) throw error
    return NextResponse.json({ users: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, users: [] }, { status: 500 })
  }
}
