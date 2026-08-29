import { getVentureServices } from '@/lib/venture'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { supabase } = await getVentureServices()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: inv } = await supabase
      .from('venture_team_invitations')
      .select('*')
      .eq('id', id)
      .single()

    if (!inv) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })

    // Verify owner/member
    const { data: isMember } = await supabase.rpc('is_venture_owner_or_member', {
      p_venture_id: inv.venture_id,
      p_user_id: user.id
    })

    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Cannot resend accepted/rejected/cancelled
    if (['accepted', 'rejected', 'cancelled'].includes(inv.status)) {
      return NextResponse.json({
        error: `Cannot resend an ${inv.status} invitation. Create a new one.`
      }, { status: 400 })
    }

    // Extend expiration + reset state to 'sent'
    const body = await req.json().catch(() => ({}))
    const extendDays = parseInt(body.extend_days) || 7
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + extendDays)

    const { data: updated, error: updateErr } = await supabase
      .from('venture_team_invitations')
      .update({
        status: 'sent',
        expires_at: newExpiresAt.toISOString(),
        viewed_at: null,
        held_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateErr) throw updateErr

    // Log activity
    try {
      await supabase.from('venture_team_activity').insert({
        venture_id: inv.venture_id,
        actor_id: user.id,
        action: 'invitation.resent',
        target_type: 'invitation',
        target_id: id,
        metadata: { extended_days: extendDays, new_expires_at: newExpiresAt.toISOString() }
      })
    } catch {}

    // Append system event to mail thread
    try {
      const { mailBridge } = await getVentureServices()
      await mailBridge.appendSystemEvent(id, 'invitation.resent', {
        extended_days: extendDays
      })
    } catch {}

    // Trigger notification event
    try {
      await supabase.rpc('fn_venture_emit_event', {
        p_venture_id: inv.venture_id,
        p_event_type: 'invitation.resent',
        p_aggregate_type: 'invitation',
        p_aggregate_id: id,
        p_payload: updated
      })
    } catch {}

    return NextResponse.json({ success: true, invitation: updated })
  } catch (e: any) {
    console.error('Resend invitation error:', e)
    return NextResponse.json({
      success: false,
      error: e?.message || 'Failed to resend invitation'
    }, { status: 500 })
  }
}