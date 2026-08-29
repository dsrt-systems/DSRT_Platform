import { getVentureServices } from '@/lib/venture'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { supabase, invitations } = await getVentureServices()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Fetch invitation to authorize
    const { data: inv } = await supabase
      .from('venture_team_invitations')
      .select('venture_id, status')
      .eq('id', id)
      .single()

    if (!inv) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })

    // Verify owner/member permission
    const { data: isMember } = await supabase.rpc('is_venture_owner_or_member', {
      p_venture_id: inv.venture_id,
      p_user_id: user.id
    })

    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const invitation = await invitations.revokeInvitation(id, inv.venture_id)

    // Log activity
    try {
      await supabase.from('venture_team_activity').insert({
        venture_id: inv.venture_id,
        actor_id: user.id,
        action: 'invitation.revoked',
        target_type: 'invitation',
        target_id: id,
        metadata: { previous_status: inv.status }
      })
    } catch {}

    // Append system event to mail thread
    try {
      const { mailBridge } = await getVentureServices()
      await mailBridge.appendSystemEvent(id, 'invitation.revoked', {
        previous_status: inv.status
      })
    } catch {}

    return NextResponse.json({ success: true, invitation })
  } catch (e: any) {
    console.error('Revoke invitation error:', e)
    return NextResponse.json({
      success: false,
      error: e?.message || 'Failed to revoke invitation'
    }, { status: 400 })
  }
}