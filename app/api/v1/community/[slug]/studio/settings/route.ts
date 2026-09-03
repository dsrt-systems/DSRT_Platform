import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuthContext, ok, fail, NotFoundError, ForbiddenError, writeAudit } from '@/lib/kernel'
import { hasCommunityPermission, COMMUNITY_PERMISSIONS } from '@/lib/community/permissions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  let ctx
  try {
    const { slug } = await params
    ctx = await requireAuthContext(req)
    const supabase = await createClient()

    const { data: community } = await supabase.from('communities').select('id').eq('slug', slug).maybeSingle()
    if (!community) throw new NotFoundError('Community', slug)

    const { data: settings } = await supabase
      .from('community_settings')
      .select('*')
      .eq('community_id', community.id)
      .maybeSingle()

    return ok({ settings }, { ctx })
  } catch (err) {
    return fail(err, ctx)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  let ctx
  try {
    const { slug } = await params
    ctx = await requireAuthContext(req)
    const supabase = await createClient()
    const body = await req.json().catch(() => ({}))

    const { data: community } = await supabase.from('communities').select('id').eq('slug', slug).maybeSingle()
    if (!community) throw new NotFoundError('Community', slug)

    const canManage = await hasCommunityPermission(
      supabase,
      ctx.identityId,
      community.id,
      COMMUNITY_PERMISSIONS.COMMUNITY_UPDATE
    )
    if (!canManage) throw new ForbiddenError('Not allowed')

    const allowed = [
      'allow_member_posts',
      'allow_member_polls',
      'allow_member_resources',
      'allow_member_invites',
      'allow_external_links',
      'allow_media_uploads',
      'require_post_approval',
      'require_application',
      'show_member_directory',
      'show_member_count',
      'default_post_visibility',
    ]
    const patch: Record<string, any> = {}
    for (const key of allowed) if (key in body) patch[key] = body[key]

    if (Object.keys(patch).length === 0) return ok({ updated: false }, { ctx })

    await supabase
      .from('community_settings')
      .upsert({ community_id: community.id, ...patch }, { onConflict: 'community_id' })

    await writeAudit(supabase, {
      actorId: ctx.identityId,
      action: 'community.settings.updated',
      entityType: 'community',
      entityId: community.id,
      requestId: ctx.requestId,
      metadata: { changed_keys: Object.keys(patch) },
    })

    return ok({ updated: true }, { ctx })
  } catch (err) {
    return fail(err, ctx)
  }
}