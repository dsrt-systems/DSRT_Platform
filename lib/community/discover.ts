// ============================================================
// lib/community/discover.ts
// Server-side Discover queries.
//
// FIXED: only queries columns that actually exist on public.users:
//   - preferred_categories (text[])
//   - profile_tags (text[])
//   - looking_for_opportunities (text[])
//   - location_data (jsonb)   ← NOT `location`
//   - institution_id (uuid)
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'

export interface DiscoverCommunityCard {
  id: string
  public_id: string
  slug: string
  name: string
  short_description: string | null
  logo_url: string | null
  cover_url: string | null
  category: string | null
  community_type: string | null
  visibility: string
  join_policy: string
  status: string
  is_verified: boolean
  member_count: number
  post_count: number
  topics: string[]
  location_text: string | null
  created_at: string
  published_at: string | null
  is_member?: boolean
  is_following?: boolean
  membership_status?: string | null
  reason_codes?: string[]
  reason_text?: string | null
}

const COMMUNITY_LIST_FIELDS = `
  id, public_id, slug, name, short_description, description,
  cover_url, banner_url, category, community_type, visibility,
  join_policy, status, is_verified, member_count, post_count,
  topics, location_text, created_at, published_at
`

/**
 * Extracts a lowercase location hint from users.location_data JSONB.
 * Supports { city, region, country, formatted, name } etc.
 */
function extractLocationHint(locationData: any): string | null {
  if (!locationData) return null
  if (typeof locationData === 'string') return locationData.toLowerCase().trim() || null
  const parts = [
    locationData.city,
    locationData.town,
    locationData.region,
    locationData.state,
    locationData.country,
    locationData.formatted,
    locationData.name,
    locationData.label,
  ]
    .filter(Boolean)
    .map((s: string) => String(s).toLowerCase().trim())
    .filter(Boolean)
  return parts[0] || null
}

async function loadUserSignals(
  supabase: SupabaseClient,
  actorId: string | null
): Promise<{ topics: string[]; locationHint: string | null; institutionId: string | null }> {
  if (!actorId) return { topics: [], locationHint: null, institutionId: null }

  const { data: user } = await supabase
    .from('users')
    .select('preferred_categories, profile_tags, looking_for_opportunities, location_data, institution_id')
    .eq('id', actorId)
    .maybeSingle()

  if (!user) return { topics: [], locationHint: null, institutionId: null }

  const topics = Array.from(
    new Set([
      ...((user.preferred_categories as string[] | null) || []),
      ...((user.profile_tags as string[] | null) || []),
      ...((user.looking_for_opportunities as string[] | null) || []),
    ])
      .values()
  ).map((t) => (t || '').toString().toLowerCase()).filter(Boolean)

  return {
    topics,
    locationHint: extractLocationHint(user.location_data),
    institutionId: user.institution_id ?? null,
  }
}

async function enrichWithPersonalization(
  supabase: SupabaseClient,
  cards: DiscoverCommunityCard[],
  actorId: string | null
): Promise<DiscoverCommunityCard[]> {
  if (!actorId || cards.length === 0) return cards
  const ids = cards.map((c) => c.id)

  const [{ data: memberships }, { data: follows }] = await Promise.all([
    supabase
      .from('community_memberships')
      .select('community_id, status')
      .in('community_id', ids)
      .eq('identity_id', actorId),
    supabase
      .from('community_follows_v2')
      .select('community_id')
      .in('community_id', ids)
      .eq('identity_id', actorId),
  ])

  const memMap = new Map((memberships || []).map((m: any) => [m.community_id, m.status]))
  const followSet = new Set((follows || []).map((f: any) => f.community_id))

  return cards.map((c) => ({
    ...c,
    is_member: memMap.get(c.id) === 'ACTIVE',
    membership_status: memMap.get(c.id) ?? null,
    is_following: followSet.has(c.id),
  }))
}

// -----------------------------------------------------------
// RECOMMENDED — personalized picks
// -----------------------------------------------------------

export async function getRecommendedCommunities(
  supabase: SupabaseClient,
  actorId: string | null,
  limit = 12
): Promise<DiscoverCommunityCard[]> {
  const { topics: userTopics, locationHint } = await loadUserSignals(supabase, actorId)

  const { data: candidates, error } = await supabase
    .from('communities')
    .select(COMMUNITY_LIST_FIELDS)
    .eq('status', 'ACTIVE')
    .in('visibility', ['PUBLIC', 'UNLISTED'])
    .order('member_count', { ascending: false })
    .limit(limit * 3)

  if (error) throw error
  if (!candidates || candidates.length === 0) return []

  let dismissedSet = new Set<string>()
  let joinedSet = new Set<string>()
  if (actorId) {
    const [{ data: dismissed }, { data: memberships }] = await Promise.all([
      supabase
        .from('community_discover_dismissals')
        .select('community_id')
        .eq('identity_id', actorId),
      supabase
        .from('community_memberships')
        .select('community_id')
        .eq('identity_id', actorId)
        .in('status', ['ACTIVE', 'PENDING']),
    ])
    dismissedSet = new Set((dismissed || []).map((d: any) => d.community_id))
    joinedSet = new Set((memberships || []).map((m: any) => m.community_id))
  }

  const scored = (candidates as any[])
    .filter((c) => !dismissedSet.has(c.id) && !joinedSet.has(c.id))
    .map((c) => {
      let score = 0
      const reasons: string[] = []

      const cTopics: string[] = Array.isArray(c.topics) ? c.topics.map((t: string) => t.toLowerCase()) : []
      const overlap = cTopics.filter((t) => userTopics.includes(t)).length
      if (overlap > 0) {
        score += overlap * 10
        reasons.push('INTEREST_MATCH')
      }

      if (c.category && userTopics.includes(String(c.category).toLowerCase())) {
        score += 5
        reasons.push('CATEGORY_MATCH')
      }

      if (
        locationHint &&
        c.location_text &&
        String(c.location_text).toLowerCase().includes(locationHint)
      ) {
        score += 6
        reasons.push('LOCATION_MATCH')
      }

      if (c.is_verified) score += 2
      score += Math.log10((c.member_count || 0) + 1) * 2

      return { c, score, reasons }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ c, reasons }) => {
      const reasonText = reasons.includes('INTEREST_MATCH')
        ? 'Matches your interests'
        : reasons.includes('LOCATION_MATCH')
        ? 'Near your location'
        : reasons.includes('CATEGORY_MATCH')
        ? 'Aligned with your goals'
        : 'Popular on DSRT'
      return {
        ...c,
        reason_codes: reasons,
        reason_text: reasonText,
      } as DiscoverCommunityCard
    })

  return enrichWithPersonalization(supabase, scored, actorId)
}

// -----------------------------------------------------------
// RISING — activity-based (view-driven, with popularity fallback)
// -----------------------------------------------------------

export async function getRisingCommunities(
  supabase: SupabaseClient,
  actorId: string | null,
  limit = 8
): Promise<DiscoverCommunityCard[]> {
  const { data: rising } = await supabase
    .from('community_rising_scores')
    .select('community_id, rising_score, new_members_14d, recent_clicks, recent_joins')
    .order('rising_score', { ascending: false })
    .limit(limit)

  if (!rising || rising.length === 0) {
    const { data: fallback } = await supabase
      .from('communities')
      .select(COMMUNITY_LIST_FIELDS)
      .eq('status', 'ACTIVE')
      .in('visibility', ['PUBLIC', 'UNLISTED'])
      .order('member_count', { ascending: false })
      .limit(limit)
    return enrichWithPersonalization(supabase, (fallback || []) as any, actorId)
  }

  const ids = rising.map((r: any) => r.community_id)
  const { data: full } = await supabase
    .from('communities')
    .select(COMMUNITY_LIST_FIELDS)
    .in('id', ids)

  const risingMap = new Map(rising.map((r: any) => [r.community_id, r]))
  const ordered = ids
    .map((id) => (full || []).find((c: any) => c.id === id))
    .filter(Boolean) as any[]

  const withReasons = ordered.map((c) => {
    const r = risingMap.get(c.id) as any
    return {
      ...c,
      reason_codes: ['RISING'],
      reason_text: `${r?.new_members_14d || 0} new members this fortnight`,
    } as DiscoverCommunityCard
  })

  return enrichWithPersonalization(supabase, withReasons, actorId)
}

// -----------------------------------------------------------
// NEW — recently published
// -----------------------------------------------------------

export async function getNewCommunities(
  supabase: SupabaseClient,
  actorId: string | null,
  limit = 8
): Promise<DiscoverCommunityCard[]> {
  const { data } = await supabase
    .from('communities')
    .select(COMMUNITY_LIST_FIELDS)
    .eq('status', 'ACTIVE')
    .in('visibility', ['PUBLIC', 'UNLISTED'])
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  return enrichWithPersonalization(supabase, (data || []) as any, actorId)
}

// -----------------------------------------------------------
// NEAR ME
// -----------------------------------------------------------

export async function getNearMeCommunities(
  supabase: SupabaseClient,
  actorId: string | null,
  limit = 6
): Promise<DiscoverCommunityCard[]> {
  if (!actorId) return []

  const { locationHint } = await loadUserSignals(supabase, actorId)
  if (!locationHint || locationHint.length < 2) return []

  const { data } = await supabase
    .from('communities')
    .select(COMMUNITY_LIST_FIELDS)
    .eq('status', 'ACTIVE')
    .in('visibility', ['PUBLIC', 'UNLISTED'])
    .ilike('location_text', `%${locationHint}%`)
    .order('member_count', { ascending: false })
    .limit(limit)

  return enrichWithPersonalization(supabase, (data || []) as any, actorId)
}

// -----------------------------------------------------------
// CATEGORIES
// -----------------------------------------------------------

export async function getCommunityCategories(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('communities')
    .select('category')
    .eq('status', 'ACTIVE')
    .in('visibility', ['PUBLIC', 'UNLISTED'])

  const counts = new Map<string, number>()
  for (const row of (data || []) as any[]) {
    const key = row.category || 'general'
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

// -----------------------------------------------------------
// ALL COMMUNITIES (paginated + filtered)
// -----------------------------------------------------------

export interface AllCommunitiesFilters {
  category?: string
  community_type?: string
  join_policy?: string
  visibility?: string
  verified_only?: boolean
  location?: string
  sort?: 'members' | 'newest' | 'active'
}

export async function getAllCommunities(
  supabase: SupabaseClient,
  actorId: string | null,
  filters: AllCommunitiesFilters,
  cursor: string | null,
  limit: number
) {
  let query = supabase
    .from('communities')
    .select(COMMUNITY_LIST_FIELDS)
    .eq('status', 'ACTIVE')
    .in('visibility', ['PUBLIC', 'UNLISTED'])

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.community_type) query = query.eq('community_type', filters.community_type)
  if (filters.join_policy) query = query.eq('join_policy', filters.join_policy)
  if (filters.verified_only) query = query.eq('is_verified', true)
  if (filters.location) query = query.ilike('location_text', `%${filters.location}%`)

  const sort = filters.sort ?? 'members'
  if (sort === 'newest') {
    query = query.order('published_at', { ascending: false, nullsFirst: false })
    if (cursor) query = query.lt('published_at', cursor)
  } else if (sort === 'active') {
    query = query.order('post_count', { ascending: false })
    if (cursor) {
      const [cnt, id] = cursor.split(':')
      query = query.or(`post_count.lt.${cnt},and(post_count.eq.${cnt},id.gt.${id})`)
    }
  } else {
    query = query.order('member_count', { ascending: false })
    if (cursor) {
      const [cnt, id] = cursor.split(':')
      query = query.or(`member_count.lt.${cnt},and(member_count.eq.${cnt},id.gt.${id})`)
    }
  }

  query = query.limit(limit + 1)
  const { data, error } = await query
  if (error) throw error

  const rows = (data || []) as any[]
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const last = items[items.length - 1]

  let nextCursor: string | null = null
  if (hasMore && last) {
    if (sort === 'newest') nextCursor = last.published_at
    else if (sort === 'active') nextCursor = `${last.post_count}:${last.id}`
    else nextCursor = `${last.member_count}:${last.id}`
  }

  const enriched = await enrichWithPersonalization(supabase, items, actorId)
  return { items: enriched, next_cursor: nextCursor, has_more: hasMore }
}

// -----------------------------------------------------------
// SEARCH (wildcard-escaped)
// -----------------------------------------------------------

function escapeIlike(term: string): string {
  return term.replace(/[\\%_]/g, (m) => '\\' + m)
}

export async function searchCommunities(
  supabase: SupabaseClient,
  actorId: string | null,
  q: string,
  limit = 20
): Promise<DiscoverCommunityCard[]> {
  const term = q.trim()
  if (!term) return []
  const safe = escapeIlike(term)

  const { data } = await supabase
    .from('communities')
    .select(COMMUNITY_LIST_FIELDS)
    .eq('status', 'ACTIVE')
    .in('visibility', ['PUBLIC', 'UNLISTED'])
    .or(`name.ilike.%${safe}%,short_description.ilike.%${safe}%,description.ilike.%${safe}%`)
    .order('member_count', { ascending: false })
    .limit(limit)

  return enrichWithPersonalization(supabase, (data || []) as any, actorId)
}

// -----------------------------------------------------------
// TRACK
// -----------------------------------------------------------

export async function trackDiscoverEvent(
  supabase: SupabaseClient,
  actorId: string | null,
  events: Array<{
    community_id: string
    event_type: 'IMPRESSION' | 'CLICK' | 'DISMISS' | 'JOIN_CLICK' | 'FOLLOW_CLICK'
    surface?: string
    metadata?: Record<string, unknown>
  }>
) {
  if (!events || events.length === 0) return
  const rows = events.map((e) => ({
    identity_id: actorId,
    community_id: e.community_id,
    event_type: e.event_type,
    surface: e.surface ?? null,
    metadata: e.metadata ?? null,
  }))
  await supabase.from('community_discover_events').insert(rows)
}