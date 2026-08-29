import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    let query = supabase.from('venture_team_invitations').select(`
      *,
      venture:ventures(id, slug, name, tagline, logo_url, cover_url, stage, industry, headquarters, description),
      invited_by:users!invited_by_user_id(id, full_name, username, avatar_url, tagline),
      invited_user:users!invited_user_id(id, full_name, username, avatar_url),
      position:venture_team_positions(id, title, description, position_type, team_name, department, capacity, occupied_count, responsibilities, required_skills)
    `)

    if (isUUID) {
      query = query.eq('id', id)
    } else {
      query = query.eq('secure_token', id)
    }

    const { data: invitation, error } = await query.maybeSingle()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Access control: recipient, inviter, or venture member
    const isInvitedUser = user && user.id === invitation.invited_user_id
    let isOwnerOrMember = false

    if (user) {
      const { data: memberCheck } = await supabase.rpc('is_venture_owner_or_member', {
        p_venture_id: invitation.venture_id,
        p_user_id: user.id
      })
      isOwnerOrMember = !!memberCheck
    }

    if (!isInvitedUser && !isOwnerOrMember) {
      return NextResponse.json({ error: 'Unauthorized to view this invitation' }, { status: 403 })
    }

    // Check expiration state
    const isExpired = invitation.expires_at
      && new Date(invitation.expires_at) < new Date()
      && ['sent', 'viewed', 'held'].includes(invitation.status)

    // Auto-transition expired invitations
    if (isExpired && invitation.status !== 'expired') {
      await supabase
        .from('venture_team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)
      invitation.status = 'expired'
    }

    return NextResponse.json({
      invitation,
      is_invited_user: isInvitedUser,
      is_owner_or_member: isOwnerOrMember,
      is_expired: isExpired,
      can_accept: isInvitedUser && ['sent', 'viewed', 'held'].includes(invitation.status) && !isExpired,
      can_hold: isInvitedUser && ['sent', 'viewed'].includes(invitation.status) && !isExpired,
      can_reject: isInvitedUser && ['sent', 'viewed', 'held'].includes(invitation.status) && !isExpired,
      can_revoke: isOwnerOrMember && ['draft', 'sent', 'viewed', 'held'].includes(invitation.status),
      can_resend: isOwnerOrMember && ['sent', 'viewed', 'held', 'expired'].includes(invitation.status),
    })
  } catch (e: any) {
    console.error('Fetch invitation error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to fetch invitation' }, { status: 500 })
  }
}