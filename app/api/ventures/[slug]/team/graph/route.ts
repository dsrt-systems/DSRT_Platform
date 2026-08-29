import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Get venture & check access
  const { data: venture } = await supabase
    .from('ventures')
    .select('id, user_id, founder_id, show_in_explore, status')
    .eq('slug', slug)
    .maybeSingle()

  if (!venture) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwnerOrMember = user && (
    venture.user_id === user.id || 
    venture.founder_id === user.id ||
    // Check if they are an active member
    await supabase.from('venture_team_memberships')
      .select('id').eq('venture_id', venture.id).eq('user_id', user.id).eq('status', 'active').maybeSingle()
      .then(r => !!r.data)
  )

  // If not authorized and venture is private, deny
  if (!isOwnerOrMember && (!venture.show_in_explore || venture.status !== 'active')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // 2. Fetch the 4 layers of the graph simultaneously
    const [positionsRes, relationshipsRes, membershipsRes, layoutRes] = await Promise.all([
      // A. The structural positions (nodes)
      supabase
        .from('venture_team_positions')
        .select('*, linked_opportunity:opportunities(id, slug, title, status, positions_open)')
        .eq('venture_id', venture.id)
        .is('archived_at', null),
      
      // B. The organizational reporting lines (edges)
      supabase
        .from('venture_team_relationships')
        .select('*')
        .eq('venture_id', venture.id),
      
      // C. The people occupying the positions
      supabase
        .from('venture_team_memberships')
        .select('*, user:users(id, full_name, username, avatar_url, tagline)')
        .eq('venture_id', venture.id)
        .eq('status', 'active'),
        
      // D. The visual layout (coordinates)
      supabase
        .from('venture_team_graph_layout')
        .select('*')
        .eq('venture_id', venture.id)
        .is('user_id', null) // Fetching the shared canonical layout
    ])

    return NextResponse.json({
      positions: positionsRes.data || [],
      relationships: relationshipsRes.data || [],
      memberships: membershipsRes.data || [],
      layout: layoutRes.data || [],
      canEdit: isOwnerOrMember
    })
  } catch (e: any) {
    console.error('Graph fetch error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}