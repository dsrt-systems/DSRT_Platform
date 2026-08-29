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
      venture:ventures(id, slug, name, tagline, logo_url, cover_url, stage, industry, headquarters),
      invited_by:users!invited_by_user_id(id, full_name, username, avatar_url, tagline),
      position:venture_team_positions(id, title, description, position_type, team_name, department, capacity, occupied_count, responsibilities)
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

    // Access control: Inviter, Venture owner/member, or Invited user
    const isInvitedUser = user && user.id === invitation.invited_user_id
    const isOwnerOrMember = user && await supabase.rpc('is_venture_owner_or_member', {
      p_venture_id: invitation.venture_id,
      p_user_id: user.id
    })

    if (!isInvitedUser && !isOwnerOrMember) {
      return NextResponse.json({ error: 'Unauthorized to view this invitation' }, { status: 403 })
    }

    const isExpired = new Date(invitation.expires_at) < new Date() && ['sent', 'viewed', 'held'].includes(invitation.status)

    return NextResponse.json({
      invitation,
      is_invited_user: isInvitedUser,
      is_owner_or_member: isOwnerOrMember,
      is_expired: isExpired,
    })
  } catch (e: any) {
    console.error('Fetch invitation error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to fetch invitation' }, { status: 500 })
  }
}