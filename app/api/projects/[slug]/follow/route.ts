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
      .select('id, founder_id, user_id, follower_count')
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
      // ─── UNFOLLOW ───
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', existing.id)
      if (error) throw error

      // Decrement denormalized counter
      await supabase
        .from('projects')
        .update({ follower_count: Math.max(0, (project.follower_count || 1) - 1) })
        .eq('id', project.id)
        .then(() => {}, () => {})

      // Log unfollow event for analytics chart
      await supabase
        .from('project_follower_events')
        .insert({
          project_id: project.id,
          user_id: user.id,
          action: 'unfollow',
        })
        .then(() => {}, () => {})

      // Track signal for recommendation algorithm
      await supabase.from('user_activity_signals').insert({
        user_id: user.id,
        signal_type: 'unfollow',
        entity_type: 'project',
        entity_id: project.id,
        weight: -1.0,
      }).then(() => {}, () => {})

      return NextResponse.json({ following: false })
    } else {
      // ─── FOLLOW ───
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_type: 'project',
          following_id: project.id,
        })
      if (error) throw error

      // Increment denormalized counter
      await supabase
        .from('projects')
        .update({ follower_count: (project.follower_count || 0) + 1 })
        .eq('id', project.id)
        .then(() => {}, () => {})

      // Log follow event for analytics chart
      await supabase
        .from('project_follower_events')
        .insert({
          project_id: project.id,
          user_id: user.id,
          action: 'follow',
        })
        .then(() => {}, () => {})

      // Track signal for recommendation algorithm
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