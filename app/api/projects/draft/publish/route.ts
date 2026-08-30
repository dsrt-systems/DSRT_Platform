// app/api/projects/draft/publish/route.ts
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
      id, visibility, show_in_explore, domains, primary_domain, 
      technologies, looking_for_roles
    } = body

    if (!id) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })

    const isPublic = visibility === 'public'
    
    // Generate permanent canonical ID (e.g. PRJ-492102) if it doesn't exist
    const { data: currentProject } = await supabase.from('projects').select('project_number, name, location, industry').eq('id', id).single()
    const projectNumber = currentProject?.project_number || 'PRJ-' + Math.floor(100000 + Math.random() * 900000)

    const updatePayload = {
      status: 'active',
      visibility: visibility || 'public',
      is_public: isPublic,
      show_in_explore: isPublic && show_in_explore !== false,
      project_number: projectNumber,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: project, error: updateError } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .eq('founder_id', user.id)
      .select('id, name, slug, industry, location')
      .single()

    if (updateError) throw updateError

    // Taxonomy Sync: Domains
    if (domains && domains.length > 0) {
      const { data: domainRows } = await supabase.from('project_domains_taxonomy').select('id, name').in('name', domains)
      if (domainRows && domainRows.length > 0) {
        const domainAssignments = domainRows.map((d: any) => ({
          project_id: id,
          domain_id: d.id,
          is_primary: d.name === (primary_domain || domains[0])
        }))
        await supabase.from('project_domain_assignments').upsert(domainAssignments, { onConflict: 'project_id,domain_id' })
      }
    }

    // Taxonomy Sync: Technologies
    if (technologies && technologies.length > 0) {
      const { data: techRows } = await supabase.from('project_technologies_taxonomy').select('id, name').in('name', technologies)
      if (techRows && techRows.length > 0) {
        const techAssignments = techRows.map((t: any) => ({
          project_id: id,
          technology_id: t.id
        }))
        await supabase.from('project_technology_assignments').upsert(techAssignments, { onConflict: 'project_id,technology_id' })
      }
    }

    // Spawn Roles to DSRT Looking For
    if (looking_for_roles && looking_for_roles.length > 0) {
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
        slug: `${slugify(role.title, { lower: true, strict: true })}-${Math.random().toString(36).substring(2, 6)}`
      }))

      const { error: rolesErr } = await supabase.from('team_up_requests').insert(roleInserts)
      if (!rolesErr) {
        await supabase.from('projects').update({ open_roles: roleInserts.length }).eq('id', id)
      }
    }

    // Publish Tracking Signal (wrapped safely in try/catch)
    if (isPublic) {
      try {
        await supabase.from('user_activity_signals').insert({
          user_id: user.id,
          signal_type: 'publish',
          entity_type: 'project',
          entity_id: id,
          weight: 15.0,
        })
      } catch (signalError) {
        // Non-critical background task, safely ignore
      }
    }

    return NextResponse.json({
      success: true,
      slug: project.slug,
      project_number: projectNumber
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Publish failed' }, { status: 500 })
  }
}