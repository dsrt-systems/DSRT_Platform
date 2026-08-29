import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: venture } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  if (!venture) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

  const body = await req.json()
  
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  try {
    const { data: position, error } = await supabase
      .from('venture_team_positions')
      .insert({
        venture_id: venture.id,
        title: body.title.trim(),
        description: body.description || null,
        position_type: body.position_type || 'employee',
        status: body.status || 'open',
        team_name: body.team_name || null,
        department: body.department || null,
        capacity: body.capacity || 1,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    // Generate Audit Event
    await supabase.rpc('fn_venture_audit', {
      p_venture_id: venture.id,
      p_action: 'position.created',
      p_target_type: 'position',
      p_target_id: position.id,
      p_after: position
    })

    return NextResponse.json({ success: true, position })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}