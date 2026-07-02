import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.length < 2) {
    return NextResponse.json({
      users: [],
      projects: [],
      ventures: [],
      communities: [],
    })
  }

  // Try full-text search first, fallback to ilike if no results
  const tsQuery = q
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^\w]/g, '') + ':*')
    .filter(Boolean)
    .join(' & ')

  // --- USERS ---
  let users: any[] = []
  try {
    if (tsQuery) {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url, tagline')
        .textSearch('search_vector', tsQuery, { config: 'english' })
        .eq('onboarding_complete', true)
        .limit(5)
      users = data || []
    }
  } catch {}

  if (users.length === 0) {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, username, avatar_url, tagline')
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,tagline.ilike.%${q}%`)
      .eq('onboarding_complete', true)
      .limit(5)
    users = data || []
  }

  // --- PROJECTS ---
  let projects: any[] = []
  try {
    if (tsQuery) {
      const { data } = await supabase
        .from('projects')
        .select('id, slug, title, tagline')
        .textSearch('search_vector', tsQuery, { config: 'english' })
        .limit(5)
      projects = data || []
    }
  } catch {}

  if (projects.length === 0) {
    const { data } = await supabase
      .from('projects')
      .select('id, slug, title, tagline')
      .or(`title.ilike.%${q}%,tagline.ilike.%${q}%`)
      .limit(5)
    projects = data || []
  }

  // --- VENTURES (startups) ---
  let ventures: any[] = []
  try {
    if (tsQuery) {
      const { data } = await supabase
        .from('startups')
        .select('id, slug, name, tagline')
        .textSearch('search_vector', tsQuery, { config: 'english' })
        .limit(5)
      ventures = data || []
    }
  } catch {}

  if (ventures.length === 0) {
    const { data } = await supabase
      .from('startups')
      .select('id, slug, name, tagline')
      .or(`name.ilike.%${q}%,tagline.ilike.%${q}%`)
      .limit(5)
    ventures = data || []
  }

  // --- COMMUNITIES ---
  const { data: communitiesData } = await supabase
    .from('communities')
    .select('id, slug, name')
    .ilike('name', `%${q}%`)
    .limit(5)

  return NextResponse.json({
    users,
    projects,
    ventures,
    communities: communitiesData || [],
  })
}