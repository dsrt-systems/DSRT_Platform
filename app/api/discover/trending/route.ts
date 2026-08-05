import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 30)

  // Best-effort refresh
  try { await supabase.rpc('refresh_community_metrics', { p_community_id: null }) } catch { /* silent */ }

  const { data: communities, error } = await supabase.rpc('get_trending_communities', {
    p_limit: limit,
  })

  if (error) return NextResponse.json({ communities: [], error: error.message })

  const commIds: string[] = (communities || []).map((c: any) => c.id)
  let joined = new Set<string>()
  if (user && commIds.length > 0) {
    const { data } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
      .in('community_id', commIds)
    joined = new Set((data || []).map((r: any) => r.community_id))
  }

  const enriched = (communities || []).map((c: any) => ({
    ...c,
    is_joined: joined.has(c.id),
  }))

  return NextResponse.json({ communities: enriched })
}