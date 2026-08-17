import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects')
    .select('id, name').eq('slug', slug).single()
  if (!project) return NextResponse.json({ opportunities: [], project: null })

  const { data: rows, error } = await supabase.from('team_up_unified')
    .select('*')
    .eq('project_id', project.id)
    .in('status', ['published', 'active', 'closing_soon', 'open'])
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = rows || []
  const ownerIds = [...new Set(items.map((i: any) => i.owner_id).filter(Boolean))]
  const { data: owners } = ownerIds.length
    ? await supabase.from('users').select('id, username, full_name, avatar_url, is_verified').in('id', ownerIds)
    : { data: [] as any[] }
  const ownerMap = new Map((owners || []).map((u: any) => [u.id, u]))

  return NextResponse.json({
    project: { id: project.id, name: project.name, slug },
    opportunities: items.map((i: any) => ({ ...i, owner: ownerMap.get(i.owner_id) || null })),
    total: items.length,
  })
}
