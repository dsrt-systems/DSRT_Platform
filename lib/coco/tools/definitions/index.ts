// ============================================================
// lib/coco/tools/definitions/index.ts
// Handlers for all 13 v0.1 tools.
// ============================================================

import { adminClient } from '@/lib/supabase/admin'
import type { UUID } from '@/types/coco'

export type ToolHandler = (args: Record<string, unknown>, userId: UUID) => Promise<unknown>

export const toolHandlers: Record<string, ToolHandler> = {
  // 1. navigate.to
  'navigate.to': async (args) => {
    return { success: true, action: 'client_navigate', route: String(args.route) }
  },

  // 2. get_current_page
  'get_current_page': async (_args, userId) => {
    return { success: true, message: 'Current page context is supplied in envelope' }
  },

  // 3. search.projects
  'search.projects': async (args) => {
    const query = String(args.query || '')
    const limit = Number(args.limit || 5)

    const { data } = await adminClient
      .from('projects')
      .select('id, slug, name, tagline, status, follower_count')
      .or(`name.ilike.%${query}%,tagline.ilike.%${query}%`)
      .limit(limit)

    return { projects: data || [] }
  },

  // 4. search.users
  'search.users': async (args) => {
    const query = String(args.query || '')
    const limit = Number(args.limit || 5)

    const { data } = await adminClient
      .from('users')
      .select('id, username, full_name, tagline, is_verified')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(limit)

    return { users: data || [] }
  },

  // 5. search.ventures
  'search.ventures': async (args) => {
    const query = String(args.query || '')
    const limit = Number(args.limit || 5)

    const { data } = await adminClient
      .from('ventures')
      .select('id, slug, name, tagline, stage, sector')
      .or(`name.ilike.%${query}%,tagline.ilike.%${query}%`)
      .limit(limit)

    return { ventures: data || [] }
  },

  // 6. search.communities
  'search.communities': async (args) => {
    const query = String(args.query || '')
    const limit = Number(args.limit || 5)

    const { data } = await adminClient
      .from('communities')
      .select('id, slug, name, description, member_count')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit)

    return { communities: data || [] }
  },

  // 7. get.project
  'get.project': async (args) => {
    const id = String(args.project_id)
    const { data } = await adminClient
      .from('projects')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle()

    return { project: data }
  },

  // 8. get.venture
  'get.venture': async (args) => {
    const id = String(args.venture_id)
    const { data } = await adminClient
      .from('ventures')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle()

    return { venture: data }
  },

  // 9. get.user
  'get.user': async (args) => {
    const id = String(args.username_or_id)
    const { data } = await adminClient
      .from('users')
      .select('id, username, full_name, tagline, avatar_url, is_verified, follower_count')
      .or(`id.eq.${id},username.eq.${id}`)
      .maybeSingle()

    return { user: data }
  },

  // 10. ui.fill_field
  'ui.fill_field': async (args) => {
    return {
      success: true,
      action: 'client_ui_fill',
      field_id: String(args.field_id),
      value: String(args.value)
    }
  },

  // 11. ui.select_option
  'ui.select_option': async (args) => {
    return {
      success: true,
      action: 'client_ui_select',
      component_id: String(args.component_id),
      option_key: String(args.option_key)
    }
  },

  // 12. mail.open
  'mail.open': async (args) => {
    const threadId = args.thread_id ? String(args.thread_id) : undefined
    const route = threadId ? `/inbox/${threadId}` : '/inbox'
    return { success: true, action: 'client_navigate', route }
  },

  // 13. mail.create_draft
  'mail.create_draft': async (args, userId) => {
    const recipient = String(args.recipient_email_or_username)
    const subject = String(args.subject)
    const body = String(args.body)

    // Create a draft post/message for the user
    const { data, error } = await adminClient
      .from('posts')
      .insert({
        user_id: userId,
        publisher_type: 'person',
        publisher_id: userId,
        type: 'text',
        title: subject,
        content_text: body,
        visibility: 'private',
        is_draft: true,
        metadata: { draft_recipient: recipient, is_mail_draft: true }
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create mail draft: ${error.message}`)
    }

    return { draft_id: data.id, created: true, recipient, subject }
  }
}