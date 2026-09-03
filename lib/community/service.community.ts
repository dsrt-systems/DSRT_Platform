// ============================================================
// lib/community/service.community.ts
// Community lifecycle service.
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import {
  writeAudit,
  writeOutbox,
  createKernelEvent,
  queueSearchIndex,
  KERNEL_EVENT_TYPES,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '@/lib/kernel'
import { assertCommunityTransition } from './state-machines'
import { normalizeSlug, isValidSlug, isSlugAvailable, generateUniqueSlug } from './slugs'
import { hasCommunityPermission, COMMUNITY_PERMISSIONS } from './permissions'
import type { Community, CommunityStatus } from './types'

// FIX: accept null | undefined on all optional string fields so drafts (which
// naturally store null for empty fields) don't break the type contract.
export interface CreateCommunityInput {
  name: string
  slug?: string | null
  short_description?: string | null
  description?: string | null
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  join_policy?: 'OPEN' | 'APPROVAL_REQUIRED' | 'INVITE_ONLY' | 'CLOSED'
  community_type?: string | null
  category?: string | null
  topics?: string[]
  location_text?: string | null
  website?: string | null
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

const SYSTEM_ROLES: Array<{
  role_key: string
  name: string
  description: string
  position: number
}> = [
  { role_key: 'OWNER', name: 'Owner', description: 'Full authority over this community', position: 1 },
  { role_key: 'ADMIN', name: 'Admin', description: 'Manage members, content, and settings', position: 2 },
  { role_key: 'MODERATOR', name: 'Moderator', description: 'Moderate content and enforce rules', position: 3 },
  { role_key: 'MEMBER', name: 'Member', description: 'Standard community member', position: 4 },
]

async function ensureSystemRoles(supabase: SupabaseClient, communityId: string) {
  const rows = SYSTEM_ROLES.map((r) => ({
    community_id: communityId,
    role_key: r.role_key,
    name: r.name,
    description: r.description,
    is_system: true,
    position: r.position,
  }))
  const { error } = await supabase
    .from('community_roles')
    .upsert(rows, { onConflict: 'community_id,role_key', ignoreDuplicates: true })
  if (error) {
    console.warn('[community:ensureSystemRoles]', error.message)
  }
}

async function requireCommunityAdmin(
  supabase: SupabaseClient,
  actorId: string,
  communityId: string,
  fallbackOwnerId: string | null
): Promise<void> {
  if (fallbackOwnerId && fallbackOwnerId === actorId) return
  const ok = await hasCommunityPermission(
    supabase,
    actorId,
    communityId,
    COMMUNITY_PERMISSIONS.COMMUNITY_UPDATE
  )
  if (!ok) throw new ForbiddenError('You do not have permission to modify this community')
}

// -----------------------------------------------------------
// createCommunity
// -----------------------------------------------------------

export async function createCommunity(
  supabase: SupabaseClient,
  actorId: string,
  input: CreateCommunityInput,
  requestId?: string
): Promise<{ community: Community; event_id: string }> {
  // Validate name
  if (!input.name || input.name.trim().length < 3) {
    throw new ValidationError([{ field: 'name', message: 'Name must be at least 3 characters' }])
  }
  if (input.name.length > 100) {
    throw new ValidationError([{ field: 'name', message: 'Name must be at most 100 characters' }])
  }

  // Resolve slug
  let slug: string
  if (input.slug) {
    slug = normalizeSlug(input.slug)
    const validation = isValidSlug(slug)
    if (!validation.valid) {
      throw new ValidationError([{ field: 'slug', message: validation.reason || 'Invalid slug' }])
    }
    if (!(await isSlugAvailable(supabase, slug))) {
      throw new ValidationError([{ field: 'slug', message: 'This slug is already taken' }])
    }
  } else {
    slug = await generateUniqueSlug(supabase, input.name)
  }

  // Insert community in DRAFT
  const { data: created, error } = await supabase
    .from('communities')
    .insert({
      name: input.name.trim(),
      slug,
      short_description: input.short_description ?? null,
      description: input.description ?? null,
      visibility: input.visibility ?? 'PUBLIC',
      join_policy: input.join_policy ?? 'OPEN',
      community_type: input.community_type ?? null,
      category: input.category ?? 'general',
      topics: input.topics ?? [],
      location_text: input.location_text ?? null,
      website: input.website ?? null,
      status: 'DRAFT',
      owner_identity_id: actorId,
      created_by: actorId,
      member_count: 0,
    })
    .select('*')
    .single()

  if (error || !created) {
    throw new Error(`Failed to create community: ${error?.message}`)
  }

  // Seed system roles (idempotent)
  await ensureSystemRoles(supabase, created.id)

  // Seed community settings
  await supabase
    .from('community_settings')
    .upsert({ community_id: created.id }, { onConflict: 'community_id', ignoreDuplicates: true })

  // Assign owner membership + OWNER role
  const { data: ownerRole } = await supabase
    .from('community_roles')
    .select('id')
    .eq('community_id', created.id)
    .eq('role_key', 'OWNER')
    .maybeSingle()

  const { data: membership } = await supabase
    .from('community_memberships')
    .insert({
      community_id: created.id,
      identity_id: actorId,
      status: 'ACTIVE',
      source: 'ADMIN_ADDED',
    })
    .select('id')
    .single()

  if (membership && ownerRole) {
    await supabase.from('community_membership_roles').upsert(
      {
        membership_id: membership.id,
        role_id: ownerRole.id,
        assigned_by: actorId,
      },
      { onConflict: 'membership_id,role_id', ignoreDuplicates: true }
    )
  }

  // FIX: replace .then().catch() with try/await (Supabase v2 upsert returns PromiseLike, not Promise)
  try {
    const { error: legacyErr } = await supabase
      .from('community_members')
      .upsert(
        { community_id: created.id, user_id: actorId, role: 'owner' },
        { onConflict: 'community_id,user_id' }
      )
    if (legacyErr) {
      console.warn('[community:legacy_member_sync]', legacyErr.message)
    }
  } catch (e: any) {
    console.warn('[community:legacy_member_sync_unexpected]', e?.message)
  }

  // Owner counts as first member
  await incrementMemberCount(supabase, created.id, 1)

  // Audit
  await writeAudit(supabase, {
    actorId,
    action: 'community.created',
    entityType: 'community',
    entityId: created.id,
    requestId,
    after: { name: created.name, slug: created.slug, status: created.status },
  })

  // Outbox
  const event = createKernelEvent({
    eventType: KERNEL_EVENT_TYPES.COMMUNITY_CREATED,
    aggregateType: 'community',
    aggregateId: created.id,
    actorId,
    payload: {
      community_id: created.id,
      slug: created.slug,
      name: created.name,
      owner_id: actorId,
    },
  })
  const eventId = await writeOutbox(supabase, event)

  return { community: created as Community, event_id: eventId }
}

// -----------------------------------------------------------
// publishCommunity
// -----------------------------------------------------------

export async function publishCommunity(
  supabase: SupabaseClient,
  actorId: string,
  communityId: string,
  requestId?: string
): Promise<{ community: Community; event_id: string }> {
  const { data: existing } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .maybeSingle()

  if (!existing) throw new NotFoundError('Community', communityId)

  await requireCommunityAdmin(supabase, actorId, communityId, existing.owner_identity_id)
  assertCommunityTransition(existing.status as CommunityStatus, 'ACTIVE')

  const { data: updated } = await supabase
    .from('communities')
    .update({
      status: 'ACTIVE',
      published_at: existing.published_at ?? new Date().toISOString(),
    })
    .eq('id', communityId)
    .select('*')
    .single()

  await writeAudit(supabase, {
    actorId,
    action: 'community.published',
    entityType: 'community',
    entityId: communityId,
    requestId,
    before: { status: existing.status },
    after: { status: 'ACTIVE' },
  })

  const event = createKernelEvent({
    eventType: KERNEL_EVENT_TYPES.COMMUNITY_PUBLISHED,
    aggregateType: 'community',
    aggregateId: communityId,
    actorId,
    payload: { community_id: communityId, slug: existing.slug },
  })
  const eventId = await writeOutbox(supabase, event)

  await queueSearchIndex(supabase, {
    entityType: 'community',
    entityId: communityId,
    operation: 'INDEX',
  })

  return { community: updated as Community, event_id: eventId }
}

// -----------------------------------------------------------
// archiveCommunity
// -----------------------------------------------------------

export async function archiveCommunity(
  supabase: SupabaseClient,
  actorId: string,
  communityId: string,
  requestId?: string
): Promise<{ community: Community; event_id: string }> {
  const { data: existing } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .maybeSingle()

  if (!existing) throw new NotFoundError('Community', communityId)

  if (existing.owner_identity_id !== actorId) {
    throw new ForbiddenError('Only the owner can archive this community')
  }

  assertCommunityTransition(existing.status as CommunityStatus, 'ARCHIVED')

  const { data: updated } = await supabase
    .from('communities')
    .update({
      status: 'ARCHIVED',
      archived_at: new Date().toISOString(),
    })
    .eq('id', communityId)
    .select('*')
    .single()

  await writeAudit(supabase, {
    actorId,
    action: 'community.archived',
    entityType: 'community',
    entityId: communityId,
    requestId,
    before: { status: existing.status },
    after: { status: 'ARCHIVED' },
  })

  const event = createKernelEvent({
    eventType: KERNEL_EVENT_TYPES.COMMUNITY_ARCHIVED,
    aggregateType: 'community',
    aggregateId: communityId,
    actorId,
    payload: { community_id: communityId },
  })
  const eventId = await writeOutbox(supabase, event)

  await queueSearchIndex(supabase, {
    entityType: 'community',
    entityId: communityId,
    operation: 'DELETE',
  })

  return { community: updated as Community, event_id: eventId }
}

// -----------------------------------------------------------
// updateCommunity
// -----------------------------------------------------------

export async function updateCommunity(
  supabase: SupabaseClient,
  actorId: string,
  communityId: string,
  patch: Partial<CreateCommunityInput>,
  requestId?: string
): Promise<{ community: Community; event_id: string }> {
  const { data: existing } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .maybeSingle()

  if (!existing) throw new NotFoundError('Community', communityId)
  await requireCommunityAdmin(supabase, actorId, communityId, existing.owner_identity_id)

  const updatePayload: Record<string, any> = {}
  if (patch.name) updatePayload.name = patch.name.trim()
  if (patch.short_description !== undefined) updatePayload.short_description = patch.short_description
  if (patch.description !== undefined) updatePayload.description = patch.description
  if (patch.visibility) updatePayload.visibility = patch.visibility
  if (patch.join_policy) updatePayload.join_policy = patch.join_policy
  if (patch.category) updatePayload.category = patch.category
  if (patch.topics) updatePayload.topics = patch.topics
  if (patch.location_text !== undefined) updatePayload.location_text = patch.location_text
  if (patch.website !== undefined) updatePayload.website = patch.website
  if (patch.community_type) updatePayload.community_type = patch.community_type

  if (patch.slug && patch.slug !== existing.slug) {
    const normalized = normalizeSlug(patch.slug)
    const validation = isValidSlug(normalized)
    if (!validation.valid) throw new ValidationError([{ field: 'slug', message: validation.reason! }])
    if (!(await isSlugAvailable(supabase, normalized, communityId))) {
      throw new ValidationError([{ field: 'slug', message: 'This slug is already taken' }])
    }
    updatePayload.slug = normalized
    await supabase.from('community_slug_history').insert({
      community_id: communityId,
      old_slug: existing.slug,
      new_slug: normalized,
      changed_by: actorId,
    })
  }

  updatePayload.version = (existing.version ?? 1) + 1

  const { data: updated } = await supabase
    .from('communities')
    .update(updatePayload)
    .eq('id', communityId)
    .select('*')
    .single()

  await writeAudit(supabase, {
    actorId,
    action: 'community.updated',
    entityType: 'community',
    entityId: communityId,
    requestId,
    before: existing,
    after: updated,
    metadata: { patch_keys: Object.keys(updatePayload) },
  })

  const event = createKernelEvent({
    eventType: KERNEL_EVENT_TYPES.COMMUNITY_UPDATED,
    aggregateType: 'community',
    aggregateId: communityId,
    actorId,
    payload: { community_id: communityId, changes: updatePayload },
  })
  const eventId = await writeOutbox(supabase, event)

  await queueSearchIndex(supabase, {
    entityType: 'community',
    entityId: communityId,
    operation: 'REINDEX',
  })

  return { community: updated as Community, event_id: eventId }
}

// -----------------------------------------------------------
// Exported helper — atomic member_count adjust
// -----------------------------------------------------------

export async function incrementMemberCount(
  supabase: SupabaseClient,
  communityId: string,
  delta: number
): Promise<void> {
  if (delta === 0) return

  // Preferred: RPC (installed by master migration)
  const { error: rpcErr } = await supabase.rpc('rpc_atomic_increment', {
    p_table: 'communities',
    p_id: communityId,
    p_column: 'member_count',
    p_delta: delta,
  })
  if (!rpcErr) return

  // Fallback: read-then-write
  const { data: c } = await supabase
    .from('communities')
    .select('member_count')
    .eq('id', communityId)
    .maybeSingle()
  const current = Number(c?.member_count ?? 0)
  const next = Math.max(0, current + delta)
  await supabase
    .from('communities')
    .update({ member_count: next })
    .eq('id', communityId)
}