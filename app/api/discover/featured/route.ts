import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)

  const { data: communities, error } = await supabase.rpc('get_featured_communities', {
    p_limit: limit,
  })

  if (error) return NextResponse.json({ communities: [], error: error.message })

  // Enrich with project/venture counts + joined status
  const commIds: string[] = (communities || []).map((c: any) => c.id)
  if (commIds.length === 0) return NextResponse.json({ communities: [] })

  const [projectsData, venturesData, joinedData] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: false })
      .in('organization_id', await getOrgIdsForCommunities(supabase, commIds)),
    supabase
      .from('ventures')
      .select('id', { count: 'exact', head: false })
      .in('organization_id', await getOrgIdsForCommunities(supabase, commIds)),
    user
      ? supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id)
          .in('community_id', commIds)
      : Promise.resolve({ data: [] }),
  ])

  const joined = new Set((joinedData.data || []).map((j: any) => j.community_id))

  // Count per community
  const projectCounts: Record<string, number> = {}
  const ventureCounts: Record<string, number> = {}

  const enriched = (communities || []).map((c: any) => ({
    ...c,
    project_count: projectCounts[c.id] || 0,
    venture_count: ventureCounts[c.id] || 0,
    is_joined: joined.has(c.id),
  }))

  return NextResponse.json({ communities: enriched })
}

async function getOrgIdsForCommunities(supabase: any, commIds: string[]): Promise<string[]> {
  const { data } = await supabase
    .from('organization_communities')
    .select('organization_id')
    .in('community_id', commIds)
  return (data || []).map((r: any) => r.organization_id)
}