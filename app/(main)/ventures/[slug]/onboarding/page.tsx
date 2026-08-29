import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingClient } from './OnboardingClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ invitation?: string }>
}

export default async function VentureOnboardingPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { invitation: invitationId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/ventures/${slug}/onboarding`)

  // Fetch venture
  const { data: venture } = await supabase
    .from('ventures')
    .select('id, slug, name, tagline, logo_url, cover_url, description, stage, industry, headquarters')
    .eq('slug', slug)
    .single()

  if (!venture) redirect('/ventures')

  // Fetch this user's active membership
  const { data: membership } = await supabase
    .from('venture_team_memberships')
    .select(`
      *,
      position:venture_team_positions(id, title, description, team_name, department, responsibilities, required_skills, parent_position_id),
      invited_by:users!invited_by(id, full_name, username, avatar_url),
      invitation:venture_team_invitations!invitation_id(personal_message)
    `)
    .eq('venture_id', venture.id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) {
    // Not a member yet, redirect
    redirect(`/ventures/${slug}`)
  }

  // If onboarding already completed, redirect to venture
  if (membership.onboarding_completed_at) {
    redirect(`/ventures/${slug}`)
  }

  // Fetch nearby team members for the graph step
  const { data: teamMembers } = await supabase
    .from('venture_team_memberships')
    .select(`
      *,
      user:users(id, full_name, username, avatar_url),
      position:venture_team_positions(id, title, team_name, parent_position_id)
    `)
    .eq('venture_id', venture.id)
    .eq('status', 'active')
    .limit(20)

  return (
    <OnboardingClient
      venture={venture}
      membership={membership}
      teamMembers={teamMembers || []}
      currentUserId={user.id}
    />
  )
}