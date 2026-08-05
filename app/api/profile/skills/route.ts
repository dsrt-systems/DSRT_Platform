import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET all user skills
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('user_skills')
    .select('*, skills:skill_id(id, name, category)')
    .eq('user_id', user.id)

  return NextResponse.json({ skills: data || [] })
}

// POST — Add skill (creates skill if missing)
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, category, level, years_of_experience, is_top_skill } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const trimmedName = name.trim()
  const slug = trimmedName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
  const cat = category || 'Technical'

  // Find or create skill
  let { data: skill } = await supabase
    .from('skills')
    .select('id')
    .ilike('name', trimmedName)
    .maybeSingle()

  if (!skill) {
    const { data: newSkill, error: sErr } = await supabase
      .from('skills')
      .insert({ name: trimmedName, slug, category: cat, is_custom: true, added_by: user.id })
      .select('id')
      .single()
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })
    skill = newSkill
  }

  // Prevent duplicate user_skills
  const { data: existing } = await supabase
    .from('user_skills')
    .select('id')
    .eq('user_id', user.id)
    .eq('skill_id', skill!.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Skill already added' }, { status: 409 })

  const { data, error } = await supabase.from('user_skills').insert({
    user_id: user.id,
    skill_id: skill!.id,
    level: level || 'intermediate',
    years_of_experience: years_of_experience || null,
    is_top_skill: !!is_top_skill,
  }).select('*, skills:skill_id(id, name, category)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try { await supabase.rpc('recompute_user_badges', { p_user_id: user.id }) } catch {}

  return NextResponse.json({ skill: data })
}

// DELETE — Remove skill
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await supabase.from('user_skills').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}

