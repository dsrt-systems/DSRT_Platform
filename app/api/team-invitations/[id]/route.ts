import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', id)
      .single()

    if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })

    // Only inviter or invitee can view
    if (invitation.inviter_id !== user.id && invitation.invitee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark as viewed if invitee is opening it for the first time
    if (invitation.invitee_id === user.id && !invitation.viewed_at) {
      await supabase
        .from('team_invitations')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', id)
    }

    // Enrich with profiles
    const [{ data: inviter }, { data: invitee }] = await Promise.all([
      supabase.from('users').select('id, full_name, username, avatar_url, is_verified').eq('id', invitation.inviter_id).single(),
      supabase.from('users').select('id, full_name, username, avatar_url, is_verified').eq('id', invitation.invitee_id).single(),
    ])

    // Enrich with opportunity
    const { data: opp } = await supabase
      .from('opportunities')
      .select('id, title, slug, opportunity_type')
      .eq('id', invitation.opportunity_id)
      .single()

    // Enrich with destination details
    let destination = null
    if (invitation.destination_type === 'project') {
      const { data: p } = await supabase.from('projects').select('id, name, slug, icon, tagline').eq('id', invitation.destination_id).single()
      destination = p
    } else {
      const { data: v } = await supabase.from('ventures').select('id, name, slug, logo_url, tagline').eq('id', invitation.destination_id).single()
      destination = v
    }

    return NextResponse.json({
      invitation,
      inviter,
      invitee,
      opportunity: opp,
      destination,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}