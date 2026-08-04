import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ items: [] })

  // Get top 6 recommended communities
  const { data: communities } = await supabase.rpc('recommend_communities', {
    p_user_id: user.id,
    p_limit: 6,
    p_offset: 0,
  })

  // Get 4 trending projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, tagline, cover_image_url, sector, category, traction_score')
    .eq('is_public', true)
    .order('traction_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(4)

  // Get 3 recommended builders
  const { data: builders } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url, tagline, execution_score, follower_count')
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .order('execution_score', { ascending: false })
    .limit(3)

  // Mix them
  const items = [
    ...(communities || []).map((c: any) => ({ type: 'community', data: c })),
    ...(projects || []).map((p: any) => ({ type: 'project', data: p })),
    ...(builders || []).map((b: any) => ({ type: 'builder', data: b })),
  ]

  return NextResponse.json({ items })
}