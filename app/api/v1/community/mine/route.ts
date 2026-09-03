import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuthContext, ok, fail } from '@/lib/kernel'

export const dynamic = 'force-dynamic'

const COMMUNITY_FIELDS = `
  id, public_id, slug, name, short_description, cover_url, banner_url,
  category, community_type, visibility, join_policy, status,
  is_verified, member_count, post_count, topics, location_text,
  created_at, published_at, updated_at
`

export async function GET(req: NextRequest) {
  let ctx
  try {
    ctx = await requireAuthContext(req)
    const supabase = await createClient()

    const { data: memberships } = await supabase
      .from('community_memberships')
      .select(`
        id,
        community_id,
        status,
        joined_at,
        communities:community_id (${COMMUNITY_FIELDS}),
        community_membership_roles (
          community_roles ( role_key, name )
        )
      `)
      .eq('identity_id', ctx.identityId)
      .eq('status', 'ACTIVE')
      .order('joined_at', { ascending: false })

    const items = (memberships || [])
      .filter((m: any) => m.communities)
      .map((m: any) => {
        const roleKeys: string[] = (m.community_membership_roles || [])
          .map((r: any) => r.community_roles?.role_key)
          .filter(Boolean)
        const topRole = roleKeys.includes('OWNER')
          ? 'OWNER'
          : roleKeys.includes('ADMIN')
          ? 'ADMIN'
          : roleKeys.includes('MODERATOR')
          ? 'MODERATOR'
          : 'MEMBER'
        return {
          membership_id: m.id,
          joined_at: m.joined_at,
          role_keys: roleKeys,
          top_role: topRole,
          community: m.communities,
        }
      })

    // Also fetch active drafts
    const { data: drafts } = await supabase
      .from('community_drafts')
      .select('*')
      .eq('owner_identity_id', ctx.identityId)
      .eq('status', 'DRAFT')
      .order('updated_at', { ascending: false })
      .limit(6)

    return ok({ items, drafts: drafts || [] }, { ctx })
  } catch (err) {
    return fail(err, ctx)
  }
}