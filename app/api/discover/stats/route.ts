import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60s

export async function GET() {
  const supabase = createClient()

  // Try to refresh (best-effort, ignore errors)
  await supabase.rpc('refresh_platform_stats').catch(() => {})

  const { data } = await supabase
    .from('platform_stats')
    .select('*')
    .eq('id', 1)
    .single()

  return NextResponse.json({
    stats: data || {
      total_communities: 0,
      total_members: 0,
      total_projects: 0,
      total_ventures: 0,
      total_looking_for: 0,
      total_countries: 0,
    },
  })
}