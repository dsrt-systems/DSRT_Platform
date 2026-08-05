import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_FIELDS = [
  'full_name', 'username', 'tagline', 'bio', 'location',
  'banner_url', 'avatar_url', 'website', 'github_url', 'linkedin_url', 'twitter_url',
  'languages', 'availability', 'availability_hours', 'open_to_collaboration',
  'collaboration_types', 'looking_for_opportunities', 'interest_topics',
  'brings', 'seeking', 'show_builder_score', 'social_links', 'custom_links',
  'section_visibility', 'actively_building_type', 'actively_building_id',
  'profile_completion_dismissed', 'is_open_to_work', 'is_hiring',
  'contact_email', 'contact_phone', 'show_contact',
]

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const key of ALLOWED_FIELDS) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recompute badges + profile completion
  try { await supabase.rpc('recompute_user_badges', { p_user_id: user.id }) } catch {}

  return NextResponse.json({ user: data })
}