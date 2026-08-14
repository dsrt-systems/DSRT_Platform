import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.role_id) return NextResponse.json({ error: 'role_id required' }, { status: 400 })

  const { data: venture } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  if (!venture) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check not already applied
  const existing = await supabase.from('venture_role_applications')
    .select('id').eq('role_id', body.role_id).eq('applicant_id', user.id).maybeSingle()
  if (existing.data) return NextResponse.json({ error: 'Already applied' }, { status: 409 })

  const { data, error } = await supabase.from('venture_role_applications').insert({
    venture_id: venture.id,
    role_id: body.role_id,
    applicant_id: user.id,
    cover_letter: body.cover_letter || null,
    resume_url: body.resume_url || null,
    portfolio_url: body.portfolio_url || null,
    github_url: body.github_url || null,
    linkedin_url: body.linkedin_url || null,
    availability: body.availability || null,
    expected_hours: body.expected_hours || null,
    answers: body.answers || {},
    status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data })
}