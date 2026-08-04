import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 30)
  const offset = parseInt(searchParams.get('offset') || '0')

  const { data: communities, error } = await supabase.rpc('recommend_communities', {
    p_user_id: user.id,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) return NextResponse.json({ communities: [], error: error.message })

  return NextResponse.json({ communities: communities || [] })
}