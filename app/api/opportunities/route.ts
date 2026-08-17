import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/opportunities
 * Query params:
 *   type              - hire | freelance | team-up | mentorship | etc
 *   category          - category slug
 *   subcategory       - subcategory slug
 *   experience        - entry | intermediate | expert | ...
 *   compensation      - hourly | fixed-price | equity | unpaid | ...
 *   work_mode         - remote | hybrid | on-site
 *   location          - text search
 *   skills            - comma-separated
 *   time_commitment   - less-than-5 | 5-10 | etc
 *   project_length    - one-off | 1-3-months | etc
 *   min_budget        - number
 *   max_budget        - number
 *   post_age          - today | last-3-days | last-week | last-month
 *   q                 - search query
 *   sort              - recommended | newest | recently-updated | most-active | ending-soon | fewest-applications
 *   limit             - default 24, max 60
 *   offset            - default 0
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { searchParams } = new URL(req.url)

  const type = searchParams.get('type')
  const categorySlug = searchParams.get('category')
  const subcategorySlug = searchParams.get('subcategory')
  const experience = searchParams.get('experience')
  const compensationType = searchParams.get('compensation')
  const workMode = searchParams.get('work_mode')
  const location = searchParams.get('location')
  const skillsParam = searchParams.get('skills')
  const timeCommitment = searchParams.get('time_commitment')
  const projectLength = searchParams.get('project_length')
  const minBudget = searchParams.get('min_budget')
  const maxBudget = searchParams.get('max_budget')
  const postAge = searchParams.get('post_age')
  const q = searchParams.get('q')?.trim()
  const sort = searchParams.get('sort') || 'newest'
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 60)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

  try {
    let query = supabase
      .from('opportunities')
      .select('*', { count: 'exact' })
      .eq('visibility', 'public')
      .in('status', ['active', 'closing-soon'])

    // Type filter
    if (type && type !== 'all') {
      query = query.eq('opportunity_type', type)
    }

    // Category filter (resolve slug → id)
    if (categorySlug && categorySlug !== 'all') {
      const { data: cat } = await supabase
        .from('opportunity_categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()
      if (cat) {
        query = query.or(`primary_category_id.eq.${cat.id},subcategory_id.eq.${cat.id}`)
      }
    }

    if (subcategorySlug) {
      const { data: sub } = await supabase
        .from('opportunity_categories')
        .select('id')
        .eq('slug', subcategorySlug)
        .single()
      if (sub) {
        query = query.eq('subcategory_id', sub.id)
      }
    }

    if (experience && experience !== 'any') {
      query = query.eq('experience_level', experience)
    }

    if (compensationType) {
      query = query.eq('compensation_type', compensationType)
    }

    if (workMode && workMode !== 'flexible') {
      query = query.eq('work_mode', workMode)
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    if (timeCommitment) {
      query = query.eq('time_commitment', timeCommitment)
    }

    if (projectLength) {
      query = query.eq('project_length', projectLength)
    }

    if (skillsParam) {
      const skills = skillsParam.split(',').filter(Boolean)
      if (skills.length > 0) {
        query = query.overlaps('required_skills', skills)
      }
    }

    if (minBudget) {
      query = query.gte('compensation_min', parseInt(minBudget))
    }

    if (maxBudget) {
      query = query.lte('compensation_max', parseInt(maxBudget))
    }

    if (postAge) {
      const ageMap: Record<string, string> = {
        'today': '1 day',
        'last-3-days': '3 days',
        'last-week': '7 days',
        'last-month': '30 days',
      }
      const interval = ageMap[postAge]
      if (interval) {
        const cutoff = new Date(Date.now() - parseInt(interval) * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('published_at', cutoff)
      }
    }

    // Text search via search_vector
    if (q && q.length >= 2) {
      // Use PostgREST websearch for user-friendly search
      query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' })
    }

    // Sort
    switch (sort) {
      case 'newest':
        query = query.order('published_at', { ascending: false, nullsFirst: false })
        break
      case 'recently-updated':
        query = query.order('last_activity_at', { ascending: false, nullsFirst: false })
        break
      case 'most-active':
        query = query.order('application_count', { ascending: false })
        break
      case 'ending-soon':
        query = query.order('application_deadline', { ascending: true, nullsFirst: false })
        break
      case 'fewest-applications':
        query = query.order('application_count', { ascending: true })
        break
      case 'highest-budget':
        query = query.order('compensation_max', { ascending: false, nullsFirst: false })
        break
      case 'lowest-budget':
        query = query.order('compensation_min', { ascending: true, nullsFirst: false })
        break
      case 'recommended':
      default:
        query = query.order('is_featured', { ascending: false })
                     .order('published_at', { ascending: false, nullsFirst: false })
        break
    }

    const { data: opportunities, count, error } = await query.range(offset, offset + limit - 1)
    if (error) throw error

    const items = opportunities || []

    // Enrich with poster + context (project/venture)
    const posterIds = [...new Set(items.map(i => i.poster_user_id).filter(Boolean))]
    const projectIds = [...new Set(items.map(i => i.project_id).filter(Boolean))]
    const ventureIds = [...new Set(items.map(i => i.venture_id).filter(Boolean))]
    const categoryIds = [...new Set(items.flatMap(i => [i.primary_category_id, i.subcategory_id]).filter(Boolean))]

    const [postersRes, projectsRes, venturesRes, categoriesRes] = await Promise.all([
      posterIds.length ? supabase.from('users').select('id, username, full_name, avatar_url, is_verified, tagline').in('id', posterIds) : { data: [] },
      projectIds.length ? supabase.from('projects').select('id, slug, name, tagline, icon, cover_image_url').in('id', projectIds) : { data: [] },
      ventureIds.length ? supabase.from('ventures').select('id, slug, name, tagline, logo_url').in('id', ventureIds) : { data: [] },
      categoryIds.length ? supabase.from('opportunity_categories').select('id, name, slug, icon').in('id', categoryIds) : { data: [] },
    ])

    const posterMap = new Map((postersRes.data || []).map((p: any) => [p.id, p]))
    const projectMap = new Map((projectsRes.data || []).map((p: any) => [p.id, p]))
    const ventureMap = new Map((venturesRes.data || []).map((v: any) => [v.id, v]))
    const categoryMap = new Map((categoriesRes.data || []).map((c: any) => [c.id, c]))

    // If user is authenticated, check which they've saved
    let savedSet = new Set<string>()
    let appliedSet = new Set<string>()
    if (user && items.length > 0) {
      const oppIds = items.map(i => i.id)
      const [savesRes, appsRes] = await Promise.all([
        supabase.from('opportunity_saves')
          .select('opportunity_id')
          .eq('user_id', user.id)
          .in('opportunity_id', oppIds),
        supabase.from('opportunity_applications')
          .select('opportunity_id')
          .eq('applicant_id', user.id)
          .in('opportunity_id', oppIds),
      ])
      savedSet = new Set((savesRes.data || []).map((s: any) => s.opportunity_id))
      appliedSet = new Set((appsRes.data || []).map((a: any) => a.opportunity_id))
    }

    const enriched = items.map(item => ({
      ...item,
      poster: posterMap.get(item.poster_user_id) || null,
      project: item.project_id ? projectMap.get(item.project_id) || null : null,
      venture: item.venture_id ? ventureMap.get(item.venture_id) || null : null,
      primary_category: item.primary_category_id ? categoryMap.get(item.primary_category_id) || null : null,
      subcategory: item.subcategory_id ? categoryMap.get(item.subcategory_id) || null : null,
      is_saved: savedSet.has(item.id),
      has_applied: appliedSet.has(item.id),
    }))

    return NextResponse.json({
      opportunities: enriched,
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    })
  } catch (e: any) {
    console.error('Opportunities list error:', e)
    return NextResponse.json({ error: e?.message, opportunities: [], total: 0 }, { status: 500 })
  }
}

/**
 * POST /api/opportunities
 * Create a new opportunity (draft or published)
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  const {
    poster_context = 'personal',
    project_id, venture_id, organization_id, community_id,
    opportunity_type = 'hire',
    title, subtitle, description,
    content_blocks, content_html, content_text,
    primary_category_id, subcategory_id,
    required_skills = [], preferred_skills = [],
    experience_level,
    compensation_type = 'unpaid',
    compensation_min, compensation_max,
    compensation_currency = 'USD', compensation_period,
    equity_min, equity_max,
    compensation_hidden = false, compensation_negotiable = false,
    project_length, time_commitment,
    hours_per_week, duration,
    start_date, application_deadline,
    work_mode = 'remote', location, timezone,
    team_context, role_purpose = [],
    positions_open = 1,
    allow_multiple_applications = false, allow_withdrawal = true,
    max_applications, auto_close_after_deadline = true,
    require_resume = false, require_portfolio = false,
    require_github = false, require_website = false,
    require_cover_letter = true,
    custom_questions = [],
    visibility = 'public',
    show_applicant_count = true, show_poster_identity = true,
    show_compensation = true, show_location = true,
    cover_image_url,
    status = 'draft',
    urgency = 'normal',
  } = body

  if (!title || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  // Verify context ownership
  if (poster_context === 'project' && project_id) {
    const { data: proj } = await supabase.from('projects')
      .select('founder_id, user_id').eq('id', project_id).single()
    if (!proj || (proj.founder_id !== user.id && proj.user_id !== user.id)) {
      return NextResponse.json({ error: 'Not authorized to post for this project' }, { status: 403 })
    }
  }
  if (poster_context === 'venture' && venture_id) {
    const { data: vent } = await supabase.from('ventures')
      .select('founder_id, user_id').eq('id', venture_id).single()
    if (!vent || (vent.founder_id !== user.id && vent.user_id !== user.id)) {
      return NextResponse.json({ error: 'Not authorized to post for this venture' }, { status: 403 })
    }
  }

  try {
    const insertData: any = {
      poster_user_id: user.id,
      poster_context,
      project_id: poster_context === 'project' ? project_id : null,
      venture_id: poster_context === 'venture' ? venture_id : null,
      organization_id: poster_context === 'organization' ? organization_id : null,
      community_id: poster_context === 'community' ? community_id : null,
      opportunity_type,
      title: title.trim().slice(0, 250),
      subtitle: subtitle?.trim().slice(0, 500) || null,
      description: description?.trim() || null,
      content_blocks: content_blocks || [],
      content_html: content_html || null,
      content_text: content_text || null,
      primary_category_id, subcategory_id,
      required_skills, preferred_skills,
      experience_level,
      compensation_type,
      compensation_min, compensation_max,
      compensation_currency, compensation_period,
      equity_min, equity_max,
      compensation_hidden, compensation_negotiable,
      project_length, time_commitment,
      hours_per_week, duration,
      start_date, application_deadline,
      work_mode, location, timezone,
      team_context, role_purpose,
      positions_open,
      allow_multiple_applications, allow_withdrawal,
      max_applications, auto_close_after_deadline,
      require_resume, require_portfolio,
      require_github, require_website, require_cover_letter,
      custom_questions,
      visibility,
      show_applicant_count, show_poster_identity,
      show_compensation, show_location,
      cover_image_url,
      status,
      urgency,
      published_at: status === 'active' ? new Date().toISOString() : null,
    }

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ opportunity }, { status: 201 })
  } catch (e: any) {
    console.error('Create opportunity error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}