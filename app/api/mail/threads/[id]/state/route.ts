import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const updates: Record<string, any> = {}

    if (typeof body.is_starred === 'boolean') updates.is_starred = body.is_starred
    if (typeof body.is_archived === 'boolean') updates.is_archived = body.is_archived
    if (typeof body.is_trashed === 'boolean') updates.is_trashed = body.is_trashed
    if (typeof body.is_read === 'boolean') updates.is_read = body.is_read
    if (body.folder) updates.folder = body.folder

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates' }, { status: 400 })
    }

    // Get user's owned identities
    const { data: userIdentities } = await supabase.rpc('fn_get_user_mail_identities', {
      p_user_id: user.id,
    })
    const ownedIds = (userIdentities || []).map((i: any) => i.identity_id)

    // Update all owned participations for this thread
    const { error } = await supabase
      .from('mail_thread_participants')
      .update(updates)
      .eq('thread_id', id)
      .in('identity_id', ownedIds)

    if (error) throw error

    return NextResponse.json({ success: true, updates })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}