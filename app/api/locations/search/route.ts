import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()

  if (!q) return NextResponse.json({ locations: [] })

  const { data } = await supabase
    .from('locations')
    .select('id, city, country, display')
    .or(`city.ilike.${q}%,country.ilike.${q}%`)
    .order('usage_count', { ascending: false })
    .limit(10)

  return NextResponse.json({ locations: data || [] })
}