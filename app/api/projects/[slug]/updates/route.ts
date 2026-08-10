import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['general','release','building','experiment','progress','fix','announcement','collaboration','insight']

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()

    const { data: project } = await supabase
      .from('projects')
      .select('id, founder_id, user_id, community_id, stage')
      .eq('slug', slug)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const isOwner = project.founder_id === user.id || project.user_id === user.id
    let memberRole: string | null = null
    if (!isOwner) {
      const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!member) return NextResponse.json({ error: 'Only team members can post updates' }, { status: 403 })
      memberRole = member.role
    }

    const content = (body.content || '').trim()
    const title = (body.title || '').trim()
    const hasMedia = (body.media_urls?.length || 0) > 0 || (body.image_urls?.length || 0) > 0
    if (!content && !title && !hasMedia) {
      return NextResponse.json({ error: 'Empty update' }, { status: 400 })
    }

    const update_type = VALID_TYPES.includes(body.update_type) ? body.update_type : 'general'
    const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 8) : []

    const insertData: Record<string, any> = {
      user_id: user.id,
      project_id: project.id,
      community_id: project.community_id || null,
      type: 'update',
      post_category: 'update',
      content: content.slice(0, 10000),
      title: title ? title.slice(0, 200) : null,
      media_urls: Array.isArray(body.media_urls) ? body.media_urls.slice(0, 4) : [],
      image_urls: Array.isArray(body.image_urls) ? body.image_urls.slice(0, 8) : [],
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10).map((t: any) => String(t).slice(0, 40)) : [],
      is_pinned: false,
      visibility: 'global',
      update_type,
      attachments,
      comments_disabled: !!body.comments_disabled,
    }

    if (body.milestone_from) insertData.milestone_from = String(body.milestone_from).slice(0, 40)
    if (body.milestone_to) insertData.milestone_to = String(body.milestone_to).slice(0, 40)
    if (body.resource_url && /^https?:\/\//.test(body.resource_url)) {
      insertData.resource_url = String(body.resource_url).slice(0, 500)
      insertData.resource_label = body.resource_label ? String(body.resource_label).slice(0, 100) : null
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert(insertData)
      .select('*, user:users!posts_user_id_fkey(id, full_name, username, avatar_url, is_verified)')
      .single()

    if (error) throw error

    await supabase
      .from('projects')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', project.id)

    await supabase.from('project_activity').insert({
      user_id: project.founder_id || project.user_id,
      project_id: project.id,
      type: 'update_published',
      title: title || content.slice(0, 60),
      subtitle: update_type !== 'general' ? update_type : null,
      icon: 'PencilSimpleLine',
      color: 'blue',
      actor_id: user.id,
      entity_type: 'post',
      entity_id: post.id,
    }).then(() => {}, () => {})

    return NextResponse.json({ success: true, update: post })
  } catch (error: any) {
    console.error('Create update error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
  const type = searchParams.get('type') || 'all'
  const sort = searchParams.get('sort') || 'newest'

  try {
    const { data: project } = await supabase
      .from('projects')
      .select('id, founder_id, user_id')
      .eq('slug', slug)
      .single()

    if (!project) return NextResponse.json({ updates: [], has_more: false })

    let query = supabase
      .from('posts')
      .select('*, user:users!posts_user_id_fkey(id, full_name, username, avatar_url, is_verified)')
      .eq('project_id', project.id)

    if (type !== 'all') {
      if (type === 'discussion') {
        query = query.gte('comment_count', 1)
      } else {
        query = query.eq('update_type', type)
      }
    }

    // Sort: pinned first, then chosen sort
    query = query.order('pinned_at', { ascending: false, nullsFirst: false })

    if (sort === 'most_discussed') {
      query = query.order('comment_count', { ascending: false })
    } else if (sort === 'most_saved') {
      query = query.order('bookmark_count', { ascending: false })
    }
    query = query.order('created_at', { ascending: false })

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) throw error

    const results = data || []

    // Attach member roles for authors
    if (results.length > 0) {
      const authorIds = Array.from(new Set(results.map((r: any) => r.user_id).filter(Boolean)))
      const { data: members } = await supabase
        .from('project_members')
        .select('user_id, role')
        .eq('project_id', project.id)
        .in('user_id', authorIds)

      const roleMap: Record<string, string> = {}
      for (const m of (members || [])) {
        roleMap[m.user_id] = m.role
      }

      for (const r of results) {
        const uid = (r as any).user_id
        if (project.founder_id === uid || project.user_id === uid) {
          (r as any).author_role = 'Founder'
        } else if (roleMap[uid]) {
          (r as any).author_role = roleMap[uid]
        }

        // Get user's like state
        if (user?.id) {
          const { data: liked } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', (r as any).id)
            .eq('user_id', user.id)
            .maybeSingle()
          ;(r as any).user_liked = !!liked

          const { data: bkm } = await supabase
            .from('post_bookmarks')
            .select('id')
            .eq('post_id', (r as any).id)
            .eq('user_id', user.id)
            .maybeSingle()
          ;(r as any).user_bookmarked = !!bkm
        }
      }
    }

    return NextResponse.json({
      updates: results,
      has_more: results.length >= limit,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message, updates: [] }, { status: 500 })
  }
}
