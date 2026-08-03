import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: true })

  const { signal_type, entity_type, entity_id, weight, metadata } = await request.json()
  if (!signal_type) return NextResponse.json({ error: 'Missing signal_type' }, { status: 400 })

  await supabase.from('user_activity_signals').insert({
    user_id: user.id,
    signal_type,
    entity_type: entity_type || null,
    entity_id: entity_id || null,
    weight: weight || 1.0,
    metadata: metadata || {},
  })

  return NextResponse.json({ ok: true })
}