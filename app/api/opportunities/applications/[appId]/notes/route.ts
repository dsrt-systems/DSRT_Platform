import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function assertManager(supabase: any, userId: string, appId: string) {
  const { data: app } = await supabase
    .from('opportunity_applications')
    .select('opportunity_id')
    .eq('id', appId)
    .single()
  if (!app) return { ok: false, code: 404 }

  const { data: opp } = await supabase
    .from('opportunities')
    .select('poster_user_id')
    .eq('id', app.opportunity_id)
    .single()
  if (!opp) return { ok: false, code: 404 }

  if (opp.poster_user_id === userId) return { ok: true, opp_id: app.opportunity_id }

  const { data: m } = await supabase
    .from('opportunity_members')
    .select('role')
    .eq('opportunity_id', app.opportunity_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (m && ['owner', 'admin', 'manager', 'reviewer'].includes((m as any).role)) {
    return { ok: true, opp_id: app.opportunity_id }
  }
  return { ok: false, code: 403 }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gate = await assertManager(supabase, user.id, appId)
  if (!gate.ok) return NextResponse.json({ error: gate.code === 404 ? 'Not found' : 'Forbidden' }, { status: gate.code })

  const body = await req.json().catch(() => ({}))
  const text = String(body.body || '').trim()
  if (!text) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const { data, error } = await supabase
    .from('opportunity_internal_notes')
    .insert({
      opportunity_id: gate.opp_id,
      application_id: appId,
      author_id: user.id,
      body: text.slice(0, 5000),
      mentions: Array.isArray(body.mentions) ? body.mentions : [],
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
    })
    .select('id, author_id, body, mentions, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}