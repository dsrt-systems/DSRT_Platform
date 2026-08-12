import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const body = await request.json().catch(() => ({}))
    const source = body?.source || 'direct'

    const { data: venture } = await supabase
      .from('ventures')
      .select('id, user_id, founder_id')
      .eq('slug', slug)
      .maybeSingle()

    if (!venture) return NextResponse.json({ success: false })

    // Don't count self-views
    if (user?.id && (venture.user_id === user.id || venture.founder_id === user.id)) {
      return NextResponse.json({ success: false, reason: 'self' })
    }

    await supabase.rpc('record_venture_view', {
      p_venture_id: venture.id,
      p_viewer_id: user?.id || null,
      p_source: source,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}
