import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const { data, error } = await supabase.rpc('get_project_detail', {
      p_slug: slug,
      p_viewer_id: user?.id || null,
    })

    if (error) throw error
    if (!data || data.error) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (user?.id) {
      const projectId = data?.project?.id
      if (projectId && !data.is_owner) {
        supabase.from('user_activity_signals').insert({
          user_id: user.id,
          signal_type: 'view_detail',
          entity_type: 'project',
          entity_id: projectId,
          weight: 2.0,
        }).then(() => {}, () => {})
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Project detail error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to load project' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()

    const allowed = [
      'name', 'short_description', 'description', 'tagline', 'about_content',
      'logo_url', 'cover_image_url', 'icon', 'color',
      'stage', 'status', 'industry', 'sector', 'category', 'tech_stack',
      'project_type', 'founded_date', 'goals', 'risk_level',
      'visibility', 'is_public', 'show_in_explore',
      'messaging_permission', 'application_permission',
      'allow_recommendations', 'allow_builder_matching',
      'team_size', 'open_roles', 'recruiting_count',
      'completion_dismissed'
    ]

    const patch: Record<string, any> = {}
    for (const k of allowed) {
      if (k in body) patch[k] = body[k]
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
    }

    patch.updated_at = new Date().toISOString()
    patch.last_activity_at = new Date().toISOString()

    const { data: project, error: fetchErr } = await supabase
      .from('projects')
      .select('id, founder_id, user_id, slug')
      .eq('slug', slug)
      .single()

    if (fetchErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isOwner = project.founder_id === user.id || project.user_id === user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (patch.is_public === true) {
      const { data: existing } = await supabase
        .from('projects')
        .select('published_at')
        .eq('id', project.id)
        .single()
      if (!existing?.published_at) {
        patch.published_at = new Date().toISOString()
      }
    }

    const { data: updated, error } = await supabase
      .from('projects')
      .update(patch)
      .eq('id', project.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, project: updated })
  } catch (error: any) {
    console.error('Project update error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function DELETE(
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
    if (project.founder_id !== user.id && project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('projects')
      .update({ status: 'archived', is_public: false })
      .eq('id', project.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
