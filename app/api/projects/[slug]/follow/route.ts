import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id, name, slug, founder_id, user_id, follower_count')
      .eq('slug', slug)
      .single()

    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const ownerId = project.founder_id || project.user_id

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_type', 'project')
      .eq('following_id', project.id)
      .maybeSingle()

    let following = false

    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id)
      await supabase.from('projects').update({ follower_count: Math.max(0, (project.follower_count || 1) - 1) }).eq('id', project.id)
      following = false
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_type: 'project',
        following_id: project.id,
      })
      await supabase.from('projects').update({ follower_count: (project.follower_count || 0) + 1 }).eq('id', project.id)
      following = true

      if (ownerId && ownerId !== user.id) {
        const { data: followerProfile } = await supabase.from('users').select('full_name, username').eq('id', user.id).single()
        const followerName = followerProfile?.full_name || 'A builder'

        const { error: notifErr } = await supabase.from('notifications').insert({
          user_id: ownerId,
          actor_id: user.id,
          type: 'project_follow',
          title: 'New Project Follower',
          message: `${followerName} started following ${project.name}`,
          entity_type: 'project',
          entity_id: project.id,
          action_url: `/projects/${project.slug}`,
        })

        if (notifErr) {
          await supabase.from('home_notifications').insert({
            user_id: ownerId,
            actor_id: user.id,
            type: 'project_follow',
            title: 'New Project Follower',
            body: `${followerName} started following ${project.name}`,
            target_url: `/projects/${project.slug}`,
          })
        }
      }

      await supabase.from('project_explore_interactions').insert({
        user_id: user.id,
        project_id: project.id,
        action: 'follow',
        weight: 5.0,
      })
    }

    return NextResponse.json({ success: true, following })
  } catch (e: any) {
    console.error('[Project Follow API] error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}