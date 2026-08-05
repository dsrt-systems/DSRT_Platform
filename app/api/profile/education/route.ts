import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('user_education')
    .select('*')
    .eq('user_id', user.id)
    .order('start_year', { ascending: false })

  return NextResponse.json({ education: data || [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { institution_id, institution_name, degree, field, start_year, end_year, is_current, grade, description, activities, societies, education_level } = body

  if (!institution_name?.trim() && !institution_id) {
    return NextResponse.json({ error: 'Institution required' }, { status: 400 })
  }

  const { data, error } = await supabase.from('user_education').insert({
    user_id: user.id,
    institution_id: institution_id || null,
    institution_name: institution_name?.trim() || null,
    degree: degree?.trim() || null,
    field: field?.trim() || null,
    start_year: start_year || null,
    end_year: is_current ? null : (end_year || null),
    is_current: !!is_current,
    grade: grade?.trim() || null,
    description: description?.trim() || null,
    activities: activities?.trim() || null,
    societies: societies?.trim() || null,
    education_level: education_level || 'undergraduate',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recompute badges (may trigger Verified Student)
  try { await supabase.rpc('recompute_user_badges', { p_user_id: user.id }) } catch {}

  return NextResponse.json({ education: data })
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('user_education')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ education: data })
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await supabase.from('user_education').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}