import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { thread_ids, updates } = await request.json()
    if (!thread_ids || !Array.isArray(thread_ids) || thread_ids.length === 0) {
      return NextResponse.json({ error: 'Thread IDs required' }, { status: 400 })
    }

    // Whitelist allowed updates
    const validUpdates: any = {}
    if (typeof updates.is_archived === 'boolean') validUpdates.is_archived = updates.is_archived
    if (typeof updates.is_trashed === 'boolean') validUpdates.is_trashed = updates.is_trashed
    if (typeof updates.is_read === 'boolean') validUpdates.is_read = updates.is_read
    if (typeof updates.is_starred === 'boolean') validUpdates.is_starred = updates.is_starred
    if (typeof updates.is_snoozed === 'boolean') validUpdates.is_snoozed = updates.is_snoozed
    if (typeof updates.is_important === 'boolean') validUpdates.is_important = updates.is_important
    if (typeof updates.is_spam === 'boolean') validUpdates.is_spam = updates.is_spam
    if (updates.snooze_until) validUpdates.snooze_until = updates.snooze_until
    if (updates.folder) validUpdates.folder = updates.folder

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates' }, { status: 400 })
    }

    // Also update last_read_at when marking read
    if (validUpdates.is_read === true) {
      validUpdates.last_read_at = new Date().toISOString()
    }

    const { data: userIdentities } = await supabase.rpc('fn_get_user_mail_identities', { 
      p_user_id: user.id 
    })
    const ownedIds = (userIdentities || []).map((i: any) => i.identity_id)

    const { error } = await supabase
      .from('mail_thread_participants')
      .update(validUpdates)
      .in('thread_id', thread_ids)
      .in('identity_id', ownedIds)

    if (error) throw error

    return NextResponse.json({ 
      success: true,
      updated_count: thread_ids.length,
    })
  } catch (e: any) {
    console.error('Bulk update error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}