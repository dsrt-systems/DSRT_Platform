import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { searchParams } = new URL(request.url)
  const industry = searchParams.get('industry') || 'all'
  const sort = searchParams.get('sort') || 'recommended'
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 60)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
  const uid = user?.id || null

  try {
    const validSorts = ['recommended', 'newest', 'oldest', 'most_viewed', 'trending']
    const safeSort = validSorts.includes(sort) ? sort : 'recommended'

    const { data, error } = await supabase.rpc('dsrt_recommend_projects', {
      p_user_id: uid,
      p_industry: industry === 'all' ? null : industry,
      p_sort: safeSort,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) throw error

    const results = data || []

    return NextResponse.json({
      results,
      pagination: {
        limit,
        offset,
        count: results.length,
        hasMore: results.length >= limit,
        nextOffset: offset + results.length,
      },
    })
  } catch (error: any) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to load recommendations', results: [] },
      { status: 500 }
    )
  }
}
