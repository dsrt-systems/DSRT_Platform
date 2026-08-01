import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 1) {
    return NextResponse.json({ 
      users: [], 
      projects: [], 
      communities: [],
    })
  }

  const searchTerm = `%${query}%`

  const [
    { data: users },
    { data: projects },
    { data: communities },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, username, avatar_url, tagline, brings, follower_count')
      .or(`full_name.ilike.${searchTerm},username.ilike.${searchTerm},tagline.ilike.${searchTerm}`)
      .eq('onboarding_complete', true)
      .neq('id', user.id)
      .limit(8),
    supabase
      .from('projects')
      .select('id, name, slug, icon, color, sector, description, progress_percent, founder_id')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},sector.ilike.${searchTerm}`)
      .limit(8),
    supabase
      .from('communities')
      .select('id, name, slug, description, member_count, icon_color, is_verified')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .eq('is_public', true)
      .limit(8),
  ])

  return NextResponse.json({ 
    users: users || [], 
    projects: projects || [], 
    communities: communities || [],
  })
}