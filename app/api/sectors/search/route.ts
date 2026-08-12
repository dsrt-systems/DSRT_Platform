import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  try {
    let query = supabase
      .from('sectors')
      .select('id, name, slug, category, popular')
      .order('popular', { ascending: false })
      .order('name', { ascending: true })
      .limit(limit)

    if (q.length >= 1) {
      query = query.ilike('name', '%' + q + '%')
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ sectors: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, sectors: [] }, { status: 500 })
  }
}
