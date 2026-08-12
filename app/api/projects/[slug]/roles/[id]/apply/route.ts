import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Sign in to apply' }, { status: 401 })

  try {
    const body = await request.json()

    const { data: project } = await supabase
      .from('projects')
      .select('id, founder_id, user_id, is_public, application_permission')
      .eq('slug', slug)
      .single()

    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (project.founder_id === user.id || project.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot apply to your own project' }, { status: 400 })
    }

    const { data: role } = await supabase
      .from('project_roles')
      .select('id, status, project_id, title')
      .eq('id', id)
      .single()

    if (!role || role.project_id !== project.id) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    if (role.status !== 'open') {
      return NextResponse.json({ error: 'This role is no longer accepting applications' }, { status: 400 })
    }

    const cover_letter = (body.cover_letter || '').trim()
    if (cover_letter.length < 20) {
      return NextResponse.json({ error: 'Cover letter must be at least 20 characters' }, { status: 400 })
    }

    const insert: Record<string, any> = {
      role_id: id,
      project_id: project.id,
      applicant_id: user.id,
      cover_letter: cover_letter.slice(0, 5000),
      portfolio_url: body.portfolio_url || null,
      github_url: body.github_url || null,
      linkedin_url: body.linkedin_url || null,
      resume_url: body.resume_url || null,
      availability: body.availability || null,
      expected_hours: body.expected_hours || null,
      start_date: body.start_date || null,
      answers: body.answers || {},
      status: 'pending',
    }

    const { data, error } = await supabase
      .from('project_role_applications')
      .insert(insert)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'You have already applied to this role' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true, application: data })
  } catch (e: any) {
    console.error('Apply error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
