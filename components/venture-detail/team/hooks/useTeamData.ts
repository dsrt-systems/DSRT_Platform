'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface TeamData {
  positions: any[]
  relationships: any[]
  memberships: any[]
  layout: any[]
  canEdit: boolean
}

export interface TeamStats {
  activeMembers: number
  pendingInvitations: number
  pendingRequests: number
  openPositions: number
  linkedOpportunities: number
}

export function useTeamData(slug: string, ventureId: string, isOwner: boolean) {
  const supabase = createClient()

  const [graph, setGraph] = useState<TeamData | null>(null)
  const [invitations, setInvitations] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // === Data Fetchers ===

  const loadGraph = useCallback(async () => {
    try {
      const res = await fetch(`/api/ventures/${slug}/team/graph`)
      if (!res.ok) throw new Error('Failed to load team graph')
      const json = await res.json()
      setGraph(json)
    } catch (e: any) {
      setError(e.message)
    }
  }, [slug])

  const loadInvitations = useCallback(async () => {
    if (!isOwner) return
    try {
      const res = await fetch(`/api/ventures/${slug}/team/invitations?status=all`)
      if (res.ok) {
        const json = await res.json()
        setInvitations(json.invitations || [])
      }
    } catch {}
  }, [slug, isOwner])

  const loadRequests = useCallback(async () => {
    if (!isOwner) return
    try {
      const res = await fetch(`/api/ventures/${slug}/team/requests`)
      if (res.ok) {
        const json = await res.json()
        setRequests(json.requests || [])
      }
    } catch {}
  }, [slug, isOwner])

  const loadActivity = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('venture_team_activity')
        .select('*, actor:users!actor_id(id, full_name, username, avatar_url)')
        .eq('venture_id', ventureId)
        .order('created_at', { ascending: false })
        .limit(100)
      setActivity(data || [])
    } catch {}
  }, [supabase, ventureId])

  const reloadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    await Promise.all([
      loadGraph(),
      loadInvitations(),
      loadRequests(),
      loadActivity()
    ])
    setLoading(false)
  }, [loadGraph, loadInvitations, loadRequests, loadActivity])

  // === Initial Load ===
  useEffect(() => { reloadAll() }, [reloadAll])

  // === Real-time Subscriptions ===
  useEffect(() => {
    if (!ventureId) return

    const channel = supabase
      .channel(`team-workspace:${ventureId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'venture_team_positions', filter: `venture_id=eq.${ventureId}` },
        () => loadGraph()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'venture_team_memberships', filter: `venture_id=eq.${ventureId}` },
        () => loadGraph()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'venture_team_invitations', filter: `venture_id=eq.${ventureId}` },
        () => { loadInvitations(); loadActivity() }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'venture_join_requests', filter: `venture_id=eq.${ventureId}` },
        () => { loadRequests(); loadActivity() }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'venture_team_activity', filter: `venture_id=eq.${ventureId}` },
        () => loadActivity()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ventureId, supabase, loadGraph, loadInvitations, loadRequests, loadActivity])

  // === Derived Stats ===
  const stats: TeamStats = {
    activeMembers: graph?.memberships.filter(m => m.status === 'active').length || 0,
    pendingInvitations: invitations.filter(i => ['sent', 'viewed', 'held'].includes(i.status)).length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    openPositions: graph?.positions.filter(p => p.status === 'open' || p.status === 'recruiting').length || 0,
    linkedOpportunities: graph?.positions.filter(p => p.linked_opportunity_id).length || 0
  }

  return {
    graph,
    invitations,
    requests,
    activity,
    stats,
    loading,
    error,
    reloadAll,
    loadGraph,
    loadInvitations,
    loadRequests,
    loadActivity
  }
}