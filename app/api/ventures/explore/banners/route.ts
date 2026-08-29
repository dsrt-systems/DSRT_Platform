import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  try {
    const { data: banners, error } = await supabase
      .from('explore_banners')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(5)

    if (error) throw error
    return NextResponse.json({ banners: banners || [] })
  } catch (e: any) {
    return NextResponse.json({ banners: [] }, { status: 500 })
  }
}