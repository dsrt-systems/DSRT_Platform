import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/opportunities/[id]/applicants
 * Poster views all applicants for their opportunity
 * Query params: ?stage=submitted|viewed|shortlisted|... &limit=&offset=
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

  try {
    // Verify owner
    const { data: opp } = await supabase.from('opportunities')
      .select('poster_user_id').eq('id', id).single()

    if (!opp || opp.poster_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    let query = supabase.from('opportunity_applications')
      .select('*', { count: 'exact' })
      .eq('opportunity_id', id)

    if (stage && stage !== 'all') {
      query = query.eq('pipeline_stage', stage)
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: applications, count, error } = await query
    if (error) throw error

    const items = applications || []

    // Enrich with applicant profile
    const applicantIds = [...new Set(items.map(i => i.applicant_id))]
    const { data: applicants } = applicantIds.length
      ? await supabase.from('users').select('id, username, full_name, avatar_url, tagline, bio, is_verified, location').in('id', applicantIds)
      : { data: [] }
    const applicantMap = new Map((applicants || []).map((a: any) => [a.id, a]))

    // Stats
    const { data: allApps } = await supabase.from('opportunity_applications')
      .select('pipeline_stage').eq('opportunity_id', id)
    const stats: Record<string, number> = { total: allApps?.length || 0 }
    for (const a of allApps || []) {
      stats[a.pipeline_stage] = (stats[a.pipeline_stage] || 0) + 1
    }

    return NextResponse.json({
      applications: items.map(app => ({
        ...app,
        applicant: applicantMap.get(app.applicant_id) || null,
      })),
      stats,
      total: count || 0,
      limit,
      offset,
    })
  } catch (e: any) {
    console.error('Applicants list error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}