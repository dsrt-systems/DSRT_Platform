import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // People I follow
  const { data: following } = await supabase
    .from('follows')
    .select(`
      following_id, created_at,
      users:following_id (id, full_name, username, avatar_url, tagline, brings, location, execution_score)
    `)
    .eq('follower_id', user.id)
    .eq('following_type', 'user')
    .order('created_at', { ascending: false })

  // People who follow me
  const { data: followers } = await supabase
    .from('follows')
    .select(`
      follower_id, created_at,
      users:follower_id (id, full_name, username, avatar_url, tagline, brings, location, execution_score)
    `)
    .eq('following_id', user.id)
    .eq('following_type', 'user')
    .order('created_at', { ascending: false })

  // Connections (accepted)
  const { data: connections } = await supabase
    .from('builder_connections')
    .select(`
      id, status, created_at,
      requester:requester_id (id, full_name, username, avatar_url, tagline, brings, location),
      recipient:recipient_id (id, full_name, username, avatar_url, tagline, brings, location)
    `)
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })

  // Pending sent
  const { data: pendingSent } = await supabase
    .from('builder_connections')
    .select(`
      id, message, created_at,
      recipient:recipient_id (id, full_name, username, avatar_url, tagline)
    `)
    .eq('requester_id', user.id)
    .eq('status', 'pending')

  // Pending received
  const { data: pendingReceived } = await supabase
    .from('builder_connections')
    .select(`
      id, message, created_at,
      requester:requester_id (id, full_name, username, avatar_url, tagline)
    `)
    .eq('recipient_id', user.id)
    .eq('status', 'pending')

  // Suggested (from algorithm)
  const { data: suggested } = await supabase.rpc('dsrt_recommend', {
    p_user_id: user.id,
    p_entity_type: 'person',
    p_limit: 8,
  })

    let suggestedPeople: any[] = []
  if (suggested && suggested.length > 0) {
    const ids: string[] = (suggested as Array<{ entity_id: string }>).map(s => s.entity_id)
    const { data: people } = await supabase
      .from('users')
      .select('id, full_name, username, avatar_url, tagline, brings, location, execution_score')
      .in('id', ids)

    type ScoreEntry = { score: number; reason: string }
    const scoreMap = new Map<string, ScoreEntry>(
      (suggested as Array<any>).map(s => [
        s.entity_id as string,
        { score: Number(s.score) || 0, reason: String(s.reason || '') },
      ])
    )

    suggestedPeople = (people || []).map(p => {
      const entry: ScoreEntry = scoreMap.get(p.id) || { score: 0, reason: 'Suggested for you' }
      return {
        ...p,
        match_score: Math.min(99, Math.max(60, Math.round(entry.score * 0.8))),
        match_reason: entry.reason || 'Suggested for you',
      }
    }).sort((a, b) => b.match_score - a.match_score)
  }

  const followingPeople = (following || []).map((f: any) => f.users).filter(Boolean)
  const followerPeople = (followers || []).map((f: any) => f.users).filter(Boolean)
  const connectedPeople = (connections || []).map((c: any) => {
    return c.requester?.id === user.id ? c.recipient : c.requester
  }).filter(Boolean)

  return NextResponse.json({
    following: followingPeople,
    followers: followerPeople,
    connections: connectedPeople,
    pending_sent: pendingSent || [],
    pending_received: pendingReceived || [],
    suggested: suggestedPeople,
    counts: {
      following: followingPeople.length,
      followers: followerPeople.length,
      connections: connectedPeople.length,
      pending: (pendingSent?.length || 0) + (pendingReceived?.length || 0),
    },
  })
}