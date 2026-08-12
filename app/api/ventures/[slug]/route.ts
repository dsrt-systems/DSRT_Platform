import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET — full venture detail
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const { data: venture, error } = await supabase
      .from('ventures')
      .select('*, founder:users!ventures_user_id_fkey(id, full_name, username, avatar_url, is_verified, tagline)')
      .eq('slug', slug)
      .single()

    if (error || !venture) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Fetch related data in parallel
    const [teamRes, metricsRes, entriesRes, lookingForRes, updatesRes, linkedProjectsRes] = await Promise.all([
      supabase
        .from('venture_team_members')
        .select('*, user:users!venture_team_members_user_id_fkey(id, full_name, username, avatar_url, is_verified)')
        .eq('venture_id', venture.id)
        .eq('status', 'active')
        .order('is_founder', { ascending: false })
        .order('joined_date', { ascending: true }),

      supabase
        .from('venture_metrics')
        .select('*')
        .eq('venture_id', venture.id)
        .order('position', { ascending: true }),

      supabase
        .from('venture_metric_entries')
        .select('*')
        .eq('venture_id', venture.id)
        .order('date', { ascending: false })
        .limit(100),

      supabase
        .from('venture_looking_for')
        .select('*')
        .eq('venture_id', venture.id)
        .eq('status', 'open')
        .order('position', { ascending: true }),

      supabase
        .from('venture_updates')
        .select('*')
        .eq('venture_id', venture.id)
        .order('created_at', { ascending: false })
        .limit(20),

      // Linked projects (projects where venture_id matches)
      supabase
        .from('projects')
        .select('id, slug, name, description, tagline, icon, color, stage, project_number, cover_image_url, team_size, follower_count, view_count, last_activity_at')
        .eq('venture_id', venture.id)
        .order('last_activity_at', { ascending: false }),
    ])

    // User interaction state
    let is_following = false
    let is_saved = false
    if (user?.id) {
      const [{ data: fol }, { data: sav }] = await Promise.all([
        supabase.from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_type', 'venture')
          .eq('following_id', venture.id)
          .maybeSingle(),
        supabase.from('venture_saves')
          .select('venture_id')
          .eq('user_id', user.id)
          .eq('venture_id', venture.id)
          .maybeSingle(),
      ])
      is_following = !!fol
      is_saved = !!sav
    }

    // Fire-and-forget view tracking
    if (user?.id && venture.user_id !== user.id && venture.founder_id !== user.id) {
      supabase.rpc('record_venture_view', {
        p_venture_id: venture.id,
        p_viewer_id: user.id,
        p_source: 'direct',
      }).then(() => {}, () => {})
    }

    const isOwner = user?.id && (venture.user_id === user.id || venture.founder_id === user.id)

    return NextResponse.json({
      venture,
      team: teamRes.data || [],
      metrics: metricsRes.data || [],
      metric_entries: entriesRes.data || [],
      looking_for: lookingForRes.data || [],
      updates: updatesRes.data || [],
      linked_projects: linkedProjectsRes.data || [],
      is_owner: isOwner,
      is_following,
      is_saved,
    })
  } catch (e: any) {
    console.error('Venture detail error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

// PUT — patch update
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

    const { data: venture } = await supabase
      .from('ventures')
      .select('id, user_id, founder_id')
      .eq('slug', slug)
      .single()

    if (!venture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const isOwner = venture.user_id === user.id || venture.founder_id === user.id
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const allowed = [
      'name','tagline','description','logo_url','industry','sector','sub_category',
      'stage','funding_stage','funding_amount','runway','business_model','business_model_details',
      'mission','vision','why_now','problem','solution','target_market',
      'location','headquarters','website','pitch_deck_url',
      'tags','achievements','team_size','open_roles','is_building_public','show_in_explore',
      'key_metric_label','key_metric_value','revenue_range','user_count','monthly_growth',
      'growth_status'
    ]
    const patch: Record<string, any> = {}
    for (const k of allowed) {
      if (k in body) patch[k] = body[k]
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No editable fields' }, { status: 400 })
    }

    patch.updated_at = new Date().toISOString()
    patch.last_activity_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('ventures')
      .update(patch)
      .eq('id', venture.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, venture: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

// DELETE — archive
export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: venture } = await supabase
      .from('ventures')
      .select('id, user_id, founder_id')
      .eq('slug', slug)
      .single()

    if (!venture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (venture.user_id !== user.id && venture.founder_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('ventures')
      .update({ status: 'archived', is_building_public: false })
      .eq('id', venture.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
