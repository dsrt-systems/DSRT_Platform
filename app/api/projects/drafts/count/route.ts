import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const DRAFT_LIMIT = 10

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', user.id)
    .eq('status', 'draft')

  return NextResponse.json({ 
    count: count || 0, 
    limit: DRAFT_LIMIT,
    remaining: Math.max(0, DRAFT_LIMIT - (count || 0))
  })
}