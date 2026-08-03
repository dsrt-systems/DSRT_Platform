import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()

  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const { data, error } = await supabase.rpc('global_search', { p_query: q, p_limit: 8 })

  if (error) return NextResponse.json({ error: error.message, results: [] })

  return NextResponse.json({ results: data || [] })
}