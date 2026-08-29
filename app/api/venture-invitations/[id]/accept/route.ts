import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Fetch & lock invitation
    const { data: inv } = await supabase
      .from('venture_team_invitations')
      .select('*, venture:ventures(id, slug, name)')
      .or(`id.eq.${id},secure_token.eq.${id}`)
      .maybeSingle()

    if (!inv) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    if (inv.invited_user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Idempotency: If already accepted, return existing membership info
    if (inv.status === 'accepted') {
      const { data: existingMem } = await supabase
        .from('venture_team_memberships')
        .select('*')
        .eq('invitation_id', inv.id)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        already_accepted: true,
        membership: existingMem,
        venture_slug: inv.venture?.slug,
      })
    }

    // Check validity
    if (['rejected', 'cancelled', 'expired'].includes(inv.status)) {
      return NextResponse.json({ error: `Cannot accept invitation that is ${inv.status}` }, { status: 400 })
    }

    if (new Date(inv.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // 2. Default permissions payload based on template
    const defaultPermissions = inv.permission_template === 'admin'
      ? { 'venture.team.view': true, 'venture.team.edit': true, 'venture.documents.edit': true, 'venture.member.invite': true }
      : { 'venture.team.view': true, 'venture.documents.view': true }

    // 3. Mark Invitation Accepted
    const { error: invUpdateErr } = await supabase
      .from('venture_team_invitations')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', inv.id)

    if (invUpdateErr) throw invUpdateErr

    // 4. Create Active Membership
    const { data: membership, error: memErr } = await supabase
      .from('venture_team_memberships')
      .insert({
        venture_id: inv.venture_id,
        user_id: user.id,
        position_id: inv.position_id,
        role_title: inv.proposed_role_title,
        role_snapshot: inv.proposed_role_snapshot || {},
        permissions: defaultPermissions,
        permission_template: inv.permission_template || 'member',
        status: 'active',
        invited_by: inv.invited_by_user_id,
        invitation_id: inv.id,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (memErr) throw memErr

    // Note: Database trigger `trg_sync_position_occupancy` automatically updates occupied_count
    // and updates position status to 'occupied' if capacity is reached.

    // 5. Emit Outbox Event
    await supabase.rpc('fn_venture_emit_event', {
      p_venture_id: inv.venture_id,
      p_event_type: 'membership.activated',
      p_aggregate_type: 'membership',
      p_aggregate_id: membership.id,
      p_payload: {
        user_id: user.id,
        position_id: inv.position_id,
        role_title: inv.proposed_role_title,
      }
    })

    // 6. Audit Trail
    await supabase.rpc('fn_venture_audit', {
      p_venture_id: inv.venture_id,
      p_action: 'membership.activated',
      p_target_type: 'membership',
      p_target_id: membership.id,
      p_after: membership
    })

    return NextResponse.json({
      success: true,
      membership,
      venture_slug: inv.venture?.slug,
      redirect_url: `/ventures/${inv.venture?.slug}?onboarding=1`,
    })
  } catch (e: any) {
    console.error('Accept invitation error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to accept invitation' }, { status: 500 })
  }
}