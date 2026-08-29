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
      .select('id, invited_user_id, status, viewed_at, venture_id')
      .eq('id', id)
      .single()

    if (!inv) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })

    if (inv.invited_user_id !== user.id) {
      return NextResponse.json({ error: 'Not the intended recipient' }, { status: 403 })
    }

    // Idempotent — only update if state transition is valid and viewed_at not already set
    if (inv.status === 'sent' && !inv.viewed_at) {
      await supabase
        .from('venture_team_invitations')
        .update({ status: 'viewed', viewed_at: new Date().toISOString() })
        .eq('id', id)

      // Log activity
      try {
        await supabase.from('venture_team_activity').insert({
          venture_id: inv.venture_id,
          actor_id: user.id,
          action: 'invitation.viewed',
          target_type: 'invitation',
          target_id: id,
          metadata: {}
        })
      } catch {}

      // Append system event to mail thread
      try {
        const { mailBridge } = await getVentureServices()
        await mailBridge.appendSystemEvent(id, 'invitation.viewed')
      } catch {}
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('View invitation error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to mark viewed' }, { status: 500 })
  }
}