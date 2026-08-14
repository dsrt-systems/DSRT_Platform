import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '20')
  const stage = searchParams.get('stage')
  const industry = searchParams.get('industry')

  let query = supabase
    .from('ventures')
    .select('*')
    .eq('show_in_explore', true)
    .not('slug', 'is', null)
    .order('traction_score', { ascending: false })
    .limit(limit)

  if (q) query = query.ilike('name', `%${q}%`)
  if (stage) query = query.eq('stage', stage)
  if (industry) query = query.eq('industry', industry)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ventures: data || [] })
}
