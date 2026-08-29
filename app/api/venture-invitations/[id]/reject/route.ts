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
    const body = await req.json().catch(() => ({}))
    const message = body.message?.trim() || null

    if (message && message.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 chars)' }, { status: 400 })
    }

    const invitation = await invitations.rejectInvitation(id, user.id, message)

    // Log activity
    try {
      await supabase.from('venture_team_activity').insert({
        venture_id: invitation.venture_id,
        actor_id: user.id,
        action: 'invitation.rejected',
        target_type: 'invitation',
        target_id: id,
        metadata: { has_message: !!message }
      })
    } catch {}

    // Append system event to mail thread
    try {
      const { mailBridge } = await getVentureServices()
      await mailBridge.appendSystemEvent(id, 'invitation.rejected', {
        has_message: !!message
      })
    } catch {}

    return NextResponse.json({ success: true, invitation })
  } catch (e: any) {
    console.error('Reject invitation error:', e)
    return NextResponse.json({
      success: false,
      error: e?.message || 'Failed to reject invitation'
    }, { status: 400 })
  }
}