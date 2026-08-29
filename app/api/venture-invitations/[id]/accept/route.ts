import { getVentureServices } from '@/lib/venture'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { supabase, invitations } = await getVentureServices()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const membership = await invitations.acceptInvitation(id, user.id)

    // Append system event to mail thread
    try {
      const { mailBridge } = await getVentureServices()
      await mailBridge.appendSystemEvent(id, 'invitation.accepted', {
        membership_id: membership.id
      })
    } catch {}

    // Fetch venture slug for redirect
    const { data: venture } = await supabase
      .from('ventures')
      .select('slug, name')
      .eq('id', membership.venture_id)
      .single()

    return NextResponse.json({
      success: true,
      membership,
      venture_slug: venture?.slug,
      venture_name: venture?.name,
      redirect_url: venture?.slug ? `/ventures/${venture.slug}?welcome=1` : null,
    })
  } catch (e: any) {
    console.error('Accept invitation error:', e)
    return NextResponse.json({
      success: false,
      error: e?.message || 'Failed to accept invitation'
    }, { status: 400 })
  }
}