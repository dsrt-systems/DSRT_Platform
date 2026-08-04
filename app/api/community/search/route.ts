import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20)

  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const { data, error } = await supabase.rpc('global_search', { p_query: q, p_limit: limit })

  // Log search for algorithm learning
  if (user) {
    supabase.from('user_search_history').insert({
      user_id: user.id,
      query: q,
    }).then(() => {})
    // Also bump trending terms
    supabase.from('trending_search_terms').upsert({
      term: q.toLowerCase(),
      search_count: 1,
      last_searched_at: new Date().toISOString(),
    }, { onConflict: 'term' }).then(() => {})
  }

  if (error) return NextResponse.json({ error: error.message, results: [] })
  return NextResponse.json({ results: data || [] })
}