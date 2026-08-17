import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/opportunities/drafts
 *   ?id=<id>  — get specific draft
 *   (no id)   — get user's most recent draft
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ draft: null })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  try {
    let query = supabase.from('opportunities')
      .select('*')
      .eq('poster_user_id', user.id)
      .eq('status', 'draft')

    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.order('updated_at', { ascending: false }).limit(1)
    }

    const { data, error } = await query.maybeSingle()
    if (error) throw error

    return NextResponse.json({ draft: data || null })
  } catch (e: any) {
    return NextResponse.json({ draft: null, error: e?.message })
  }
}

/**
 * POST /api/opportunities/drafts
 * Creates a new draft or upserts by id
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const draftId = body.id

  try {
    if (draftId) {
      // Update existing draft
      const { data: existing } = await supabase.from('opportunities')
        .select('poster_user_id').eq('id', draftId).single()

      if (!existing || existing.poster_user_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }

      const updates: any = { ...body }
      delete updates.id
      delete updates.poster_user_id
      delete updates.opportunity_number
      delete updates.slug
      delete updates.created_at

      // Ensure it stays a draft
      if (!updates.status || updates.status !== 'active') {
        updates.status = 'draft'
      }

      const { data, error } = await supabase.from('opportunities')
        .update(updates).eq('id', draftId).select().single()

      if (error) throw error
      return NextResponse.json({ draft: data })
    } else {
      // Create new draft
      const insertData: any = {
        poster_user_id: user.id,
        poster_context: body.poster_context || 'personal',
        project_id: body.project_id || null,
        venture_id: body.venture_id || null,
        opportunity_type: body.opportunity_type || 'hire',
        title: body.title || 'Untitled opportunity',
        subtitle: body.subtitle || null,
        description: body.description || null,
        content_blocks: body.content_blocks || [],
        content_text: body.content_text || null,
        primary_category_id: body.primary_category_id || null,
        subcategory_id: body.subcategory_id || null,
        required_skills: body.required_skills || [],
        preferred_skills: body.preferred_skills || [],
        experience_level: body.experience_level || null,
        compensation_type: body.compensation_type || 'unpaid',
        compensation_min: body.compensation_min || null,
        compensation_max: body.compensation_max || null,
        compensation_currency: body.compensation_currency || 'USD',
        equity_min: body.equity_min || null,
        equity_max: body.equity_max || null,
        project_length: body.project_length || null,
        time_commitment: body.time_commitment || null,
        hours_per_week: body.hours_per_week || null,
        start_date: body.start_date || null,
        application_deadline: body.application_deadline || null,
        work_mode: body.work_mode || 'remote',
        location: body.location || null,
        team_context: body.team_context || null,
        positions_open: body.positions_open || 1,
        custom_questions: body.custom_questions || [],
        require_resume: body.require_resume || false,
        require_portfolio: body.require_portfolio || false,
        require_github: body.require_github || false,
        require_website: body.require_website || false,
        require_cover_letter: body.require_cover_letter !== false,
        visibility: body.visibility || 'public',
        show_compensation: body.show_compensation !== false,
        show_location: body.show_location !== false,
        show_applicant_count: body.show_applicant_count !== false,
        show_poster_identity: body.show_poster_identity !== false,
        cover_image_url: body.cover_image_url || null,
        status: 'draft',
      }

      const { data, error } = await supabase.from('opportunities')
        .insert(insertData).select().single()

      if (error) throw error
      return NextResponse.json({ draft: data }, { status: 201 })
    }
  } catch (e: any) {
    console.error('Draft save error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * DELETE /api/opportunities/drafts?id=<id>
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const { data: existing } = await supabase.from('opportunities')
      .select('poster_user_id, status').eq('id', id).single()

    if (!existing || existing.poster_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Not a draft' }, { status: 400 })
    }

    await supabase.from('opportunities').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}