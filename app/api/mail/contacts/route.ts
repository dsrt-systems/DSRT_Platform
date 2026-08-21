import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ contacts: [] })

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()

  if (q.length < 2) return NextResponse.json({ contacts: [] })

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, username, avatar_url, dsrt_email, tagline')
    .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,dsrt_email.ilike.%${q}%`)
    .neq('id', user.id)
    .limit(8)

  const contacts = (users || []).map(u => ({
    id: u.id,
    name: u.full_name || u.username,
    handle: `@${u.username}`,
    email: u.dsrt_email || `${u.username}@dsrt.com`,
    avatar_url: u.avatar_url,
    tagline: u.tagline,
  }))

  return NextResponse.json({ contacts })
}