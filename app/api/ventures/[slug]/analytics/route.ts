import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30')

  const { data: venture } = await supabase.from('ventures').select('id, user_id, founder_id').eq('slug', slug).single()
  if (!venture || (venture.user_id !== user.id && venture.founder_id !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  const [analytics, metricEntries, views] = await Promise.all([
    supabase.from('venture_analytics').select('*').eq('venture_id', venture.id).gte('date', since).order('date'),
    supabase.from('venture_metric_entries').select('*, venture_metrics(name, slug, type, currency, unit)').eq('venture_id', venture.id).gte('date', since).order('date'),
    supabase.from('venture_views').select('source, created_at').eq('venture_id', venture.id).gte('created_at', new Date(Date.now() - days * 86400000).toISOString())
  ])

  const sourceCounts = (views.data || []).reduce((acc: Record<string, number>, v) => {
    acc[v.source] = (acc[v.source] || 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    analytics: analytics.data || [],
    metricEntries: metricEntries.data || [],
    sources: sourceCounts,
    summary: {
      totalViews: analytics.data?.reduce((s, d) => s + (d.views || 0), 0) || 0,
      totalFollowers: analytics.data?.reduce((s, d) => s + (d.new_followers || 0), 0) || 0,
      totalApplications: analytics.data?.reduce((s, d) => s + (d.applications || 0), 0) || 0,
      totalSaves: analytics.data?.reduce((s, d) => s + (d.saves || 0), 0) || 0,
    }
  })
}