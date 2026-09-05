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
      id,
      name,
      tagline,
      description,
      problem_statement,
      goals,
      project_type,
      stage,
      primary_domain,
      domains,
      technologies,
      repository_url,
      is_open_source,
      license,
      collaboration_status,
      visibility,
      show_in_explore,
      logo_url,
      cover_image_url,
      looking_for_roles,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Project draft ID missing. Save the draft first, then publish.' }, { status: 400 })
    }

    // Verify ownership with founder_id OR user_id
    const { data: currentProject, error: findErr } = await supabase
      .from('projects')
      .select('id, slug, name, location, industry, project_number, status')
      .eq('id', id)
      .or(`founder_id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle()

    if (findErr) throw findErr
    if (!currentProject) {
      return NextResponse.json({ error: 'Draft not found or access denied' }, { status: 404 })
    }

    const finalName = (name || currentProject.name || '').trim()
    if (finalName.length < 2) {
      return NextResponse.json({ error: 'Project name is required before publishing' }, { status: 400 })
    }

    const isPublic = (visibility || 'public') === 'public'
    const projectNumber = currentProject.project_number || `PRJ-${Math.floor(100000 + Math.random() * 900000)}`

    const updatePayload: Record<string, any> = {
      name: finalName,
      tagline: tagline?.trim() || null,
      short_description: tagline?.trim() || null,
      description: description?.trim() || null,
      about_content: description?.trim() || null,
      problem_statement: problem_statement?.trim() || null,
      goals: goals?.trim() || null,
      project_type: project_type || 'software',
      stage: stage || 'idea',
      industry: primary_domain || (Array.isArray(domains) ? domains[0] : currentProject.industry) || null,
      category: Array.isArray(domains) ? domains : [],
      tech_stack: Array.isArray(technologies) ? technologies : [],
      repository_url: repository_url || null,
      is_open_source: !!is_open_source,
      license: license || null,
      collaboration_status: collaboration_status || 'solo',
      logo_url: logo_url || null,
      cover_image_url: cover_image_url || null,
      status: 'active',
      visibility: visibility || 'public',
      is_public: isPublic,
      show_in_explore: isPublic && show_in_explore !== false,
      project_number: projectNumber,
      founder_id: user.id,
      user_id: user.id,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    }

    const { data: project, error: updateError } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select('id, name, slug, industry, location')
      .single()

    if (updateError) throw updateError

    // Ensure owner membership
    const { data: member } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) {
      await supabase.from('project_members').insert({
        project_id: id,
        user_id: user.id,
        role: 'owner',
      })
    }

    // Domain taxonomy sync (best-effort)
    if (domains && domains.length > 0) {
      try {
        const { data: domainRows } = await supabase
          .from('project_domains_taxonomy')
          .select('id, name')
          .in('name', domains)

        if (domainRows?.length) {
          const domainAssignments = domainRows.map((d: any) => ({
            project_id: id,
            domain_id: d.id,
            is_primary: d.name === (primary_domain || domains[0]),
          }))
          await supabase
            .from('project_domain_assignments')
            .upsert(domainAssignments, { onConflict: 'project_id,domain_id' })
        }
      } catch (e) {
        console.warn('[publish] domain sync skipped', e)
      }
    }

    // Technology taxonomy sync (best-effort)
    if (technologies && technologies.length > 0) {
      try {
        const { data: techRows } = await supabase
          .from('project_technologies_taxonomy')
          .select('id, name')
          .in('name', technologies)

        if (techRows?.length) {
          const techAssignments = techRows.map((t: any) => ({
            project_id: id,
            technology_id: t.id,
          }))
          await supabase
            .from('project_technology_assignments')
            .upsert(techAssignments, { onConflict: 'project_id,technology_id' })
        }
      } catch (e) {
        console.warn('[publish] tech sync skipped', e)
      }
    }

    // Spawn Looking For roles (best-effort)
    if (looking_for_roles && looking_for_roles.length > 0) {
      try {
        const roleInserts = looking_for_roles.map((role: any) => ({
          user_id: user.id,
          project_id: id,
          context_type: 'project',
          request_type: 'collaborate',
          title: role.title,
          tagline: `Role for ${project.name}`,
          description: role.description || null,
          commitment: role.commitment || 'part-time',
          work_mode: role.work_mode || 'remote',
          location: project.location || 'Remote',
          industry: primary_domain || project.industry,
          status: 'published',
          published_at: new Date().toISOString(),
          slug: `${slugify(role.title || 'role', { lower: true, strict: true })}-${Math.random().toString(36).substring(2, 6)}`,
        }))

        const { error: rolesErr } = await supabase.from('team_up_requests').insert(roleInserts)
        if (!rolesErr) {
          await supabase.from('projects').update({ open_roles: roleInserts.length }).eq('id', id)
        }
      } catch (e) {
        console.warn('[publish] roles sync skipped', e)
      }
    }

    // Activity signal (best-effort)
    if (isPublic) {
      try {
        await supabase.from('user_activity_signals').insert({
          user_id: user.id,
          signal_type: 'publish',
          entity_type: 'project',
          entity_id: id,
          weight: 15.0,
        })
      } catch {
        // non-critical
      }
    }

    return NextResponse.json({
      success: true,
      slug: project.slug,
      project_number: projectNumber,
    })
  } catch (error: any) {
    console.error('[Publish Project] error:', error)
    return NextResponse.json({ error: error?.message || 'Publish failed' }, { status: 500 })
  }
}