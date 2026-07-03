import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { HackathonView } from '@/components/hackathons/HackathonView'

interface PageProps {
  params: { slug: string }
}

export default async function HackathonPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: hackathon } = await supabase
    .from('hackathons')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!hackathon) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: registered }, { count: totalRegistered }] = await Promise.all([
    supabase
      .from('hackathon_registrations')
      .select('id')
      .eq('hackathon_id', hackathon.id)
      .eq('user_id', user?.id || '')
      .maybeSingle(),
    supabase
      .from('hackathon_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('hackathon_id', hackathon.id),
  ])

  return (
    <HackathonView
      hackathon={hackathon}
      isRegistered={!!registered}
      totalRegistered={totalRegistered || 0}
    />
  )
}