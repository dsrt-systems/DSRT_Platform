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
    const body = await req.json().catch(() => ({}))
    const { data: inv } = await supabase
      .from('venture_team_invitations')
      .select('id, invited_user_id, status, venture_id')
      .or(`id.eq.${id},secure_token.eq.${id}`)
      .maybeSingle()

    if (!inv) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    if (inv.invited_user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: updated, error } = await supabase
      .from('venture_team_invitations')
      .update({
        status: 'held',
        hold_message: body.message?.trim() || null,
        held_at: new Date().toISOString(),
      })
      .eq('id', inv.id)
      .select()
      .single()

    if (error) throw error

    await supabase.rpc('fn_venture_emit_event', {
      p_venture_id: inv.venture_id,
      p_event_type: 'invitation.held',
      p_aggregate_type: 'invitation',
      p_aggregate_id: inv.id,
      p_payload: { message: body.message || null }
    })

    return NextResponse.json({ success: true, invitation: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to hold invitation' }, { status: 500 })
  }
}