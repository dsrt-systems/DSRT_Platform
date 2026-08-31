import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Resolve user's identities with auto-provisioning fallback
    const { data: userIdentities } = await supabase.rpc('fn_get_user_mail_identities', {
      p_user_id: user.id,
    })

    let ownedIdentities = userIdentities || []
    let ownedIds = ownedIdentities.map((i: any) => i.identity_id)

    // Fallback if RPC returns empty
    if (ownedIds.length === 0) {
      const { data: directIdentities } = await supabase
        .from('mail_identities')
        .select('id')
        .eq('entity_type', 'user')
        .eq('entity_id', user.id)

      if (directIdentities && directIdentities.length > 0) {
        ownedIds = directIdentities.map((i) => i.id)
      } else {
        // Auto-provision user identity if missing
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, username, avatar_url, dsrt_email')
          .eq('id', user.id)
          .single()

        const email = profile?.dsrt_email || `${profile?.username || 'user'}@dsrt.com`
        const { data: newIdent } = await supabase
          .from('mail_identities')
          .insert({
            entity_type: 'user',
            entity_id: user.id,
            dsrt_email: email,
            display_name: profile?.full_name || profile?.username || 'User',
            avatar_url: profile?.avatar_url,
          })
          .select('id')
          .single()

        if (newIdent) ownedIds = [newIdent.id]
      }
    }

    // 2. Fetch thread details
    const { data: thread, error: threadErr } = await supabase
      .from('mail_threads')
      .select('*')
      .eq('id', id)
      .single()

    if (threadErr || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // 3. Mark thread as read for owned identities
    if (ownedIds.length > 0) {
      await supabase
        .from('mail_thread_participants')
        .update({ is_read: true, last_read_at: new Date().toISOString() })
        .eq('thread_id', id)
        .in('identity_id', ownedIds)
    }

    // 4. Fetch all messages in thread
    const { data: messages } = await supabase
      .from('mail_messages')
      .select('*')
      .eq('thread_id', id)
      .order('sent_at', { ascending: true })

    // 5. Fetch all participants (include state columns used by UI)
    const { data: allParticipants } = await supabase
      .from('mail_thread_participants')
      .select('identity_id, role, is_read, last_read_at, folder, is_starred, is_archived, is_trashed, is_snoozed, is_important')
      .eq('thread_id', id)

    // 6. Gather all involved identities
    const allIdentityIds = Array.from(
      new Set([
        ...(allParticipants || []).map((p) => p.identity_id),
        ...(messages || []).map((m) => m.sender_identity_id),
      ])
    ).filter(Boolean)

    let identityMap: Record<string, any> = {}
    if (allIdentityIds.length > 0) {
      const { data: idents } = await supabase
        .from('mail_identities')
        .select('*')
        .in('id', allIdentityIds)
      identityMap = Object.fromEntries((idents || []).map((i) => [i.id, i]))
    }

    const enrichedMessages = (messages || []).map((m) => ({
      ...m,
      sender_identity: identityMap[m.sender_identity_id] || null,
    }))

    const enrichedParticipants = (allParticipants || []).map((p) => ({
      ...p,
      identity: identityMap[p.identity_id] || null,
    }))

    // Prefer personal identity for reply; fall back to first owned
    const personalIdentity =
      ownedIdentities.find((i: any) => i.entity_type === 'user') ||
      ownedIdentities[0]
    const smartReplyIdentityId: string | null =
      personalIdentity?.identity_id || ownedIds[0] || null

    // Attach current user's participant state for star/archive UI
    const myParticipantState =
      (allParticipants || []).find((p) => ownedIds.includes(p.identity_id)) || null

    return NextResponse.json({
      thread: {
        ...thread,
        participant_state: myParticipantState,
      },
      messages: enrichedMessages,
      participants: enrichedParticipants,
      owned_identity_ids: ownedIds,
      smart_reply_identity_id: smartReplyIdentityId,
      attachments_count: enrichedMessages.reduce(
        (acc, m) => acc + (Array.isArray(m.attachments) ? m.attachments.length : 0),
        0
      ),
    })
  } catch (e: any) {
    console.error('Thread detail error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}