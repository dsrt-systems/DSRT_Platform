import { SupabaseClient } from '@supabase/supabase-js'
import { ExploreVentureCard, ExploreFeedModule, ExploreFilterState } from './types'

export class VentureExploreEngine {
  constructor(private supabase: SupabaseClient, private userId?: string) {}

  // 1. MAIN FEED GENERATOR
  async generateFeed(filters: ExploreFilterState = {}, limit = 20, cursor?: string): Promise<{ modules: ExploreFeedModule[], nextCursor?: string }> {
    const negativeVentureIds = await this.getNegativeVentureIds()
    const userAffinities = await this.getUserDomainAffinities()
    const followedIds = await this.getFollowedVentureIds()

    // Query Base Candidates
    let query = this.supabase
      .from('ventures')
      .select(`
        id, slug, name, tagline, description, logo_url, cover_url,
        stage, status, industry, sector, location, venture_type, business_model,
        team_size, follower_count, view_count, is_verified, is_hiring,
        seeking_investment, seeking_cofounder, last_activity_at, created_at,
        founder:users!ventures_founder_id_fkey(id, full_name, username, avatar_url),
        user_id
      `)
      .eq('show_in_explore', true)
      .neq('status', 'archived')
      .eq('is_draft', false)

    // Exclude negative signals
    if (negativeVentureIds.length > 0) {
      query = query.not('id', 'in', `(${negativeVentureIds.join(',')})`)
    }

    // Apply Filter State Constraints
    if (filters.search) {
      const q = filters.search.trim().toLowerCase()
      query = query.or(`name.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%,industry.ilike.%${q}%,sector.ilike.%${q}%,location.ilike.%${q}%`)
    }

    if (filters.domains && filters.domains.length > 0) {
      const domainFilter = filters.domains.map(d => `industry.ilike.%${d}%,sector.ilike.%${d}%`).join(',')
      query = query.or(domainFilter)
    }

    if (filters.stages && filters.stages.length > 0) {
      query = query.in('stage', filters.stages)
    }

    if (filters.venture_types && filters.venture_types.length > 0) {
      query = query.in('venture_type', filters.venture_types)
    }

    if (filters.business_models && filters.business_models.length > 0) {
      query = query.in('business_model', filters.business_models)
    }

    if (filters.is_verified) {
      query = query.eq('is_verified', true)
    }

    if (filters.is_hiring) {
      query = query.eq('is_hiring', true)
    }

    const { data: rawCandidates, error } = await query.limit(150)
    if (error || !rawCandidates) {
      console.error('Candidate fetch error:', error)
      return { modules: [] }
    }

    // Transform Candidates
    const candidates: ExploreVentureCard[] = rawCandidates.map((v: any) => ({
      ...v,
      is_following: followedIds.has(v.id),
      domains: [v.industry, v.sector].filter(Boolean) as string[],
    }))

    // If specific filters or search are applied, return catalog grid directly
    if (filters.search || (filters.domains && filters.domains.length > 0) || filters.stages?.length) {
      const ranked = this.rankCandidates(candidates, userAffinities)
      return {
        modules: [{
          id: 'catalog-results',
          type: 'catalog',
          title: `Venture Results (${ranked.length})`,
          items: ranked.slice(0, limit)
        }]
      }
    }

    // Build YouTube-Style Multi-Module Discovery Feed
    const modules: ExploreFeedModule[] = []

    // Module 1: Recommended for you (70% preferences / 30% exploration)
    const scoredRecommended = this.rankCandidates(candidates, userAffinities)
    if (scoredRecommended.length > 0) {
      modules.push({
        id: 'recommended-mod',
        type: 'recommended',
        title: 'Recommended for you',
        subtitle: 'Personalized based on your domain preferences and network activity',
        items: scoredRecommended.slice(0, 8)
      })
    }

    // Module 2: Rising across DSRT
    const risingVentures = [...candidates]
      .sort((a, b) => {
        const scoreA = (a.follower_count || 0) * 2 + (a.view_count || 0)
        const scoreB = (b.follower_count || 0) * 2 + (b.view_count || 0)
        return scoreB - scoreA
      })
      .slice(0, 8)
      .map(v => ({ ...v, reason_code: 'RISING', reason_label: 'Rising in momentum' }))

    if (risingVentures.length > 0) {
      modules.push({
        id: 'rising-mod',
        type: 'rising',
        title: 'Rising across DSRT',
        subtitle: 'Ventures gaining rapid traction and community engagement',
        items: risingVentures
      })
    }

    // Module 3: Domain Affinity (e.g. Robotics, Marine, Food, etc.)
    const topDomain = userAffinities[0]?.domain_slug || candidates[0]?.industry
    if (topDomain) {
      const domainVentures = candidates
        .filter(v => (v.industry || '').toLowerCase().includes(topDomain.toLowerCase()) || (v.sector || '').toLowerCase().includes(topDomain.toLowerCase()))
        .slice(0, 8)
        .map(v => ({ ...v, reason_code: 'DOMAIN_AFFINITY', reason_label: `In ${topDomain}` }))

      if (domainVentures.length > 0) {
        modules.push({
          id: 'domain-affinity-mod',
          type: 'domain_affinity',
          title: `Because you explore ${topDomain}`,
          subtitle: `Curated ventures in ${topDomain}`,
          items: domainVentures
        })
      }
    }

    // Module 4: New & Notable
    const newVentures = [...candidates]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 8)
      .map(v => ({ ...v, reason_code: 'NEW', reason_label: 'Newly launched' }))

    if (newVentures.length > 0) {
      modules.push({
        id: 'new-mod',
        type: 'new_and_notable',
        title: 'New ventures',
        subtitle: 'Recently created ventures building on DSRT Connect',
        items: newVentures
      })
    }

    return { modules }
  }

  // 2. CANDIDATE RANKING ENGINE (Personalized Scoring + 30% Exploration)
  private rankCandidates(candidates: ExploreVentureCard[], affinities: { domain_slug: string; score: number }[]): ExploreVentureCard[] {
    const affinityMap = new Map(affinities.map(a => [a.domain_slug.toLowerCase(), a.score]))

    const scored = candidates.map(v => {
      let score = 0
      const reasons: string[] = []

      // Domain match
      const ind = (v.industry || '').toLowerCase()
      const sec = (v.sector || '').toLowerCase()
      const domScore = (affinityMap.get(ind) || 0) + (affinityMap.get(sec) || 0)

      if (domScore > 0) {
        score += domScore * 25
        reasons.push(`Based on your interest in ${v.industry || v.sector}`)
      }

      // Verification & Activity
      if (v.is_verified) score += 15
      if (v.is_hiring) score += 10
      if (v.seeking_investment) score += 8

      // Freshness decay
      const hoursAgo = (Date.now() - new Date(v.last_activity_at || v.created_at || Date.now()).getTime()) / (1000 * 60 * 60)
      const freshness = Math.max(0, 20 - (hoursAgo / 24))
      score += freshness

      // Exploration Injection (Randomness to break filter bubble)
      const explorationBonus = Math.random() * 15
      score += explorationBonus

      return {
        ...v,
        _score: score,
        reason_label: reasons[0] || (v.is_verified ? 'Verified Venture' : 'Discover on DSRT')
      }
    })

    // Sort descending
    const sorted = scored.sort((a, b) => (b as any)._score - (a as any)._score)

    // Maximal Marginal Relevance (MMR) Diversification - Max 2 consecutive same-industry items
    return this.diversifyByIndustry(sorted, 2)
  }

  // 3. DIVERSIFICATION PASS
  private diversifyByIndustry(items: ExploreVentureCard[], maxConsecutive = 2): ExploreVentureCard[] {
    const result: ExploreVentureCard[] = []
    const bench: ExploreVentureCard[] = []
    let lastIndustry = ''
    let streak = 0

    for (const item of items) {
      const ind = (item.industry || 'general').toLowerCase()
      if (ind === lastIndustry && streak >= maxConsecutive) {
        bench.push(item)
      } else {
        result.push(item)
        if (ind === lastIndustry) {
          streak++
        } else {
          lastIndustry = ind
          streak = 1
        }
      }
    }

    return [...result, ...bench]
  }

  // HELPERS
  private async getNegativeVentureIds(): Promise<string[]> {
    if (!this.userId) return []
    const { data } = await this.supabase
      .from('explore_negative_signals')
      .select('venture_id')
      .eq('user_id', this.userId)
    return (data || []).map((r: any) => r.venture_id)
  }

  private async getUserDomainAffinities(): Promise<{ domain_slug: string; score: number }[]> {
    if (!this.userId) return []
    const { data } = await this.supabase
      .from('user_domain_affinity')
      .select('domain_slug, score')
      .eq('user_id', this.userId)
      .order('score', { ascending: false })
    return data || []
  }

  private async getFollowedVentureIds(): Promise<Set<string>> {
    if (!this.userId) return new Set()
    const { data } = await this.supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', this.userId)
      .eq('following_type', 'venture')
    return new Set((data || []).map((r: any) => r.following_id))
  }
}