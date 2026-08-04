import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)

  const { data: communities, error } = await supabase
    .from('communities')
    .select(`
      id, name, slug, description, category, icon, icon_color, cover_url,
      member_count, post_count, is_verified, tags, created_at
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ communities: [], error: error.message })

  const commIds = (communities || []).map(c => c.id)
  let joined = new Set<string>()
  if (user && commIds.length > 0) {
    const { data } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
      .in('community_id', commIds)
    joined = new Set((data || []).map((r: any) => r.community_id))
  }

  const enriched = (communities || []).map(c => ({ ...c, is_joined: joined.has(c.id) }))
  return NextResponse.json({ communities: enriched })
}