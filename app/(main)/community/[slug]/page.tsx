import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CommunityView } from '@/components/community/CommunityView'

interface PageProps {
  params: { slug: string }
}

export default async function CommunityPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: community } = await supabase
    .from('communities')
    .select('*, institutions(*)')
    .eq('slug', params.slug)
    .single()

  if (!community) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: members }, { data: projects }, { data: ventures }] =
    await Promise.all([
      supabase
        .from('community_members')
        .select('*, users(id, full_name, username, avatar_url, tagline)')
        .eq('community_id', community.id)
        .limit(12),
      supabase
        .from('projects')
        .select('*')
        .eq('community_id', community.id)
        .limit(6),
      supabase
        .from('startups')
        .select('*')
        .eq('institution_id', community.institution_id)
        .limit(6),
    ])

  const isMember = members?.some((m: any) => m.user_id === user?.id) || false

  return (
    <CommunityView
      community={community}
      members={members || []}
      projects={projects || []}
      ventures={ventures || []}
      isMember={isMember}
      currentUserId={user?.id}
    />
  )
}