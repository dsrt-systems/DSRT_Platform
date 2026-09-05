// ============================================================
// lib/coco/tools/definitions/index.ts
// Handlers for all 13 v0.1 tools with fuzzy route resolution.
// ============================================================

import { adminClient } from '@/lib/supabase/admin'
import type { UUID } from '@/types/coco'

export type ToolHandler = (args: Record<string, unknown>, userId: UUID) => Promise<unknown>

/** Map fuzzy destinations → real app routes */
function resolveRoute(input: string): string {
  const raw = String(input || '').trim()
  if (!raw) return '/home'

  // Already an absolute path
  if (raw.startsWith('/')) return raw

  const s = raw.toLowerCase().replace(/[_-]+/g, ' ').trim()

  // Fuzzy-match key maps
  const table: Array<{ keys: string[]; route: string }> = [
    { keys: ['home', 'feed', 'main'], route: '/home' },
    { keys: ['project section', 'projects', 'my project', 'my projects', 'project'], route: '/projects' },
    { keys: ['create project', 'new project'], route: '/projects/new' },
    { keys: ['venture', 'ventures', 'my venture', 'my ventures'], route: '/ventures' },
    { keys: ['new venture', 'create venture'], route: '/ventures/new' },
    { keys: ['looking for', 'opportunities', 'jobs', 'hiring'], route: '/looking-for' },
    { keys: ['mail', 'inbox', 'dsrt mail', 'email'], route: '/inbox' },
    { keys: ['messages', 'dm', 'chat'], route: '/messages' },
    { keys: ['community', 'communities', 'discover community'], route: '/community' },
    { keys: ['my communities'], route: '/my-communities' },
    { keys: ['network', 'my network'], route: '/my-network' },
    { keys: ['notifications'], route: '/notifications' },
    { keys: ['profile', 'my profile'], route: '/profile/me' },
    { keys: ['settings'], route: '/settings' },
    { keys: ['explore'], route: '/explore' },
    { keys: ['resources'], route: '/resources' },
    { keys: ['events'], route: '/events' },
    { keys: ['saved'], route: '/saved' },
    { keys: ['pulse'], route: '/pulse' },
    { keys: ['vault'], route: '/vault' },
  ]

  for (const row of table) {
    for (const k of row.keys) {
      if (s === k || s.includes(k)) return row.route
    }
  }

  // Fallback: slugify text to attempt path creation
  const slug = s.replace(/\s+/g, '-')
  if (slug.length > 0) return `/${slug}`
  return '/home'
}

export const toolHandlers: Record<string, ToolHandler> = {
  // 1. navigate.to
  'navigate.to': async (args) => {
    const route = resolveRoute(String(args.route ?? args.destination ?? args.path ?? ''))
    return {
      success: true,
      action: 'client_navigate',
      route,
      message: `Navigating to ${route}`,
    }
  },

  // 2. get_current_page
  'get_current_page': async () => {
    return { success: true, message: 'Current page context is supplied in the system envelope' }
  },

  // 3. search.projects
  'search.projects': async (args) => {
    const query = String(args.query || '')
    const limit = Math.min(Number(args.limit || 5), 10)
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
    const limit = Math.min(Number(args.limit || 5), 10)
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
    const limit = Math.min(Number(args.limit || 5), 10)
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
    const limit = Math.min(Number(args.limit || 5), 10)
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
      .select('id, slug, name, tagline, description, status, follower_count, owner_id, created_at')
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle()
    return { project: data }
  },

  // 8. get.venture
  'get.venture': async (args) => {
    const id = String(args.venture_id)
    const { data } = await adminClient
      .from('ventures')
      .select('id, slug, name, tagline, description, stage, sector, follower_count, owner_id')
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
  'ui.fill_field': async (args) => ({
    success: true,
    action: 'client_ui_fill',
    field_id: String(args.field_id),
    value: String(args.value),
  }),

  // 11. ui.select_option
  'ui.select_option': async (args) => ({
    success: true,
    action: 'client_ui_select',
    component_id: String(args.component_id),
    option_key: String(args.option_key),
  }),

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
        metadata: { draft_recipient: recipient, is_mail_draft: true },
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create mail draft: ${error.message}`)
    return { draft_id: data.id, created: true, recipient, subject }
  },
}