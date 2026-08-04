import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all' // all | owned | moderated | member | following

  // Communities where user is a member (any role)
  const { data: memberships } = await supabase
    .from('community_members')
    .select(`
      role, joined_at,
      communities:community_id (
        id, name, slug, description, category, icon, icon_color, cover_url,
        member_count, post_count, is_verified, tags
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const membershipList = (memberships || []).map((m: any) => ({
    ...m.communities,
    role: m.role,
    joined_at: m.joined_at,
  })).filter(Boolean)

  const owned = membershipList.filter(c => c.role === 'owner')
  const moderated = membershipList.filter(c => ['admin', 'moderator'].includes(c.role))
  const member = membershipList.filter(c => c.role === 'member')

  // Communities the user follows (via follows table)
  const { data: followed } = await supabase
    .from('follows')
    .select(`
      following_id, created_at,
      communities:following_id (
        id, name, slug, description, category, icon, icon_color, cover_url,
        member_count, post_count, is_verified, tags
      )
    `)
    .eq('follower_id', user.id)
    .eq('following_type', 'community')

  const following = (followed || []).map((f: any) => ({
    ...f.communities,
    followed_at: f.created_at,
  })).filter(Boolean)

  return NextResponse.json({
    all: membershipList,
    owned,
    moderated,
    member,
    following,
    total: membershipList.length,
    total_following: following.length,
  })
}