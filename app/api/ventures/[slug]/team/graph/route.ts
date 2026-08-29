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
    .select('id, user_id, founder_id, name, show_in_explore, status')
    .eq('slug', slug)
    .maybeSingle()

  if (!venture) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ownerId = venture.user_id || venture.founder_id

  const isOwnerOrMember = user && (
    venture.user_id === user.id || 
    venture.founder_id === user.id ||
    await supabase.from('venture_team_memberships')
      .select('id').eq('venture_id', venture.id).eq('user_id', user.id).eq('status', 'active').maybeSingle()
      .then(r => !!r.data)
  )

  if (!isOwnerOrMember && (!venture.show_in_explore || venture.status !== 'active')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // 2. Fetch the 4 layers of the graph simultaneously
    let [positionsRes, relationshipsRes, membershipsRes, layoutRes] = await Promise.all([
      supabase
        .from('venture_team_positions')
        .select('*, linked_opportunity:opportunities(id, slug, title, status, positions_open)')
        .eq('venture_id', venture.id)
        .is('archived_at', null),
      
      supabase
        .from('venture_team_relationships')
        .select('*')
        .eq('venture_id', venture.id),
      
      supabase
        .from('venture_team_memberships')
        .select('*, user:users(id, full_name, username, avatar_url, tagline)')
        .eq('venture_id', venture.id)
        .eq('status', 'active'),
        
      supabase
        .from('venture_team_graph_layout')
        .select('*')
        .eq('venture_id', venture.id)
        .is('user_id', null)
    ])

    let positions = positionsRes.data || []
    let memberships = membershipsRes.data || []
    let layout = layoutRes.data || []

    // 3. AUTO-SEED FOUNDER NODE IF GRAPH IS EMPTY
    if (positions.length === 0 && ownerId) {
      // Create Founder Position
      const { data: newPos } = await supabase
        .from('venture_team_positions')
        .insert({
          venture_id: venture.id,
          title: 'Founder & CEO',
          position_type: 'founder',
          status: 'occupied',
          capacity: 1,
          occupied_count: 1,
          created_by: ownerId
        })
        .select()
        .single()

      if (newPos) {
        // Find owner's role_id for Founder
        const { data: founderRole } = await supabase
          .from('venture_roles')
          .select('id')
          .eq('slug', 'owner')
          .maybeSingle()

        // Create Founder Membership
        const { data: newMem } = await supabase
          .from('venture_team_memberships')
          .insert({
            venture_id: venture.id,
            user_id: ownerId,
            position_id: newPos.id,
            role_id: founderRole?.id || null,
            role_title: 'Founder & CEO',
            source: 'admin',
            status: 'active'
          })
          .select('*, user:users(id, full_name, username, avatar_url, tagline)')
          .single()

        // Create Founder Layout Coordinates
        const { data: newLayout } = await supabase
          .from('venture_team_graph_layout')
          .insert({
            venture_id: venture.id,
            position_id: newPos.id,
            x: 0,
            y: 0,
            user_id: null
          })
          .select()
          .single()

        if (newPos) positions = [newPos]
        if (newMem) memberships = [newMem]
        if (newLayout) layout = [newLayout]
      }
    }

    return NextResponse.json({
      positions,
      relationships: relationshipsRes.data || [],
      memberships,
      layout,
      canEdit: isOwnerOrMember
    })
  } catch (e: any) {
    console.error('Graph fetch error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
