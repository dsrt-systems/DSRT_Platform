import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Set this in your .env: CRON_SECRET=your_super_secret_key
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cronSecret = searchParams.get('token')

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized cron access' }, { status: 401 })
  }

  // Use service role to bypass RLS for background jobs
  const supabase = await createClient() 

  try {
    const results = {
      unsnoozed: 0,
      scheduled_sent: 0,
      errors: [] as string[]
    }

    // 1. Process Snoozed Emails (Call the RPC we created in Phase 1)
    const { data: unsnoozedCount, error: snoozeErr } = await supabase
      .rpc('fn_restore_snoozed_threads')
    
    if (snoozeErr) results.errors.push(`Snooze error: ${snoozeErr.message}`)
    else results.unsnoozed = unsnoozedCount || 0

    // 2. Process Scheduled Drafts
    // Find all drafts where scheduled_send_at is in the past
    const { data: scheduledDrafts, error: draftsErr } = await supabase
      .from('mail_drafts')
      .select('*')
      .lte('scheduled_send_at', new Date().toISOString())

    if (draftsErr) {
      results.errors.push(`Draft fetch error: ${draftsErr.message}`)
    } else if (scheduledDrafts && scheduledDrafts.length > 0) {
      
      for (const draft of scheduledDrafts) {
        try {
          // Construct the payload exactly as the frontend Send API expects
          const payload = {
            from_identity_id: draft.from_identity_id,
            to: draft.to_addresses || [],
            cc: draft.cc_addresses || [],
            bcc: draft.bcc_addresses || [],
            subject: draft.subject,
            body_html: draft.body_html,
            attachments: draft.attachments || [],
            entity_attachments: draft.entity_attachments || [],
            reply_to_thread_id: draft.reply_to_thread_id,
            reply_to_message_id: draft.reply_to_message_id,
            draft_id: draft.id,
            // DO NOT pass scheduled_send_at, we want it to send NOW
          }

          // We simulate an internal POST request to our send route
          // Note: In a true microservice, you'd extract the logic to a shared library.
          // Because we need user auth in the send route, we bypass and insert directly here for the cron.
          
          const bodyText = (draft.body_html || '').replace(/<[^>]*>/g, ' ').trim()
          
          // Create new thread if not a reply
          let threadId = draft.reply_to_thread_id
          if (!threadId) {
            const { data: newThread } = await supabase
              .from('mail_threads')
              .insert({ subject: draft.subject, source_type: 'direct' })
              .select().single()
            
            threadId = newThread!.id

            // Add sender to participants
            await supabase.from('mail_thread_participants').insert({
              thread_id: threadId,
              identity_id: draft.from_identity_id,
              role: 'from',
              is_read: true,
              folder: 'sent'
            })
            
            // Add recipients to participants
            const allRecipients = [...(draft.to_addresses||[]), ...(draft.cc_addresses||[]), ...(draft.bcc_addresses||[])]
            for (const r of allRecipients) {
              if (r.identity_id) {
                await supabase.from('mail_thread_participants').insert({
                  thread_id: threadId,
                  identity_id: r.identity_id,
                  role: 'to',
                  folder: 'inbox'
                }).then(()=>{},()=>{}) // Ignore duplicate conflicts
              }
            }
          }

          // Insert Message
          await supabase.from('mail_messages').insert({
            thread_id: threadId,
            sender_identity_id: draft.from_identity_id,
            actual_user_id: draft.user_id,
            body_html: draft.body_html,
            body_text: bodyText,
            attachments: draft.attachments,
            reply_to_message_id: draft.reply_to_message_id
          })

          // Delete draft
          await supabase.from('mail_drafts').delete().eq('id', draft.id)
          
          results.scheduled_sent++
        } catch (err: any) {
          results.errors.push(`Failed to send draft ${draft.id}: ${err.message}`)
        }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}