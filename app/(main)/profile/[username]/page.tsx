import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProfileView } from '@/components/profile/ProfileView'

interface PageProps {
  params: { username: string }
}

export default async function ProfilePage({ params }: PageProps) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) {
    notFound()
  }

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  const isOwnProfile = currentUser?.id === profile.id

  const [
    { data: education },
    { data: experience },
    { data: skills },
    { data: journeyEvents },
    { data: startupMembers },
  ] = await Promise.all([
    supabase
      .from('user_education')
      .select('*, institutions(*)')
      .eq('user_id', profile.id)
      .order('start_year', { ascending: false }),
    supabase
      .from('user_experience')
      .select('*')
      .eq('user_id', profile.id)
      .order('start_date', { ascending: false }),
    supabase
      .from('user_skills')
      .select('*, skills(*)')
      .eq('user_id', profile.id),
    supabase
      .from('journey_events')
      .select('*')
      .eq('user_id', profile.id)
      .eq('visible', true)
      .order('event_date', { ascending: true }),
    supabase
      .from('startup_members')
      .select('*, startups(*)')
      .eq('user_id', profile.id)
      .eq('status', 'active'),
  ])

  return (
    <ProfileView
      profile={profile}
      education={education || []}
      experience={experience || []}
      skills={skills || []}
      journeyEvents={journeyEvents || []}
      startupMembers={startupMembers || []}
      isOwnProfile={isOwnProfile}
    />
  )
}