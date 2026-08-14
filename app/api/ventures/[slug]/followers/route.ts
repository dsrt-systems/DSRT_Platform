import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: venture } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  if (!venture) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = await supabase.from('venture_followers').select('venture_id').eq('venture_id', venture.id).eq('user_id', user.id).maybeSingle()

  if (existing.data) {
    await supabase.from('venture_followers').delete().eq('venture_id', venture.id).eq('user_id', user.id)
    return NextResponse.json({ following: false })
  } else {
    await supabase.from('venture_followers').insert({ venture_id: venture.id, user_id: user.id })
    return NextResponse.json({ following: true })
  }
}