// ============================================================
// app/api/coco/cron/cleanup/route.ts
// Deletes unpinned conversations older than 48h.
// Call via Vercel Cron every 6 hours.
// ============================================================

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!authHeader || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await adminClient.rpc('coco_cleanup_old_conversations')
    if (error) throw error
    return NextResponse.json({
      ok: true,
      deleted: data || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}