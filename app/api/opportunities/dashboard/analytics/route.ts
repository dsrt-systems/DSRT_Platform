import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const APP_TERMINAL_POSITIVE = ['accepted']
const APP_TERMINAL_NEGATIVE = ['declined', 'withdrawn']
const APP_QUALIFIED = ['under-review', 'shortlisted', 'interview', 'offer', 'accepted']
const APP_SHORTLIST = ['shortlisted', 'interview', 'offer', 'accepted']
const APP_INTERVIEW = ['interview', 'offer', 'accepted']

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const range = sp.get('range') || '30d'
  const opportunityId = sp.get('opportunity_id') // '' or uuid
  const days = rangeToDays(range)
  const sinceDate = new Date(Date.now() - days * 86400000)
  const sinceIso = sinceDate.toISOString()
  const sinceDateStr = sinceIso.slice(0, 10)

  try {
    // Resolve scope (owned + managed)
    const [{ data: owned }, { data: memberships }] = await Promise.all([
      supabase.from('opportunities').select('id, status, view_count, save_count, share_count, published_at, opportunity_type, title, opportunity_number, slug').eq('poster_user_id', user.id),
      supabase.from('opportunity_members').select('opportunity_id').eq('user_id', user.id).in('role', ['owner', 'admin', 'manager', 'reviewer']),
    ])

    const ownedList = owned || []
    const memberIds = new Set((memberships || []).map((m: any) => m.opportunity_id))
    // Fetch member opps too so we can attribute analytics fairly
    const memberOnlyIds = Array.from(memberIds).filter(id => !ownedList.some((o: any) => o.id === id))
    let allOpps = [...ownedList]
    if (memberOnlyIds.length) {
      const { data: mo } = await supabase
        .from('opportunities')
        .select('id, status, view_count, save_count, share_count, published_at, opportunity_type, title, opportunity_number, slug')
        .in('id', memberOnlyIds)
      allOpps = [...allOpps, ...(mo || [])]
    }

    if (allOpps.length === 0) return NextResponse.json(emptyPayload(range))

    // Scope filter
    if (opportunityId) {
      if (!allOpps.some(o => o.id === opportunityId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      allOpps = allOpps.filter(o => o.id === opportunityId)
    }

    const oppIds = allOpps.map(o => o.id)

    // --- Parallel queries ---
    const [
      dailyRes,
      sourceRes,
      appsRes,
      viewsAggRes,
    ] = await Promise.all([
      supabase
        .from('opportunity_daily_metrics')
        .select('*')
        .in('opportunity_id', oppIds)
        .gte('date', sinceDateStr)
        .order('date', { ascending: true }),
      supabase
        .from('opportunity_source_metrics')
        .select('*')
        .in('opportunity_id', oppIds)
        .gte('date', sinceDateStr),
      supabase
        .from('opportunity_applications')
        .select('id, opportunity_id, pipeline_stage, status, created_at, stage_updated_at, first_viewed_at')
        .in('opportunity_id', oppIds)
        .gte('created_at', sinceIso),
      supabase
        .from('opportunity_events')
        .select('opportunity_id, event_type, source, user_id, session_id, created_at')
        .in('opportunity_id', oppIds)
        .gte('created_at', sinceIso)
        .in('event_type', ['opportunity_viewed', 'opportunity_opened', 'apply_clicked', 'application_started', 'application_submitted']),
    ])

    const daily = dailyRes.data || []
    const sources = sourceRes.data || []
    const apps = appsRes.data || []
    const events = viewsAggRes.data || []

    // --- Time series (rolled up across scope) ---
    const seriesMap = new Map<string, any>()
    for (const d of daily) {
      const row = seriesMap.get(d.date) || {
        date: d.date,
        views: 0,
        unique_viewers: 0,
        saves: 0,
        shares: 0,
        apply_clicks: 0,
        applications_started: 0,
        applications_submitted: 0,
        qualified_count: 0,
        shortlisted_count: 0,
        selected_count: 0,
      }
      row.views += d.views || 0
      row.unique_viewers += d.unique_viewers || 0
      row.saves += d.saves || 0
      row.shares += d.shares || 0
      row.apply_clicks += d.apply_clicks || 0
      row.applications_started += d.applications_started || 0
      row.applications_submitted += d.applications_submitted || 0
      row.qualified_count += d.qualified_count || 0
      row.shortlisted_count += d.shortlisted_count || 0
      row.selected_count += d.selected_count || 0
      seriesMap.set(d.date, row)
    }
    const series = fillMissingDays(seriesMap, sinceDate)

    // --- KPIs from events + apps (source of truth in this window) ---
    const viewEvents = events.filter(e => e.event_type === 'opportunity_viewed' || e.event_type === 'opportunity_opened')
    const submittedEvents = events.filter(e => e.event_type === 'application_submitted')
    const startedEvents = events.filter(e => e.event_type === 'application_started')
    const applyClicks = events.filter(e => e.event_type === 'apply_clicked')

    const totalViews = series.reduce((s, r) => s + (r.views || 0), 0) || viewEvents.length
    const uniqueViewers = uniqueCount(viewEvents, (e: any) => e.user_id || e.session_id || `${e.opportunity_id}:${e.created_at}`)
    const totalSaves = series.reduce((s, r) => s + (r.saves || 0), 0)
    const totalShares = series.reduce((s, r) => s + (r.shares || 0), 0)

    const applicationsSubmitted = apps.length || submittedEvents.length
    const applicationsStarted = series.reduce((s, r) => s + (r.applications_started || 0), 0) || startedEvents.length || applicationsSubmitted
    const qualified = apps.filter(a => APP_QUALIFIED.includes(a.pipeline_stage)).length
    const shortlisted = apps.filter(a => APP_SHORTLIST.includes(a.pipeline_stage)).length
    const interviewed = apps.filter(a => APP_INTERVIEW.includes(a.pipeline_stage)).length
    const selected = apps.filter(a => APP_TERMINAL_POSITIVE.includes(a.pipeline_stage)).length
    const rejected = apps.filter(a => a.pipeline_stage === 'declined').length
    const withdrawn = apps.filter(a => a.pipeline_stage === 'withdrawn').length

    const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0)

    // Avg time to apply = avg(created_at - first apply_clicked in same session), best-effort
    const avgTimeToApplyMs = computeAvgTimeToApply(events, apps)

    // --- Funnel ---
    const funnel = {
      views: totalViews,
      unique_viewers: uniqueViewers,
      interested: totalSaves + shortlisted + interviewed + selected + qualified, // "signal of intent"
      apply_clicks: applyClicks.length,
      application_starts: applicationsStarted,
      application_submitted: applicationsSubmitted,
      qualified,
      shortlisted,
      interviewed,
      selected,
    }

    const conversions = {
      view_to_apply_click: pct(funnel.apply_clicks, funnel.views),
      apply_click_to_start: pct(funnel.application_starts, funnel.apply_clicks),
      start_to_submit: pct(funnel.application_submitted, funnel.application_starts),
      submit_to_qualified: pct(funnel.qualified, funnel.application_submitted),
      qualified_to_shortlist: pct(funnel.shortlisted, funnel.qualified),
      shortlist_to_interview: pct(funnel.interviewed, funnel.shortlisted),
      interview_to_selected: pct(funnel.selected, funnel.interviewed),
      view_to_application: pct(funnel.application_submitted, funnel.views),
    }

    // --- KPIs ---
    const kpis = {
      total_views: totalViews,
      unique_viewers: uniqueViewers,
      saves: totalSaves,
      shares: totalShares,
      applications: applicationsSubmitted,
      qualified,
      shortlisted,
      interviewed,
      selected,
      rejected,
      withdrawn,
      application_conversion: conversions.view_to_application,
      qualification_rate: conversions.submit_to_qualified,
      selection_rate: pct(selected, applicationsSubmitted),
      avg_time_to_apply_seconds: avgTimeToApplyMs ? Math.round(avgTimeToApplyMs / 1000) : null,
    }

    // --- Sources aggregate ---
    const sourceAgg = new Map<string, { source: string; views: number; unique_viewers: number; applications: number }>()
    for (const s of sources) {
      const cur = sourceAgg.get(s.source) || { source: s.source, views: 0, unique_viewers: 0, applications: 0 }
      cur.views += s.views || 0
      cur.unique_viewers += s.unique_viewers || 0
      cur.applications += s.applications || 0
      sourceAgg.set(s.source, cur)
    }
    // Enrich with events source in case daily source table lagged
    for (const e of events) {
      const key = e.source || 'direct'
      const cur = sourceAgg.get(key) || { source: key, views: 0, unique_viewers: 0, applications: 0 }
      if (e.event_type === 'opportunity_viewed' || e.event_type === 'opportunity_opened') cur.views += 1
      if (e.event_type === 'application_submitted') cur.applications += 1
      sourceAgg.set(key, cur)
    }
    const sourceRows = Array.from(sourceAgg.values())
      .map(r => ({
        ...r,
        conversion: r.views > 0 ? Math.round((r.applications / r.views) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.views - a.views)

    // --- Per-opportunity breakdown ---
    const perOpp = allOpps.map(o => {
      const oAll = apps.filter(a => a.opportunity_id === o.id)
      const oApp = oAll.length
      const oQ = oAll.filter(a => APP_QUALIFIED.includes(a.pipeline_stage)).length
      const oSel = oAll.filter(a => APP_TERMINAL_POSITIVE.includes(a.pipeline_stage)).length
      const oViews = daily.filter(d => d.opportunity_id === o.id).reduce((s, d) => s + (d.views || 0), 0) || 0
      return {
        id: o.id,
        title: o.title,
        opportunity_number: o.opportunity_number,
        slug: o.slug,
        status: o.status,
        type: o.opportunity_type,
        views: oViews,
        applications: oApp,
        qualified: oQ,
        selected: oSel,
        conversion: oViews > 0 ? Math.round((oApp / oViews) * 1000) / 10 : 0,
      }
    }).sort((a, b) => b.views - a.views)

    // --- Outcomes ---
    const outcomes = {
      selected,
      rejected,
      withdrawn,
      still_open: applicationsSubmitted - selected - rejected - withdrawn,
    }

    return NextResponse.json({
      range,
      days,
      opportunity_id: opportunityId || null,
      scope: {
        total_opportunities: allOpps.length,
        opportunity_ids: oppIds,
      },
      kpis,
      funnel,
      conversions,
      series,
      sources: sourceRows,
      per_opportunity: perOpp,
      outcomes,
    })
  } catch (e: any) {
    console.error('analytics error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

// ------- helpers -------

function rangeToDays(r: string): number {
  if (r === '24h') return 1
  if (r === '7d') return 7
  if (r === '90d') return 90
  if (r === 'ytd') {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    return Math.max(1, Math.ceil((now.getTime() - start.getTime()) / 86400000))
  }
  if (r === 'lifetime') return 3650
  return 30
}

function fillMissingDays(map: Map<string, any>, since: Date) {
  const out: any[] = []
  const cur = new Date(since)
  cur.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  while (cur.getTime() <= now.getTime()) {
    const key = cur.toISOString().slice(0, 10)
    out.push(map.get(key) || {
      date: key,
      views: 0, unique_viewers: 0, saves: 0, shares: 0,
      apply_clicks: 0, applications_started: 0, applications_submitted: 0,
      qualified_count: 0, shortlisted_count: 0, selected_count: 0,
    })
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

function uniqueCount<T>(arr: T[], keyer: (x: T) => string | null | undefined): number {
  const s = new Set<string>()
  for (const x of arr) {
    const k = keyer(x)
    if (k) s.add(k)
  }
  return s.size
}

function computeAvgTimeToApply(events: any[], apps: any[]): number | null {
  if (apps.length === 0) return null

  // Session-based: for each apply_clicked event, look ahead for application_submitted in same session
  const clicks = events.filter(e => e.event_type === 'apply_clicked' && e.session_id)
  const submits = events.filter(e => e.event_type === 'application_submitted' && e.session_id)

  const submitsBySession = new Map<string, string>()
  for (const s of submits) {
    if (!submitsBySession.has(s.session_id)) submitsBySession.set(s.session_id, s.created_at)
  }

  const deltas: number[] = []
  for (const c of clicks) {
    const submitAt = submitsBySession.get(c.session_id)
    if (submitAt) {
      const d = new Date(submitAt).getTime() - new Date(c.created_at).getTime()
      if (d > 0 && d < 60 * 60 * 1000) deltas.push(d)
    }
  }

  if (deltas.length === 0) return null
  return Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
}

function emptyPayload(range: string) {
  return {
    range,
    days: rangeToDays(range),
    opportunity_id: null,
    scope: { total_opportunities: 0, opportunity_ids: [] },
    kpis: {
      total_views: 0, unique_viewers: 0, saves: 0, shares: 0,
      applications: 0, qualified: 0, shortlisted: 0, interviewed: 0, selected: 0,
      rejected: 0, withdrawn: 0,
      application_conversion: 0, qualification_rate: 0, selection_rate: 0,
      avg_time_to_apply_seconds: null,
    },
    funnel: {
      views: 0, unique_viewers: 0, interested: 0, apply_clicks: 0,
      application_starts: 0, application_submitted: 0,
      qualified: 0, shortlisted: 0, interviewed: 0, selected: 0,
    },
    conversions: {
      view_to_apply_click: 0, apply_click_to_start: 0, start_to_submit: 0,
      submit_to_qualified: 0, qualified_to_shortlist: 0, shortlist_to_interview: 0,
      interview_to_selected: 0, view_to_application: 0,
    },
    series: [],
    sources: [],
    per_opportunity: [],
    outcomes: { selected: 0, rejected: 0, withdrawn: 0, still_open: 0 },
  }
}