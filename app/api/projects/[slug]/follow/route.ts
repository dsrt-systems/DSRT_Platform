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

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: project } = await supabase
      .from('projects')
      .select('id, founder_id, user_id')
      .eq('slug', slug)
      .single()

    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (project.founder_id === user.id || project.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot follow own project' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_type', 'project')
      .eq('following_id', project.id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', existing.id)
      if (error) throw error

      await supabase.from('user_activity_signals').insert({
        user_id: user.id,
        signal_type: 'unfollow',
        entity_type: 'project',
        entity_id: project.id,
        weight: -1.0,
      }).then(() => {}, () => {})

      return NextResponse.json({ following: false })
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_type: 'project',
          following_id: project.id,
        })
      if (error) throw error

      await supabase.from('user_activity_signals').insert({
        user_id: user.id,
        signal_type: 'follow',
        entity_type: 'project',
        entity_id: project.id,
        weight: 4.0,
      }).then(() => {}, () => {})

      return NextResponse.json({ following: true })
    }
  } catch (error: any) {
    console.error('Follow error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
