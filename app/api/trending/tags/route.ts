import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data } = await supabase.rpc('get_trending_tags', { days_back: 7 })
  return NextResponse.json({ tags: data || [] })
}