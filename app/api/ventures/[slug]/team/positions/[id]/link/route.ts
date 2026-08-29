import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 1. Verify venture ownership
  const { data: venture } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  if (!venture) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

  const isOwner = await supabase.rpc('is_venture_owner_or_member', {
    p_venture_id: venture.id,
    p_user_id: user.id
  })
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const opportunityId = body.opportunity_id || null

    // 2. If linking, verify the opportunity belongs to this user/venture
    if (opportunityId) {
      const { data: opp } = await supabase
        .from('opportunities')
        .select('id, poster_user_id')
        .eq('id', opportunityId)
        .single()
      
      if (!opp || opp.poster_user_id !== user.id) {
        return NextResponse.json({ error: 'Invalid or unauthorized opportunity' }, { status: 403 })
      }
    }

    // 3. Update Position -> Opportunity link
    const { data: position, error: posErr } = await supabase
      .from('venture_team_positions')
      .update({ linked_opportunity_id: opportunityId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('venture_id', venture.id)
      .select()
      .single()

    if (posErr) throw posErr

    // 4. Update Opportunity -> Position link (bidirectional integrity)
    if (opportunityId) {
      await supabase
        .from('opportunities')
        .update({ linked_position_id: id })
        .eq('id', opportunityId)
    }

    // 5. Audit
    await supabase.rpc('fn_venture_audit', {
      p_venture_id: venture.id,
      p_action: opportunityId ? 'position.opportunity_linked' : 'position.opportunity_unlinked',
      p_target_type: 'position',
      p_target_id: id,
      p_metadata: { opportunity_id: opportunityId }
    })

    return NextResponse.json({ success: true, position })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}