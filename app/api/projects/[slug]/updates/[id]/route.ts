import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, project_id')
      .eq('id', id)
      .single()

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: project } = await supabase
      .from('projects')
      .select('founder_id, user_id')
      .eq('id', post.project_id)
      .single()

    const isAuthor = post.user_id === user.id
    const isProjectOwner = project && (project.founder_id === user.id || project.user_id === user.id)

    if (!isAuthor && !isProjectOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const patch: Record<string, any> = { edited_at: new Date().toISOString() }
    if (typeof body.content === 'string') patch.content = body.content.slice(0, 10000)
    if (typeof body.title === 'string') patch.title = body.title.slice(0, 200)
    if (typeof body.update_type === 'string') patch.update_type = body.update_type
    if (typeof body.comments_disabled === 'boolean' && isProjectOwner) patch.comments_disabled = body.comments_disabled
    if (Array.isArray(body.tags)) patch.tags = body.tags.slice(0, 10)
    if (typeof body.resource_url === 'string' || body.resource_url === null) patch.resource_url = body.resource_url
    if (typeof body.resource_label === 'string' || body.resource_label === null) patch.resource_label = body.resource_label
    if (Array.isArray(body.image_urls)) patch.image_urls = body.image_urls
    if (Array.isArray(body.media_urls)) patch.media_urls = body.media_urls
    if (Array.isArray(body.attachments)) patch.attachments = body.attachments

    const { error } = await supabase.from('posts').update(patch).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, project_id')
      .eq('id', id)
      .single()

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: project } = await supabase
      .from('projects')
      .select('founder_id, user_id')
      .eq('id', post.project_id)
      .single()

    const isAuthor = post.user_id === user.id
    const isProjectOwner = project && (project.founder_id === user.id || project.user_id === user.id)

    if (!isAuthor && !isProjectOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
