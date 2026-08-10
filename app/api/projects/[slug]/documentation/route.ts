import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()

  try {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!project) return NextResponse.json({ sections: [] })

    const { data, error } = await supabase
      .from('project_documentation')
      .select('*')
      .eq('project_id', project.id)
      .order('position', { ascending: true })

    if (error) throw error
    return NextResponse.json({ sections: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, sections: [] }, { status: 500 })
  }
}

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
      .select('id, founder_id, user_id')
      .eq('slug', slug)
      .single()

    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (project.founder_id !== user.id && project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const title = (body.title || 'New section').trim().slice(0, 200)

    const { data: last } = await supabase
      .from('project_documentation')
      .select('position')
      .eq('project_id', project.id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextPos = (last?.position ?? -1) + 1

    const { data, error } = await supabase
      .from('project_documentation')
      .insert({
        project_id: project.id,
        title,
        content: body.content || '',
        position: nextPos,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, section: data })
  } catch (e: any) {
    console.error('Doc create error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
