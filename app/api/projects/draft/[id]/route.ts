import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!id) return NextResponse.json({ error: 'Draft id/slug required' }, { status: 400 })

  try {
    // Load by id OR slug, owned by founder_id OR user_id
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .or(`founder_id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const draft = {
      id: data.id,
      name: data.name || '',
      project_type: data.project_type || 'software',
      tagline: data.tagline || data.short_description || '',
      logo_url: data.logo_url || null,
      cover_image_url: data.cover_image_url || null,
      description: data.description || data.about_content || '',
      problem_statement: data.problem_statement || '',
      goals: data.goals || '',
      primary_domain: data.industry || '',
      domains: Array.isArray(data.category) ? data.category : [],
      stage: data.stage || 'idea',
      technologies: Array.isArray(data.tech_stack) ? data.tech_stack : [],
      repository_url: data.repository_url || '',
      is_open_source: !!data.is_open_source,
      license: data.license || '',
      collaboration_status: data.collaboration_status || 'solo',
      collaborators: [],
      looking_for_roles: [],
      visibility: data.visibility === 'draft' ? 'public' : (data.visibility || 'public'),
      show_in_explore: data.show_in_explore !== false,
      show_on_profile: true,
    }

    return NextResponse.json({ success: true, draft })
  } catch (error: any) {
    console.error('[Load Draft] error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load draft' }, { status: 500 })
  }
}