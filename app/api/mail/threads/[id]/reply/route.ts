import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: threadId } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const bodyHtml = String(body.body_html || body.body || '').trim()
    const attachments = Array.isArray(body.attachments) ? body.attachments : []

    if (!bodyHtml) {
      return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 })
    }

    const { data: userIdentities, error: idErr } = await supabase.rpc(
      'fn_get_user_mail_identities',
      { p_user_id: user.id }
    )
    if (idErr) throw idErr

    const ownedIds: string[] = (userIdentities || []).map((i: any) => i.identity_id)
    if (ownedIds.length === 0) {
      return NextResponse.json({ error: 'No mail identity found' }, { status: 403 })
    }

    const { data: myParts, error: partErr } = await supabase
      .from('mail_thread_participants')
      .select('id, identity_id, role')
      .eq('thread_id', threadId)
      .in('identity_id', ownedIds)

    if (partErr) throw partErr
    if (!myParts?.length) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const fromIdentityId =
      body.from_identity_id && ownedIds.includes(body.from_identity_id)
        ? body.from_identity_id
        : myParts[0].identity_id

    const bodyText = bodyHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Insert — columns must match your actual schema (NO sender_email)
    const { data: message, error: msgErr } = await supabase
      .from('mail_messages')
      .insert({
        thread_id: threadId,
        sender_identity_id: fromIdentityId,
        actual_user_id: user.id,
        body_html: bodyHtml,
        body_text: bodyText,
        attachments,
        sent_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (msgErr) {
      console.error('mail_messages insert failed:', msgErr)
      throw msgErr
    }

    await supabase
      .from('mail_threads')
      .update({
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', threadId)

    // Mark others unread
    await supabase
      .from('mail_thread_participants')
      .update({ is_read: false })
      .eq('thread_id', threadId)
      .neq('identity_id', fromIdentityId)

    await supabase
      .from('mail_thread_participants')
      .update({ is_read: true, last_read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('identity_id', fromIdentityId)

    return NextResponse.json({ success: true, message })
  } catch (e: any) {
    console.error('Reply API error:', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to send reply' },
      { status: 500 }
    )
  }
}