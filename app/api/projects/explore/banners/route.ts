import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache 5 min

export async function GET() {
  const supabase = await createClient()

  try {
    const now = new Date().toISOString()

    const { data: banners, error } = await supabase
      .from('project_explore_banners')
      .select('*')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('priority', { ascending: true })
      .limit(5)

    if (error) throw error

    return NextResponse.json(
      { banners: banners || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (e: any) {
    console.error('[projects/explore/banners] error:', e)
    return NextResponse.json({ banners: [] }, { status: 500 })
  }
}