import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json().catch(() => ({}))
  const { session_id, source = 'direct', referrer_url, dwell_ms, device_type } = body

  try {
    // Check if owner (don't inflate stats)
    const { data: opp } = await supabase.from('opportunities')
      .select('poster_user_id')
      .eq('id', id)
      .single()

    const isOwner = user?.id === opp?.poster_user_id

    // Record view
    await supabase.from('opportunity_views').insert({
      opportunity_id: id,
      viewer_id: user?.id || null,
      session_id: session_id || null,
      source,
      referrer_url: referrer_url || null,
      dwell_ms: dwell_ms || null,
      device_type: device_type || null,
    }).then(() => {}, () => {})

    // Increment counters (skip if owner)
    if (!isOwner) {
      await supabase.rpc('increment_opportunity_view_count', { p_id: id })
        .then(() => {}, async () => {
          // Fallback: manual increment
          const { data: current } = await supabase.from('opportunities')
            .select('view_count').eq('id', id).single()
          if (current) {
            await supabase.from('opportunities')
              .update({ view_count: (current.view_count || 0) + 1 })
              .eq('id', id)
          }
        })
    }

    // Signal
    if (user) {
      const signalType = dwell_ms && dwell_ms > 30000 ? 'dwell_30s'
                     : dwell_ms && dwell_ms > 10000 ? 'dwell_10s'
                     : 'view'
      const weight = dwell_ms && dwell_ms > 30000 ? 3
                  : dwell_ms && dwell_ms > 10000 ? 2
                  : 1

      await supabase.from('user_activity_signals').insert({
        user_id: user.id,
        signal_type: signalType,
        entity_type: 'opportunity',
        entity_id: id,
        weight,
        dwell_ms: dwell_ms || null,
        session_id: session_id || null,
      }).then(() => {}, () => {})
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('View tracking error:', e)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}