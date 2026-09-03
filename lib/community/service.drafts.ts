// ============================================================
// lib/community/service.drafts.ts
// Draft lifecycle service for the Community Studio.
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import { writeAudit, NotFoundError, ForbiddenError, ValidationError } from '@/lib/kernel'
import { createCommunity, publishCommunity } from './service.community'
import { normalizeSlug, isValidSlug, isSlugAvailable } from './slugs'

export interface DraftData {
  // Identity
  name?: string
  tagline?: string
  slug?: string
  logo_url?: string | null
  logo_file_id?: string | null
  cover_url?: string | null
  cover_file_id?: string | null
  // Structure
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  community_type?: string
  category?: string
  topics?: string[]
  location_text?: string | null
  website?: string | null
  short_description?: string | null
  description?: string | null
  // Membership
  join_policy?: 'OPEN' | 'APPROVAL_REQUIRED' | 'INVITE_ONLY' | 'CLOSED'
  allow_member_invites?: boolean
  // Governance
  rules?: Array<{ title: string; description?: string }>
  allow_member_posts?: boolean
  allow_member_polls?: boolean
  allow_member_resources?: boolean
  require_post_approval?: boolean
  show_member_directory?: boolean
  show_member_count?: boolean
}

export interface CommunityDraft {
  id: string
  owner_identity_id: string
  community_id: string | null
  step: string
  data: DraftData
  status: 'DRAFT' | 'PUBLISHING' | 'PUBLISHED' | 'DISCARDED'
  autosave_version: number
  published_at: string | null
  discarded_at: string | null
  created_at: string
  updated_at: string
}

// -----------------------------------------------------------
// Utility: normalize null → undefined for interface compat
// -----------------------------------------------------------
function nullToUndefined<T>(v: T | null | undefined): T | undefined {
  return v === null ? undefined : v
}

// -----------------------------------------------------------
// Create / Get / List / Update / Discard
// -----------------------------------------------------------

export async function createDraft(
  supabase: SupabaseClient,
  actorId: string
): Promise<CommunityDraft> {
  const { data, error } = await supabase
    .from('community_drafts')
    .insert({
      owner_identity_id: actorId,
      step: 'identity',
      data: {},
      status: 'DRAFT',
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(`Failed to create draft: ${error?.message}`)
  return data as CommunityDraft
}

export async function getDraft(
  supabase: SupabaseClient,
  actorId: string,
  draftId: string
): Promise<CommunityDraft> {
  const { data } = await supabase
    .from('community_drafts')
    .select('*')
    .eq('id', draftId)
    .maybeSingle()

  if (!data) throw new NotFoundError('Draft', draftId)
  if (data.owner_identity_id !== actorId) throw new ForbiddenError('Not your draft')
  return data as CommunityDraft
}

export async function listMyDrafts(
  supabase: SupabaseClient,
  actorId: string
): Promise<CommunityDraft[]> {
  const { data } = await supabase
    .from('community_drafts')
    .select('*')
    .eq('owner_identity_id', actorId)
    .eq('status', 'DRAFT')
    .order('updated_at', { ascending: false })
    .limit(10)

  return (data || []) as CommunityDraft[]
}

export async function updateDraft(
  supabase: SupabaseClient,
  actorId: string,
  draftId: string,
  patch: Partial<DraftData>,
  step?: string
): Promise<CommunityDraft> {
  const current = await getDraft(supabase, actorId, draftId)
  if (current.status !== 'DRAFT') {
    throw new ValidationError([
      { field: 'status', message: `Cannot edit draft in status ${current.status}` },
    ])
  }

  const nextData: DraftData = { ...(current.data || {}), ...(patch || {}) }

  const { data, error } = await supabase
    .from('community_drafts')
    .update({
      data: nextData,
      step: step ?? current.step,
      autosave_version: current.autosave_version + 1,
    })
    .eq('id', draftId)
    .eq('owner_identity_id', actorId)
    .select('*')
    .single()

  if (error || !data) throw new Error(`Failed to update draft: ${error?.message}`)
  return data as CommunityDraft
}

export async function discardDraft(
  supabase: SupabaseClient,
  actorId: string,
  draftId: string
): Promise<void> {
  const current = await getDraft(supabase, actorId, draftId)
  if (current.status === 'PUBLISHED') {
    throw new ValidationError([{ field: 'status', message: 'Cannot discard published draft' }])
  }
  await supabase
    .from('community_drafts')
    .update({ status: 'DISCARDED', discarded_at: new Date().toISOString() })
    .eq('id', draftId)
    .eq('owner_identity_id', actorId)
}

// -----------------------------------------------------------
// Publish
// -----------------------------------------------------------

function validateForPublish(data: DraftData): { errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = []
  if (!data.name || data.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Name must be at least 3 characters' })
  }
  if (data.name && data.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name must be at most 100 characters' })
  }
  if (!data.visibility) {
    errors.push({ field: 'visibility', message: 'Visibility is required' })
  }
  if (!data.join_policy) {
    errors.push({ field: 'join_policy', message: 'Join policy is required' })
  }
  const tagline = data.tagline?.trim() || data.short_description?.trim() || ''
  if (tagline.length < 10) {
    errors.push({ field: 'tagline', message: 'Add a tagline (at least 10 characters)' })
  }
  if (!data.rules || data.rules.length === 0) {
    errors.push({ field: 'rules', message: 'Add at least one community rule' })
  }
  return { errors }
}

export async function publishDraft(
  supabase: SupabaseClient,
  actorId: string,
  draftId: string,
  requestId?: string
): Promise<{ community_id: string; slug: string; public_id: string }> {
  const draft = await getDraft(supabase, actorId, draftId)
  if (draft.status !== 'DRAFT') {
    throw new ValidationError([{ field: 'status', message: `Draft is ${draft.status}` }])
  }

  const data: DraftData = { ...(draft.data || {}) }

  // Tagline mirrors short_description
  const effectiveShort = data.short_description?.trim() || data.tagline?.trim() || ''
  if (effectiveShort) data.short_description = effectiveShort

  const { errors } = validateForPublish(data)
  if (errors.length > 0) throw new ValidationError(errors)

  // Slug re-check
  if (data.slug) {
    const normalized = normalizeSlug(data.slug)
    const v = isValidSlug(normalized)
    if (!v.valid) throw new ValidationError([{ field: 'slug', message: v.reason || 'Invalid slug' }])
    if (!(await isSlugAvailable(supabase, normalized))) {
      throw new ValidationError([{ field: 'slug', message: 'This slug was taken. Choose another.' }])
    }
    data.slug = normalized
  }

  await supabase
    .from('community_drafts')
    .update({ status: 'PUBLISHING' })
    .eq('id', draftId)
    .eq('owner_identity_id', actorId)

  let createdCommunityId: string | null = null
  try {
    // FIX: convert null → undefined at the call boundary so the interface
    // contract is satisfied regardless of which version is in play.
    const { community } = await createCommunity(
      supabase,
      actorId,
      {
        name: data.name!,
        slug: nullToUndefined(data.slug),
        short_description: nullToUndefined(data.short_description),
        description: nullToUndefined(data.description),
        visibility: data.visibility,
        join_policy: data.join_policy,
        community_type: nullToUndefined(data.community_type),
        category: data.category ?? 'general',
        topics: data.topics ?? [],
        location_text: nullToUndefined(data.location_text),
        website: nullToUndefined(data.website),
      },
      requestId
    )
    createdCommunityId = community.id

    // Attach visuals
    const updatePatch: Record<string, any> = {}
    if (data.logo_url) updatePatch.cover_url = data.logo_url
    if (data.cover_url) updatePatch.banner_url = data.cover_url
    if (data.logo_file_id) updatePatch.logo_file_id = data.logo_file_id
    if (data.cover_file_id) updatePatch.cover_file_id = data.cover_file_id
    if (Object.keys(updatePatch).length > 0) {
      await supabase.from('communities').update(updatePatch).eq('id', community.id)
    }

    // Settings
    const settingsPatch: Record<string, any> = {}
    if (typeof data.allow_member_posts === 'boolean') settingsPatch.allow_member_posts = data.allow_member_posts
    if (typeof data.allow_member_polls === 'boolean') settingsPatch.allow_member_polls = data.allow_member_polls
    if (typeof data.allow_member_resources === 'boolean') settingsPatch.allow_member_resources = data.allow_member_resources
    if (typeof data.allow_member_invites === 'boolean') settingsPatch.allow_member_invites = data.allow_member_invites
    if (typeof data.require_post_approval === 'boolean') settingsPatch.require_post_approval = data.require_post_approval
    if (typeof data.show_member_directory === 'boolean') settingsPatch.show_member_directory = data.show_member_directory
    if (typeof data.show_member_count === 'boolean') settingsPatch.show_member_count = data.show_member_count

    if (Object.keys(settingsPatch).length > 0) {
      await supabase
        .from('community_settings')
        .upsert({ community_id: community.id, ...settingsPatch }, { onConflict: 'community_id' })
    }

    // Rules
    if (data.rules && data.rules.length > 0) {
      const rows = data.rules
        .filter((r) => r.title && r.title.trim().length > 0)
        .map((r, i) => ({
          community_id: community.id,
          title: r.title.trim(),
          description: r.description?.trim() || null,
          position: i,
          status: 'ACTIVE',
          created_by: actorId,
        }))
      if (rows.length > 0) await supabase.from('community_rules').insert(rows)
    }

    // Publish
    await publishCommunity(supabase, actorId, community.id, requestId)

    // Mark draft PUBLISHED
    await supabase
      .from('community_drafts')
      .update({
        status: 'PUBLISHED',
        community_id: community.id,
        published_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .eq('owner_identity_id', actorId)

    await writeAudit(supabase, {
      actorId,
      action: 'community.draft.published',
      entityType: 'community_draft',
      entityId: draftId,
      requestId,
      metadata: { community_id: community.id, slug: community.slug },
    })

    return {
      community_id: community.id,
      slug: community.slug,
      public_id: community.public_id,
    }
  } catch (err) {
    // Rollback draft state
    await supabase
      .from('community_drafts')
      .update({ status: 'DRAFT' })
      .eq('id', draftId)
      .eq('owner_identity_id', actorId)

    // Compensating cleanup: only delete if we created it AND it never got past DRAFT
    if (createdCommunityId) {
      const { data: c } = await supabase
        .from('communities')
        .select('status')
        .eq('id', createdCommunityId)
        .maybeSingle()
      if (c && c.status === 'DRAFT') {
        await supabase.from('communities').delete().eq('id', createdCommunityId)
      }
    }

    throw err
  }
}