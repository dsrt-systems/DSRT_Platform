import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 1. Verify ownership
  const { data: venture } = await supabase
    .from('ventures')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle()

  if (!venture) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

  const isOwner = await supabase.rpc('is_venture_owner_or_member', {
    p_venture_id: venture.id,
    p_user_id: user.id
  })

  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const idempotencyKey = req.headers.get('X-Idempotency-Key') || `inv-${Date.now()}-${Math.random()}`

  if (!body.invited_user_id || !body.position_id) {
    return NextResponse.json({ error: 'Missing user or position' }, { status: 400 })
  }

  try {
    // 2. Fetch the Position Snapshot
    const { data: position } = await supabase
      .from('venture_team_positions')
      .select('*')
      .eq('id', body.position_id)
      .eq('venture_id', venture.id)
      .single()

    if (!position) throw new Error('Position not found')

    // 3. Prevent duplicate active invitations
    const { data: existing } = await supabase
      .from('venture_team_invitations')
      .select('id')
      .eq('venture_id', venture.id)
      .eq('invited_user_id', body.invited_user_id)
      .in('status', ['draft', 'sent', 'viewed', 'held'])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'User already has an active invitation to this venture' }, { status: 409 })
    }

    // 4. Create the Invitation
    const { data: inv, error } = await supabase
      .from('venture_team_invitations')
      .insert({
        venture_id: venture.id,
        invited_user_id: body.invited_user_id,
        invited_by_user_id: user.id,
        position_id: position.id,
        proposed_role_title: position.title,
        proposed_team: position.team_name,
        proposed_reports_to_position_id: position.parent_position_id,
        responsibilities: position.responsibilities,
        permission_template: body.permission_template || 'member',
        personal_message: body.personal_message || null,
        status: 'sent',
        idempotency_key: idempotencyKey,
        
        // Snapshots (frozen at time of send)
        proposed_role_snapshot: position,
        venture_snapshot: venture
      })
      .select()
      .single()

    if (error) throw error

    // 5. Emit outbox event (This will trigger DSRT Mail / Email in the background workers)
    await supabase.rpc('fn_venture_emit_event', {
      p_venture_id: venture.id,
      p_event_type: 'invitation.sent',
      p_aggregate_type: 'invitation',
      p_aggregate_id: inv.id,
      p_payload: inv
    })

    // 6. Audit Trail
    await supabase.rpc('fn_venture_audit', {
      p_venture_id: venture.id,
      p_action: 'member.invited',
      p_target_type: 'invitation',
      p_target_id: inv.id,
      p_after: inv
    })

    return NextResponse.json({ success: true, invitation: inv })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}