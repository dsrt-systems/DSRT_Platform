import { SupabaseClient } from '@supabase/supabase-js'
import { ExploreVentureCard, ExploreFeedModule, ExploreFilterState } from './types'
import { parseQuery } from './query-parser'

const PAGE_SIZE = 12

export class VentureExploreEngine {
  constructor(
    private supabase: SupabaseClient, 
    private userId?: string,
    private sessionId?: string,
    private variant: string = 'v1'
  ) {}

  async generateFeed(
    filters: ExploreFilterState = {},
    activeTab: string = 'recommended',
    cursor?: string
  ): Promise<{ modules: ExploreFeedModule[], nextCursor?: string | null }> {
    
    const [negativeVentureIds, userAffinities, sessionAffinities, followedIds, featuredIds] = await Promise.all([
      this.getNegativeVentureIds(),
      this.getUserDomainAffinities(),
      this.getSessionAffinities(),
      this.getFollowedVentureIds(),
      this.getFeaturedVentureIds()
    ])

    const cursorData = this.parseCursor(cursor)
    const pageDepth = cursorData?.depth || 0  // How deep we've paged into the recycled catalog
    const seenIds = cursorData?.seen || []    // IDs already shown this session

    // Fetch ALL relevant ventures (not paginated)
    let query = this.supabase
      .from('ventures')
      .select(`
        id, slug, name, tagline, description, logo_url, cover_url,
        stage, status, industry, sector, sub_category, location, venture_type, business_model, funding_stage,
        team_size, follower_count, view_count, is_verified, is_hiring,
        seeking_investment, seeking_cofounder, last_activity_at, created_at,
        discovery_rank_seed,
        founder:users!ventures_founder_id_fkey(id, full_name, username, avatar_url),
        user_id,
        trending:venture_trending_scores(bayesian_score, growth_rate)
      `)
      .neq('status', 'archived')

    if (negativeVentureIds.length > 0) {
      query = query.not('id', 'in', `(${negativeVentureIds.join(',')})`)
    }

    // === SEMANTIC SEARCH ===
    if (filters.search) {
      const parsed = parseQuery(filters.search)
      if (parsed.stage && !filters.stages?.includes(parsed.stage)) filters.stages = [...(filters.stages || []), parsed.stage]
      if (parsed.location && !filters.locations?.includes(parsed.location)) filters.locations = [...(filters.locations || []), parsed.location]
      if (parsed.domains.length > 0) filters.domains = [...new Set([...(filters.domains || []), ...parsed.domains])]
      if (parsed.is_hiring) filters.is_hiring = true

      if (parsed.keywords.length > 0) {
        const kFilters = parsed.keywords.map(k => `name.ilike.%${k}%,tagline.ilike.%${k}%,description.ilike.%${k}%`).join(',')
        query = query.or(kFilters)
      }
    }

    // === FILTERS ===
    if (filters.domains && filters.domains.length > 0) {
      const domainFilter = filters.domains.map(d => `industry.ilike.%${d}%,sector.ilike.%${d}%,sub_category.ilike.%${d}%`).join(',')
      query = query.or(domainFilter)
    }
    if (filters.stages && filters.stages.length > 0) query = query.in('stage', filters.stages)
    if (filters.locations && filters.locations.length > 0) query = query.or(filters.locations.map(l => `location.ilike.%${l}%`).join(','))
    if (filters.venture_types && filters.venture_types.length > 0) query = query.in('venture_type', filters.venture_types)
    if (filters.business_models && filters.business_models.length > 0) query = query.in('business_model', filters.business_models)
    if (filters.funding_stages && filters.funding_stages.length > 0) query = query.in('funding_stage', filters.funding_stages)

    if (filters.team_sizes && filters.team_sizes.length > 0) {
      const teamConditions: string[] = []
      for (const size of filters.team_sizes) {
        if (size === 'solo') teamConditions.push('team_size.eq.1')
        else if (size === '2-5') teamConditions.push('and(team_size.gte.2,team_size.lte.5)')
        else if (size === '6-10') teamConditions.push('and(team_size.gte.6,team_size.lte.10)')
        else if (size === '11-25') teamConditions.push('and(team_size.gte.11,team_size.lte.25)')
        else if (size === '26-50') teamConditions.push('and(team_size.gte.26,team_size.lte.50)')
        else if (size === '51-100') teamConditions.push('and(team_size.gte.51,team_size.lte.100)')
        else if (size === '100+') teamConditions.push('team_size.gt.100')
      }
      if (teamConditions.length > 0) query = query.or(teamConditions.join(','))
    }

    if (filters.is_verified) query = query.eq('is_verified', true)
    if (filters.is_seeking_investment) query = query.eq('seeking_investment', true)
    if (filters.is_seeking_cofounder) query = query.eq('seeking_cofounder', true)

    if (filters.is_newly_launched) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', thirtyDaysAgo)
    }

    if (filters.is_hiring) {
      const { data: hiringRoles } = await this.supabase.from('team_up_requests').select('venture_id').eq('status', 'published').not('venture_id', 'is', null)
      const hiringVentureIds = [...new Set((hiringRoles || []).map(r => r.venture_id))]
      if (hiringVentureIds.length > 0) query = query.in('id', hiringVentureIds)
      else return { modules: [], nextCursor: null }
    }

    // Fetch a broad candidate pool — up to 500
    const { data: rawCandidates, error } = await query
      .order('discovery_rank_seed', { ascending: true })
      .limit(500)

    if (error || !rawCandidates || rawCandidates.length === 0) {
      return { modules: [], nextCursor: null }
    }

    const allCandidates: ExploreVentureCard[] = rawCandidates.map((v: any) => ({
      ...v,
      is_following: followedIds.has(v.id),
      domains: [v.industry, v.sector, v.sub_category].filter(Boolean) as string[],
      _bayesian: v.trending?.[0]?.bayesian_score || 0,
      _growth: v.trending?.[0]?.growth_rate || 0,
    }))

    // === RANK ALL CANDIDATES ONCE ===
    const sortMode = filters.sort || (activeTab === 'all' ? 'recommended' : (activeTab === 'rising' ? 'rising' : activeTab === 'new' ? 'newest' : 'recommended'))
    const rankedAll = this.sortCatalog(allCandidates, sortMode, userAffinities, sessionAffinities)

    // === RECYCLE PAGING: Never end ===
    // If pageDepth > 0, we're recycling. Filter to items not-yet-shown, or if all shown, reshuffle with relevance decay
    let pageItems: ExploreVentureCard[]
    
    if (pageDepth === 0) {
      // First page — take from the top
      pageItems = rankedAll.slice(0, PAGE_SIZE)
    } else {
      // Later pages — filter out seen items
      const seenSet = new Set(seenIds)
      const unseen = rankedAll.filter(v => !seenSet.has(v.id))

      if (unseen.length >= PAGE_SIZE) {
        pageItems = unseen.slice(0, PAGE_SIZE)
      } else {
        // Recycled — mix unseen + reshuffled old items with relevance decay
        const decayed = this.applyRelevanceDecay(rankedAll, pageDepth, seenSet)
        pageItems = [...unseen, ...decayed].slice(0, PAGE_SIZE)
      }
    }

    // Build reason labels contextually based on what module this is
    if (activeTab === 'rising') {
      pageItems = pageItems.map(v => ({ ...v, reason_code: 'RISING', reason_label: 'Rising momentum' }))
    } else if (activeTab === 'new') {
      pageItems = pageItems.map(v => ({ ...v, reason_code: 'NEW', reason_label: 'Newly launched' }))
    }

    // Build the next cursor with tracking
    const newSeenIds = [...seenIds, ...pageItems.map(p => p.id)].slice(-200) // Keep last 200 seen
    const nextCursor = this.encodeCursor({ depth: pageDepth + 1, seen: newSeenIds })

    // === TAB-SPECIFIC RESPONSE ===
    
    // For paginated/filtered/tab pages — return single catalog module
    if (this.isFiltered(filters) || activeTab !== 'recommended' || pageDepth > 0) {
      const moduleTitle = pageDepth === 0 ? this.getModuleTitle(activeTab, filters) : ''
      return {
        modules: [{
          id: `catalog-${pageDepth}`,
          type: 'catalog',
          title: moduleTitle,
          subtitle: pageDepth === 0 ? this.getModuleSubtitle(activeTab) : undefined,
          items: pageItems
        }],
        nextCursor
      }
    }

    // === RECOMMENDED (INITIAL LOAD) — MULTI-MODULE ===
    const modules: ExploreFeedModule[] = []

    // 1. Editorial Featured
    const featuredItems = allCandidates.filter(c => featuredIds.has(c.id)).slice(0, 4)
    if (featuredItems.length > 0) {
      modules.push({
        id: 'editorial-mod',
        type: 'editorial',
        title: 'Featured by DSRT',
        items: featuredItems.map(v => ({ ...v, reason_label: 'Editor Pick' }))
      })
    }

    // 2. Recommended (MMR ranked)
    const recommendedItems = rankedAll
      .filter(v => !featuredIds.has(v.id))
      .slice(0, 8)
    if (recommendedItems.length > 0) {
      modules.push({
        id: 'recommended-mod',
        type: 'recommended',
        title: 'Recommended for you',
        subtitle: 'Curated based on your interests and activity',
        items: recommendedItems
      })
    }

    // 3. Rising (uses growth_rate from DB)
    const risingItems = [...allCandidates]
      .filter(c => !featuredIds.has(c.id))
      .sort((a: any, b: any) => b._growth - a._growth)
      .slice(0, 8)
      .map(v => ({ ...v, reason_code: 'RISING', reason_label: 'Rising in momentum' }))

    if (risingItems.length > 0) {
      modules.push({
        id: 'rising-mod',
        type: 'rising',
        title: 'Rising across DSRT',
        items: risingItems,
        see_all_href: '?vtab=rising'
      })
    }

    // 4. Because you explore [domain]
    const topAffinity = sessionAffinities[0] || userAffinities[0]
    if (topAffinity) {
      const affinityDomain = topAffinity.domain_slug
      const domainItems = allCandidates
        .filter(v => v.domains?.some(d => d.toLowerCase().includes(affinityDomain.toLowerCase())))
        .slice(0, 8)
        .map(v => ({ ...v, reason_code: 'DOMAIN_AFFINITY', reason_label: `Because you explore ${affinityDomain}` }))

      if (domainItems.length > 0) {
        modules.push({
          id: 'affinity-mod',
          type: 'domain_affinity',
          title: `Because you explore ${affinityDomain}`,
          items: domainItems,
          see_all_href: `?domain=${encodeURIComponent(affinityDomain)}`
        })
      }
    }

    // Track seen items for infinite scroll continuation
    const initialSeenIds = modules.flatMap(m => m.items.map(i => i.id))
    const initialCursor = this.encodeCursor({ depth: 1, seen: initialSeenIds })

    return { modules, nextCursor: initialCursor }
  }

  private getModuleTitle(activeTab: string, filters: ExploreFilterState): string {
    if (filters.search) return `Results for "${filters.search}"`
    if (activeTab === 'rising') return 'Rising across DSRT'
    if (activeTab === 'new') return 'New ventures'
    if (activeTab === 'all') return 'All Ventures'
    return ''
  }

  private getModuleSubtitle(activeTab: string): string | undefined {
    if (activeTab === 'rising') return 'Ranked by engagement growth'
    if (activeTab === 'new') return 'Recently launched on DSRT'
    return undefined
  }

  // === RELEVANCE DECAY (YouTube-style continuous scroll) ===
  private applyRelevanceDecay(
    allRanked: ExploreVentureCard[],
    depth: number,
    seenSet: Set<string>
  ): ExploreVentureCard[] {
    // On deeper pages, reshuffle less-relevant items with higher randomness
    const decayFactor = Math.max(0.3, 1 - (depth * 0.15))
    
    const pool = allRanked.map(v => {
      const originalScore = (v as any)._score || 0
      const decayedScore = originalScore * decayFactor + (Math.random() * (1 - decayFactor) * 20)
      return { ...v, _score: decayedScore }
    })

    // Shuffle to prevent identical results
    return pool
      .sort((a: any, b: any) => b._score - a._score)
      .filter(v => !seenSet.has(v.id))
  }

  // === TRUE MMR DIVERSIFICATION RANKING ===
  private rankCandidatesMMR(
    candidates: ExploreVentureCard[], 
    affinities: { domain_slug: string; score: number }[],
    sessionAffinities: { domain_slug: string; score: number }[]
  ): ExploreVentureCard[] {
    const affinityMap = new Map(affinities.map(a => [a.domain_slug.toLowerCase(), a.score]))
    const sessionMap = new Map(sessionAffinities.map(a => [a.domain_slug.toLowerCase(), a.score]))

    const isV2 = this.variant === 'venture-explore-v2'
    const domainWeight = isV2 ? 3 : 5
    const sessionBoostWeight = isV2 ? 10 : 5
    const bayesianWeight = isV2 ? 4 : 2
    const mmrLambda = isV2 ? 0.6 : 0.75

    const scored = candidates.map(v => {
      let score = 0
      const reasons: string[] = []

      const domScore = (v.domains || []).reduce((acc, d) => acc + (affinityMap.get(d.toLowerCase()) || 0), 0)
      if (domScore > 0) {
        score += domScore * domainWeight
        reasons.push(`Because you explore ${v.domains?.[0]}`)
      }

      const sessScore = (v.domains || []).reduce((acc, d) => acc + (sessionMap.get(d.toLowerCase()) || 0), 0)
      if (sessScore > 0) {
        score += sessScore * sessionBoostWeight
        reasons.unshift(`Based on your recent activity`)
      }

      score += (v as any)._bayesian * bayesianWeight

      if (v.is_verified) score += 15
      
      const hoursAgo = (Date.now() - new Date(v.last_activity_at || v.created_at || Date.now()).getTime()) / 3600000
      score += Math.max(0, 20 - (hoursAgo / 24))

      return {
        ...v,
        _score: score,
        reason_label: reasons[0] || (v.is_verified ? 'Verified' : undefined)
      }
    })

    // MMR Selection
    const unselected = [...scored]
    const selected: typeof scored = []

    unselected.sort((a, b) => b._score! - a._score!)
    if (unselected.length > 0) selected.push(unselected.shift()!)

    while (unselected.length > 0) {
      let bestIdx = 0
      let bestMMR = -Infinity

      for (let i = 0; i < unselected.length; i++) {
        const candidate = unselected[i]
        
        let maxSim = 0
        for (const s of selected) {
          const sharedDomains = candidate.domains?.filter(d => s.domains?.includes(d)) || []
          let sim = (sharedDomains.length > 0) ? 0.8 : 0
          if (candidate.stage === s.stage) sim += 0.2
          if (sim > maxSim) maxSim = sim
        }

        const mmr = (mmrLambda * candidate._score!) - ((1 - mmrLambda) * maxSim * 50)
        
        if (mmr > bestMMR) {
          bestMMR = mmr
          bestIdx = i
        }
      }

      selected.push(unselected[bestIdx])
      unselected.splice(bestIdx, 1)
    }

    return selected
  }

  private sortCatalog(c: ExploreVentureCard[], m: string, a: any[], sa: any[]) {
    if (m === 'newest') return [...c].sort((x, y) => new Date(y.created_at || 0).getTime() - new Date(x.created_at || 0).getTime())
    if (m === 'updated') return [...c].sort((x, y) => new Date(y.last_activity_at || 0).getTime() - new Date(x.last_activity_at || 0).getTime())
    if (m === 'most_followed') return [...c].sort((x, y) => (y.follower_count || 0) - (x.follower_count || 0))
    if (m === 'rising') return [...c].sort((x: any, y: any) => y._growth - x._growth)
    return this.rankCandidatesMMR(c, a, sa)
  }

  private isFiltered(f: ExploreFilterState): boolean {
    return !!(f.search || f.domains?.length || f.stages?.length || f.locations?.length || f.venture_types?.length || f.business_models?.length || f.team_sizes?.length || f.funding_stages?.length || f.is_verified || f.is_hiring || f.is_seeking_investment || f.is_seeking_cofounder || f.is_newly_launched)
  }
  
  private parseCursor(c?: string): { depth: number; seen: string[] } | null {
    if (!c) return null
    try {
      const decoded = JSON.parse(Buffer.from(c, 'base64').toString('utf-8'))
      return { depth: decoded.depth || 0, seen: decoded.seen || [] }
    } catch { return null }
  }

  private encodeCursor(d: { depth: number; seen: string[] }): string {
    return Buffer.from(JSON.stringify(d), 'utf-8').toString('base64')
  }
  
  private async getNegativeVentureIds() {
    if (!this.userId) return []
    const { data } = await this.supabase.from('explore_negative_signals').select('venture_id').eq('user_id', this.userId)
    return (data || []).map((r: any) => r.venture_id)
  }
  
  private async getUserDomainAffinities() {
    if (!this.userId) return []
    const { data } = await this.supabase.from('user_domain_affinity').select('domain_slug, score').eq('user_id', this.userId).order('score', { ascending: false }).limit(20)
    return data || []
  }

  private async getSessionAffinities() {
    if (!this.sessionId) return []
    const { data } = await this.supabase
      .from('explore_interactions')
      .select('domain_slugs, weight')
      .eq('session_id', this.sessionId)
      .gt('created_at', new Date(Date.now() - 2 * 3600000).toISOString())
    
    if (!data) return []
    const agg = new Map<string, number>()
    data.forEach(r => {
      (r.domain_slugs || []).forEach((d: string) => {
        const k = d.toLowerCase()
        agg.set(k, (agg.get(k) || 0) + r.weight)
      })
    })
    return Array.from(agg.entries())
      .map(([domain_slug, score]) => ({ domain_slug, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }

  private async getFollowedVentureIds() {
    if (!this.userId) return new Set<string>()
    const { data } = await this.supabase.from('follows').select('following_id').eq('follower_id', this.userId).eq('following_type', 'venture')
    return new Set((data || []).map((r: any) => r.following_id))
  }

  private async getFeaturedVentureIds() {
    const { data } = await this.supabase.from('explore_featured_ventures').select('venture_id').eq('is_active', true)
    return new Set((data || []).map((r: any) => r.venture_id))
  }
}