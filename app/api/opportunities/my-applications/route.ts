import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const STATUS_DESCRIPTIONS: Record<string, string> = {
  draft: 'You started this application but haven\'t submitted it yet.',
  submitted: 'Your application has been received and is waiting to be reviewed.',
  'under-review': 'Your application is currently being reviewed by the team.',
  shortlisted: 'You\'ve moved forward in the selection process.',
  interview: 'The team wants to speak with you about this opportunity.',
  offer: 'You\'ve received an offer for this opportunity.',
  accepted: 'You\'ve been selected for this opportunity.',
  declined: 'This opportunity has moved forward with other applicants.',
  withdrawn: 'You withdrew this application.',
}

const WITHDRAWABLE_STAGES = new Set(['submitted', 'under-review', 'shortlisted', 'interview'])

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const filter = sp.get('filter') || 'all'
  const search = sp.get('search')?.trim() || ''
  const sort = sp.get('sort') || 'recent_activity'
  const cursor = sp.get('cursor')
  const limit = Math.min(parseInt(sp.get('limit') || '20', 10), 50)

  try {
    // 1. Build query
    let query = supabase
      .from('opportunity_applications')
      .select('*')
      .eq('applicant_id', user.id)

    // Filters
    if (filter === 'active') query = query.in('pipeline_stage', ['submitted', 'under-review', 'shortlisted', 'interview'])
    else if (filter === 'shortlisted') query = query.eq('pipeline_stage', 'shortlisted')
    else if (filter === 'interviews') query = query.eq('pipeline_stage', 'interview')
    else if (filter === 'offers') query = query.eq('pipeline_stage', 'offer')
    else if (filter === 'completed') query = query.in('pipeline_stage', ['accepted', 'declined'])
    else if (filter === 'withdrawn') query = query.eq('pipeline_stage', 'withdrawn')
    else if (filter === 'drafts') query = query.eq('pipeline_stage', 'draft')

    // Sort
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true })
      if (cursor) query = query.gt('created_at', cursor)
    } else if (sort === 'recently_applied') {
      query = query.order('created_at', { ascending: false })
      if (cursor) query = query.lt('created_at', cursor)
    } else if (sort === 'title') {
      query = query.order('created_at', { ascending: false })
    } else {
      // recent_activity (default)
      query = query.order('stage_updated_at', { ascending: false, nullsFirst: false })
      if (cursor) query = query.lt('stage_updated_at', cursor)
    }

    query = query.limit(limit + 1)

    const { data: apps, error } = await query
    if (error) throw error

    const items = apps || []
    const hasMore = items.length > limit
    const trimmed = hasMore ? items.slice(0, limit) : items

    // 2. Stats (always compute from full set, not paginated)
    const { data: allApps } = await supabase
      .from('opportunity_applications')
      .select('id, pipeline_stage')
      .eq('applicant_id', user.id)

    const all = allApps || []
    const stats = {
      total: all.length,
      active: all.filter(a => ['submitted', 'under-review', 'shortlisted', 'interview'].includes(a.pipeline_stage)).length,
      reviewing: all.filter(a => ['submitted', 'under-review'].includes(a.pipeline_stage)).length,
      shortlisted: all.filter(a => a.pipeline_stage === 'shortlisted').length,
      interviews: all.filter(a => a.pipeline_stage === 'interview').length,
      offers: all.filter(a => a.pipeline_stage === 'offer').length,
      selected: all.filter(a => a.pipeline_stage === 'accepted').length,
      rejected: all.filter(a => a.pipeline_stage === 'declined').length,
      withdrawn: all.filter(a => a.pipeline_stage === 'withdrawn').length,
      drafts: all.filter(a => a.pipeline_stage === 'draft').length,
    }

    // 3. Enrich opportunities
    const oppIds = [...new Set(trimmed.map(a => a.opportunity_id))]
    const { data: opps } = oppIds.length
      ? await supabase.from('opportunities').select('id, slug, title, opportunity_number, opportunity_type, status, cover_image_url, poster_user_id, project_id, venture_id').in('id', oppIds)
      : { data: [] }

    const oppMap = new Map((opps || []).map((o: any) => [o.id, o]))

    const projectIds = [...new Set((opps || []).map(o => o.project_id).filter(Boolean))]
    const ventureIds = [...new Set((opps || []).map(o => o.venture_id).filter(Boolean))]

    const [projectsRes, venturesRes] = await Promise.all([
      projectIds.length ? supabase.from('projects').select('id, name, icon').in('id', projectIds) : { data: [] },
      ventureIds.length ? supabase.from('ventures').select('id, name, logo_url').in('id', ventureIds) : { data: [] }
    ])

    const projectMap = new Map((projectsRes.data || []).map((p: any) => [p.id, p]))
    const ventureMap = new Map((venturesRes.data || []).map((v: any) => [v.id, v]))

    // 4. Unread messages
    const appIds = trimmed.map(a => a.id)
    const { data: messages } = appIds.length
      ? await supabase.from('inbox_messages')
          .select('metadata')
          .eq('recipient_id', user.id)
          .eq('status', 'unread')
          .eq('reference_type', 'opportunity')
      : { data: [] }

    const unreadMap = new Map<string, number>()
    for (const m of (messages || [])) {
      const aId = m.metadata?.opportunity_application_id
      if (aId) unreadMap.set(aId, (unreadMap.get(aId) || 0) + 1)
    }

    // 5. Search filter (post-enrichment, since we search by opp title)
    let enriched = trimmed.map(app => {
      const opp = oppMap.get(app.opportunity_id)
      if (opp) {
        opp.project = opp.project_id ? projectMap.get(opp.project_id) : null
        opp.venture = opp.venture_id ? ventureMap.get(opp.venture_id) : null
      }
      return {
        ...app,
        opportunity: opp || null,
        unread_messages: unreadMap.get(app.id) || 0,
        status_description: STATUS_DESCRIPTIONS[app.pipeline_stage] || '',
        withdrawable: WITHDRAWABLE_STAGES.has(app.pipeline_stage),
        capabilities: {
          can_withdraw: WITHDRAWABLE_STAGES.has(app.pipeline_stage),
          can_edit: app.pipeline_stage === 'draft',
          can_reapply: app.pipeline_stage === 'withdrawn',
        },
      }
    })

    if (search) {
      const s = search.toLowerCase()
      enriched = enriched.filter(a => {
        const title = (a.opportunity?.title || '').toLowerCase()
        const project = (a.opportunity?.project?.name || '').toLowerCase()
        const venture = (a.opportunity?.venture?.name || '').toLowerCase()
        return title.includes(s) || project.includes(s) || venture.includes(s)
      })
    }

    // Sort by title if requested (post-enrichment)
    if (sort === 'title') {
      enriched.sort((a, b) => (a.opportunity?.title || '').localeCompare(b.opportunity?.title || ''))
    }

    // Cursor for next page
    const nextCursor = hasMore
      ? sort === 'oldest' || sort === 'recently_applied'
        ? trimmed[trimmed.length - 1]?.created_at
        : trimmed[trimmed.length - 1]?.stage_updated_at
      : null

    return NextResponse.json({ applications: enriched, stats, next_cursor: nextCursor, has_more: hasMore })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, applications: [], stats: {} }, { status: 500 })
  }
}