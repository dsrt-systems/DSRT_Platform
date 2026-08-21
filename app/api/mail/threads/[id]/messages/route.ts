import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const bodyHtml = (body.body_html || body.body || '').trim()
    const attachments = Array.isArray(body.attachments) ? body.attachments : []

    if (!bodyHtml) return NextResponse.json({ error: 'Reply message cannot be empty' }, { status: 400 })

    const { data: senderProfile } = await supabase
      .from('users')
      .select('username, dsrt_email')
      .eq('id', user.id)
      .single()

    const senderEmail = senderProfile?.dsrt_email || `${senderProfile?.username || 'user'}@dsrt.com`

    // Verify user is thread participant
    const { data: participant } = await supabase
      .from('mail_thread_participants')
      .select('id')
      .eq('thread_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!participant) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    // Insert message
    const { data: message, error: msgErr } = await supabase
      .from('mail_messages')
      .insert({
        thread_id: id,
        sender_id: user.id,
        sender_email: senderEmail,
        body_html: bodyHtml,
        body_text: bodyHtml.replace(/<[^>]*>/g, ''),
        attachments,
      })
      .select()
      .single()

    if (msgErr) throw msgErr

    return NextResponse.json({ success: true, message })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}