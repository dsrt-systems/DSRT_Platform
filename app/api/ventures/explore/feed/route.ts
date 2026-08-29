import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VentureExploreEngine } from '@/lib/venture-explore/engine'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const domains = searchParams.get('domains')?.split(',').filter(Boolean)
  const stages = searchParams.get('stages')?.split(',').filter(Boolean)
  const venture_types = searchParams.get('venture_types')?.split(',').filter(Boolean)
  const is_verified = searchParams.get('is_verified') === 'true'
  const is_hiring = searchParams.get('is_hiring') === 'true'

  try {
    const engine = new VentureExploreEngine(supabase, user?.id)
    const feed = await engine.generateFeed({
      search, domains, stages, venture_types, is_verified, is_hiring
    })

    return NextResponse.json(feed)
  } catch (e: any) {
    console.error('Explore feed API error:', e)
    return NextResponse.json({ modules: [], error: e.message }, { status: 500 })
  }
}