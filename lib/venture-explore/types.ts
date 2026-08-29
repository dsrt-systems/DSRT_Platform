export interface ExploreVentureCard {
  id: string
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  logo_url?: string | null
  cover_url?: string | null
  stage?: string | null
  status?: string | null
  industry?: string | null
  sector?: string | null
  location?: string | null
  venture_type?: string | null
  business_model?: string | null
  team_size?: number | null
  follower_count?: number | null
  view_count?: number | null
  is_verified?: boolean
  is_hiring?: boolean
  seeking_investment?: boolean
  seeking_cofounder?: boolean
  last_activity_at?: string
  created_at?: string
  founder?: {
    id: string
    full_name: string
    username: string
    avatar_url?: string | null
  } | null
  domains?: string[]
  open_roles_count?: number
  reason_code?: string
  reason_label?: string
  is_following?: boolean
}

export interface ExploreFeedModule {
  id: string
  type: 'recommended' | 'rising' | 'domain_affinity' | 'new_and_notable' | 'catalog'
  title: string
  subtitle?: string
  reason?: string
  items: ExploreVentureCard[]
}

export interface ExploreFeedResponse {
  modules: ExploreFeedModule[]
  next_cursor?: string | null
  total_candidates?: number
}

export interface ExploreFilterState {
  search?: string
  domains?: string[]
  stages?: string[]
  locations?: string[]
  venture_types?: string[]
  business_models?: string[]
  team_sizes?: string[]
  funding_stages?: string[]
  is_verified?: boolean
  is_hiring?: boolean
  sort?: 'recommended' | 'rising' | 'newest' | 'updated' | 'followers'
}