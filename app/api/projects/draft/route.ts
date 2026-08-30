// app/api/projects/draft/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import slugify from 'slugify'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      id, name, tagline, description, problem_statement, goals,
      project_type, stage, primary_domain, domains, technologies,
      repository_url, is_open_source, license, collaboration_status,
      visibility, show_in_explore, logo_url, cover_image_url
    } = body

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Comprehensive field mapping to exact database schema
    const updatePayload: Record<string, any> = {
      name: name.trim(),
      tagline: tagline?.trim() || null,
      short_description: tagline?.trim() || null,
      description: description?.trim() || null,
      about_content: description?.trim() || null,
      problem_statement: problem_statement?.trim() || null,
      goals: goals?.trim() || null,
      project_type: project_type || 'software',
      stage: stage || 'idea',
      industry: primary_domain || (Array.isArray(domains) ? domains[0] : null),
      category: Array.isArray(domains) ? domains : [],
      tech_stack: Array.isArray(technologies) ? technologies : [],
      repository_url: repository_url || null,
      is_open_source: !!is_open_source,
      license: license || null,
      collaboration_status: collaboration_status || 'solo',
      visibility: visibility || 'public',
      is_public: visibility === 'public',
      show_in_explore: show_in_explore !== false,
      logo_url: logo_url || null,
      cover_image_url: cover_image_url || null,
      updated_at: new Date().toISOString()
    }

    // UPDATE EXISTING DRAFT
    if (id) {
      const { data, error } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', id)
        .eq('founder_id', user.id)
        .select('id, slug')
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, project: data })
    }

    // CREATE NEW DRAFT
    let slug = slugify(name, { lower: true, strict: true }).slice(0, 40)
    const { data: existing } = await supabase.from('projects').select('id').eq('slug', slug).maybeSingle()
    if (existing) slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...updatePayload,
        slug,
        founder_id: user.id,
        user_id: user.id,
        status: 'draft',
        is_public: false, // Force private while in draft
      })
      .select('id, slug')
      .single()

    if (error) throw error

    // Ensure creator is owner (wrapped safely in try/catch instead of .catch())
    try {
      await supabase.from('project_members').insert({
        project_id: data.id,
        user_id: user.id,
        role: 'owner',
      })
    } catch (memberError) {
      // Ignore if it fails, trigger might have handled it
    }

    return NextResponse.json({ success: true, project: data })
  } catch (error: any) {
    console.error('[Project Draft AutoSave] error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to save draft' }, { status: 500 })
  }
}