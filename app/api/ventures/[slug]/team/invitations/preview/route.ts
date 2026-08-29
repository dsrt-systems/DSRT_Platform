import { getVentureServices } from '@/lib/venture'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const { supabase, eligibility } = await getVentureServices()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: venture } = await supabase
      .from('ventures')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!venture) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

    const { data: isMember } = await supabase.rpc('is_venture_owner_or_member', {
      p_venture_id: venture.id,
      p_user_id: user.id
    })

    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { invited_user_id, position_id } = body

    if (!invited_user_id) {
      return NextResponse.json({ error: 'invited_user_id is required' }, { status: 400 })
    }

    const result = await eligibility.evaluate(
      venture.id,
      invited_user_id,
      position_id || undefined
    )

    return NextResponse.json({ eligibility: result })
  } catch (e: any) {
    console.error('Eligibility preview error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to check eligibility' }, { status: 500 })
  }
}