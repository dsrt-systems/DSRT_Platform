import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: Request,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: venture } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  if (!venture) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

  try {
    const { data: rel, error: fetchErr } = await supabase.from('venture_team_relationships').select('*').eq('id', id).single()
    if (fetchErr) throw fetchErr

    const { error } = await supabase
      .from('venture_team_relationships')
      .delete()
      .eq('id', id)
      .eq('venture_id', venture.id)

    if (error) throw error

    await supabase.rpc('fn_venture_audit', {
      p_venture_id: venture.id, p_action: 'relationship.deleted',
      p_target_type: 'relationship', p_target_id: id, p_before: rel
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}