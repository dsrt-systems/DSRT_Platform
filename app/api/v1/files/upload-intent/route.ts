import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuthContext, requestUploadIntent, ok, fail } from '@/lib/kernel'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let ctx
  try {
    ctx = await requireAuthContext(req)
    const supabase = await createClient()
    const body = await req.json()

    const intent = await requestUploadIntent(supabase, {
      identityId: ctx.identityId,
      entityType: body.entity_type,
      entityId: body.entity_id,
      expectedSize: body.expected_size,
      expectedMime: body.expected_mime,
      originalName: body.original_name,
      bucket: body.bucket,
      visibility: body.visibility,
    })

    return ok(intent, { ctx })
  } catch (err) {
    return fail(err, ctx)
  }
}