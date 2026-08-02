import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { VentureDetailView } from '@/components/ventures/VentureDetailView'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function VentureDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createClient()

  const { data: venture } = await supabase
    .from('ventures')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!venture) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === venture.user_id

  const [
    { data: teamMembers },
    { data: metrics },
    { data: updates },
    { data: lookingFor },
    { data: documents },
  ] = await Promise.all([
    supabase.from('venture_team_members').select('*').eq('venture_id', venture.id).order('position'),
    supabase.from('venture_metrics').select('*').eq('venture_id', venture.id).order('position'),
    supabase.from('venture_updates').select('*').eq('venture_id', venture.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('venture_looking_for').select('*').eq('venture_id', venture.id).order('position'),
    supabase.from('venture_documents').select('*').eq('venture_id', venture.id).order('created_at', { ascending: false }),
  ])

  return (
    <VentureDetailView
      venture={venture}
      isOwner={isOwner}
      currentUser={user}
      teamMembers={teamMembers || []}
      metrics={metrics || []}
      updates={updates || []}
      lookingFor={lookingFor || []}
      documents={documents || []}
    />
  )
}