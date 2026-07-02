import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { VentureView } from '@/components/ventures/VentureView'

interface PageProps {
  params: { slug: string }
}

export default async function VenturePage({ params }: PageProps) {
  const supabase = createClient()

  const { data: venture } = await supabase
    .from('startups')
    .select('*, users:founder_id(*)')
    .eq('slug', params.slug)
    .single()

  if (!venture) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [
    { data: members },
    { data: milestones },
    { data: roles },
    { data: founderProfile },
  ] = await Promise.all([
    supabase
      .from('startup_members')
      .select('*, users(id, full_name, username, avatar_url, tagline)')
      .eq('startup_id', venture.id)
      .eq('status', 'active'),
    supabase
      .from('startup_milestones')
      .select('*')
      .eq('startup_id', venture.id)
      .order('achieved_date', { ascending: true }),
    supabase
      .from('startup_roles')
      .select('*')
      .eq('startup_id', venture.id)
      .eq('status', 'open'),
    supabase
      .from('venture_founder_profiles')
      .select('*')
      .eq('startup_id', venture.id)
      .eq('user_id', venture.founder_id)
      .maybeSingle(),
  ])

  const isMember = members?.some((m: any) => m.user_id === user?.id) || false
  const isFounder = venture.founder_id === user?.id

  return (
    <VentureView
      venture={venture}
      members={members || []}
      milestones={milestones || []}
      openRoles={roles || []}
      founderProfile={founderProfile}
      isMember={isMember}
      isFounder={isFounder}
      currentUserId={user?.id}
    />
  )
}