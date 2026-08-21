import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Recipient {
  identity_id?: string | null
  entity_type?: string
  entity_id?: string
  dsrt_email?: string
  display_name?: string
}

function generateSlug(name: string): string {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function ensureIdentity(
  supabase: any, 
  recipient: Recipient
): Promise<string | null> {
  // Already has identity_id — verify it exists
  if (recipient.identity_id) {
    const { data } = await supabase
      .from('mail_identities')
      .select('id')
      .eq('id', recipient.identity_id)
      .maybeSingle()
    if (data) return data.id
  }

  // Try to find by email
  if (recipient.dsrt_email) {
    const { data: existing } = await supabase
      .from('mail_identities')
      .select('id')
      .eq('dsrt_email', recipient.dsrt_email.toLowerCase())
      .maybeSingle()
    if (existing) return existing.id
  }

  // Auto-provision: need entity_type and entity_id
  if (!recipient.entity_type || !recipient.entity_id) return null

  // Fetch entity details from source table
  let email = recipient.dsrt_email
  let displayName = recipient.display_name
  let avatarUrl = null

  if (recipient.entity_type === 'user') {
    const { data: u } = await supabase
      .from('users')
      .select('username, full_name, avatar_url, dsrt_email')
      .eq('id', recipient.entity_id)
      .maybeSingle()
    if (u) {
      email = email || u.dsrt_email || `${u.username?.toLowerCase()}@dsrt.com`
      displayName = displayName || u.full_name || u.username || 'User'
      avatarUrl = u.avatar_url
    }
  } else if (recipient.entity_type === 'venture') {
    const { data: v } = await supabase
      .from('ventures')
      .select('name, slug, venture_number, logo_url, dsrt_email')
      .eq('id', recipient.entity_id)
      .maybeSingle()
    if (v) {
      email = email || v.dsrt_email || `${generateSlug(v.slug || v.venture_number || v.name)}@dsrt.com`
      displayName = displayName || v.name
      avatarUrl = v.logo_url
    }
  } else if (recipient.entity_type === 'project') {
    const { data: p } = await supabase
      .from('projects')
      .select('name, slug, project_number, logo_url, dsrt_email')
      .eq('id', recipient.entity_id)
      .maybeSingle()
    if (p) {
      email = email || p.dsrt_email || `${generateSlug(p.slug || p.project_number || p.name)}@dsrt.com`
      displayName = displayName || p.name
      avatarUrl = p.logo_url
    }
  }

  if (!email) return null

  // Insert new identity
  const { data: newIdentity, error } = await supabase
    .from('mail_identities')
    .insert({
      entity_type: recipient.entity_type,
      entity_id: recipient.entity_id,
      dsrt_email: email.toLowerCase(),
      display_name: displayName,
      avatar_url: avatarUrl,
    })
    .select('id')
    .single()

  if (error) {
    // Might have been created by concurrent request — try to fetch
    const { data: retry } = await supabase
      .from('mail_identities')
      .select('id')
      .eq('entity_type', recipient.entity_type)
      .eq('entity_id', recipient.entity_id)
      .maybeSingle()
    return retry?.id || null
  }

  return newIdentity?.id || null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      from_identity_id,
      to = [],
      cc = [],
      bcc = [],
      subject,
      body_html,
      attachments = [],
      entity_attachments = [],
      source_type = 'direct',
      source_entity_type = null,
      source_entity_id = null,
      draft_id = null,
      scheduled_send_at = null,
      reply_to_thread_id = null,
      reply_to_message_id = null,
    } = body

    // --- VALIDATION ---
    if (!from_identity_id) {
      return NextResponse.json({ error: 'Sender identity is required' }, { status: 400 })
    }
    if (!to || to.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 })
    }
    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }
    if (!body_html?.trim()) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    // --- VERIFY SENDER IDENTITY OWNERSHIP ---
    const { data: userIdentities } = await supabase.rpc('fn_get_user_mail_identities', {
      p_user_id: user.id,
    })
    const ownedIds = (userIdentities || []).map((i: any) => i.identity_id)
    if (!ownedIds.includes(from_identity_id)) {
      return NextResponse.json({ error: 'You cannot send as this identity' }, { status: 403 })
    }

    // --- RESOLVE ALL RECIPIENT IDENTITIES (auto-provision missing) ---
    const resolveRecipients = async (list: Recipient[]) => {
      const resolved: Array<{ identity_id: string, original: Recipient }> = []
      for (const r of list) {
        const id = await ensureIdentity(supabase, r)
        if (id) resolved.push({ identity_id: id, original: r })
      }
      return resolved
    }

    const resolvedTo = await resolveRecipients(to)
    const resolvedCc = await resolveRecipients(cc)
    const resolvedBcc = await resolveRecipients(bcc)

    if (resolvedTo.length === 0) {
      return NextResponse.json({ 
        error: 'Could not resolve any valid recipients. Please check the addresses.' 
      }, { status: 400 })
    }

    // --- HANDLE SCHEDULED SEND ---
    if (scheduled_send_at) {
      const scheduleDate = new Date(scheduled_send_at)
      if (scheduleDate.getTime() <= Date.now()) {
        return NextResponse.json({ 
          error: 'Scheduled time must be in the future' 
        }, { status: 400 })
      }

      // Store as scheduled draft (will be picked up by cron)
      const { data: scheduled, error: schedErr } = await supabase
        .from('mail_drafts')
        .insert({
          user_id: user.id,
          from_identity_id,
          to_addresses: to,
          cc_addresses: cc,
          bcc_addresses: bcc,
          subject: subject.trim(),
          body_html,
          attachments,
          entity_attachments,
          reply_to_thread_id,
          reply_to_message_id,
          scheduled_send_at: scheduleDate.toISOString(),
          compose_mode: 'scheduled',
        })
        .select()
        .single()

      if (schedErr) throw schedErr

      // Delete the original draft if we were editing one
      if (draft_id && draft_id !== scheduled.id) {
        await supabase.from('mail_drafts').delete().eq('id', draft_id).eq('user_id', user.id)
      }

      return NextResponse.json({ 
        success: true, 
        scheduled: true,
        scheduled_id: scheduled.id,
        scheduled_for: scheduleDate.toISOString(),
      })
    }

    // --- BUILD FINAL BODY WITH ENTITY CARDS ---
    let finalBodyHtml = body_html
    if (entity_attachments && entity_attachments.length > 0) {
      const cards = entity_attachments.map((ea: any) => {
        const url = ea.type === 'venture' ? `/ventures/${ea.slug}` 
                  : ea.type === 'project' ? `/projects/${ea.slug}` 
                  : `/profile/${ea.slug}`
        return `<div style="margin:16px 0;padding:14px;border:1px solid rgba(255,255,255,0.08);border-radius:12px;background:rgba(255,255,255,0.02);display:flex;align-items:center;gap:12px;">
          <div style="width:44px;height:44px;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;flex-shrink:0;">
            ${(ea.name || '?')[0].toUpperCase()}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:700;color:white;">${ea.name}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.08em;margin-top:2px;">${ea.type}</div>
          </div>
          <a href="${url}" style="font-size:12px;color:#a78bfa;text-decoration:none;font-weight:600;padding:6px 12px;border-radius:6px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);">View →</a>
        </div>`
      }).join('')
      finalBodyHtml += cards
    }

    const bodyText = finalBodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

    // --- HANDLE REPLY (append to existing thread) ---
    let threadId: string
    let isReply = false

    if (reply_to_thread_id) {
      // Verify user has access to this thread
      const { data: existingPart } = await supabase
        .from('mail_thread_participants')
        .select('id')
        .eq('thread_id', reply_to_thread_id)
        .in('identity_id', ownedIds)
        .maybeSingle()

      if (!existingPart) {
        return NextResponse.json({ error: 'Cannot reply to this thread' }, { status: 403 })
      }

      threadId = reply_to_thread_id
      isReply = true

      // Ensure the from_identity is a participant
      const { data: senderPart } = await supabase
        .from('mail_thread_participants')
        .select('id')
        .eq('thread_id', threadId)
        .eq('identity_id', from_identity_id)
        .maybeSingle()

      if (!senderPart) {
        await supabase.from('mail_thread_participants').insert({
          thread_id: threadId,
          identity_id: from_identity_id,
          role: 'from',
          is_read: true,
          folder: 'sent',
        })
      }
    } else {
      // Create new thread
      const { data: newThread, error: threadErr } = await supabase
        .from('mail_threads')
        .insert({
          subject: subject.trim().slice(0, 250),
          source_type,
          source_entity_type,
          source_entity_id,
        })
        .select()
        .single()

      if (threadErr) throw threadErr
      threadId = newThread.id

      // Add sender as 'from' participant
      await supabase.from('mail_thread_participants').insert({
        thread_id: threadId,
        identity_id: from_identity_id,
        role: 'from',
        is_read: true,
        folder: 'sent',
        last_read_at: new Date().toISOString(),
      })

      // Add recipients
      const allParticipants: any[] = []
      const seenIdentities = new Set<string>([from_identity_id])

      resolvedTo.forEach(({ identity_id }) => {
        if (!seenIdentities.has(identity_id)) {
          seenIdentities.add(identity_id)
          allParticipants.push({ 
            thread_id: threadId, 
            identity_id, 
            role: 'to', 
            folder: 'inbox' 
          })
        }
      })
      resolvedCc.forEach(({ identity_id }) => {
        if (!seenIdentities.has(identity_id)) {
          seenIdentities.add(identity_id)
          allParticipants.push({ 
            thread_id: threadId, 
            identity_id, 
            role: 'cc', 
            folder: 'inbox' 
          })
        }
      })
      resolvedBcc.forEach(({ identity_id }) => {
        if (!seenIdentities.has(identity_id)) {
          seenIdentities.add(identity_id)
          allParticipants.push({ 
            thread_id: threadId, 
            identity_id, 
            role: 'bcc', 
            folder: 'inbox' 
          })
        }
      })

      if (allParticipants.length > 0) {
        const { error: partErr } = await supabase
          .from('mail_thread_participants')
          .insert(allParticipants)
        if (partErr) console.error('Participant insert error:', partErr)
      }
    }

    // --- INSERT THE MESSAGE (trigger will auto-update thread) ---
    const { data: message, error: msgErr } = await supabase
      .from('mail_messages')
      .insert({
        thread_id: threadId,
        sender_identity_id: from_identity_id,
        actual_user_id: user.id,
        body_html: finalBodyHtml,
        body_text: bodyText,
        attachments,
        reply_to_message_id,
      })
      .select()
      .single()

    if (msgErr) throw msgErr

    // --- CLEAN UP DRAFT ---
    if (draft_id) {
      await supabase.from('mail_drafts').delete().eq('id', draft_id).eq('user_id', user.id)
    }

    return NextResponse.json({ 
      success: true, 
      thread_id: threadId, 
      message_id: message.id,
      is_reply: isReply,
      recipient_count: resolvedTo.length + resolvedCc.length + resolvedBcc.length,
    })
  } catch (e: any) {
    console.error('Send mail error:', e)
    return NextResponse.json({ 
      error: e?.message || 'Failed to send message' 
    }, { status: 500 })
  }
}