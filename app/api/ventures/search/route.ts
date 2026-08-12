import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 40)

  if (!query || query.length < 2) return NextResponse.json({ results: [] })

  try {
    const { data, error } = await supabase.rpc('search_ventures', {
      p_query: query,
      p_limit: limit,
    })
    if (error) throw error
    return NextResponse.json({ results: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, results: [] }, { status: 500 })
  }
}
