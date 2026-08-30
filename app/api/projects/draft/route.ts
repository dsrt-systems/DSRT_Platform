import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import slugify from 'slugify'

export const dynamic = 'force-dynamic'

// Auto-save endpoint for project drafts
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, name, tagline, description, project_type, stage, primary_domain, repository_url, is_open_source, collaboration_status, visibility, show_in_explore } = body

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      name: name.trim(),
      tagline: tagline?.trim() || null,
      description: description?.trim() || null,
      project_type: project_type || 'personal',
      stage: stage || 'idea',
      industry: primary_domain || null,
      repository_url: repository_url || null,
      is_open_source: !!is_open_source,
      collaboration_status: collaboration_status || 'solo',
      visibility: visibility || 'public',
      is_public: visibility === 'public',
      show_in_explore: !!show_in_explore,
      updated_at: new Date().toISOString()
    }

    // 1. If ID exists, UPDATE
    if (id) {
      const { data, error } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', id)
        .eq('founder_id', user.id) // Security check
        .select('id, slug')
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, project: data })
    }

    // 2. If NO ID, CREATE NEW DRAFT
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
        status: 'draft', // Critical: Keeps it out of public explore
        is_public: false, // Ensure hidden while drafting
      })
      .select('id, slug')
      .single()

    if (error) throw error

    // Add owner to members table
    await supabase.from('project_members').insert({
      project_id: data.id,
      user_id: user.id,
      role: 'owner',
    })

    return NextResponse.json({ success: true, project: data })
  } catch (error: any) {
    console.error('[Project Draft AutoSave] error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to save draft' }, { status: 500 })
  }
}