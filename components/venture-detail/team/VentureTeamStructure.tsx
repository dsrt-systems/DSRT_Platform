'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { GridFour, Briefcase, User, CircleNotch, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { TeamGraphCanvas } from './TeamGraphCanvas'
import { PositionInspector } from './PositionInspector'
import { PositionEditorModal } from './PositionEditorModal'
import { TeamInviteModal } from './TeamInviteModal'
import { LinkOpportunityModal } from './LinkOpportunityModal'
import { TeamDirectory } from './TeamDirectory'
import { TeamOpenRoles } from './TeamOpenRoles'

interface Props {
  venture: any
  team: any[]
  slug: string
  isOwner: boolean
  currentUserId: string | null
}

export function VentureTeamStructure({ venture, slug, isOwner, currentUserId }: Props) {
  const [view, setView] = useState<'graph' | 'members' | 'roles'>('graph')
  const [loading, setLoading] = useState(true)
  const [graphData, setGraphData] = useState<any>(null)

  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null)

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<any | null>(null)

  const loadGraph = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/team/graph`)
      if (!res.ok) throw new Error('Failed to load team graph')
      const json = await res.json()
      setGraphData(json)
    } catch (e) {
      toast.error('Could not load team structure')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { loadGraph() }, [loadGraph])

  const selectedPosition = useMemo(() => {
    if (!graphData || !selectedPositionId) return null
    return graphData.positions.find((p: any) => p.id === selectedPositionId) || null
  }, [graphData, selectedPositionId])

  const handleEdit = (pos: any) => { setEditingPosition(pos); setEditModalOpen(true) }
  const handleAdd = () => { setEditingPosition(null); setEditModalOpen(true) }
  const handleInvite = (pos: any) => { setEditingPosition(pos); setInviteModalOpen(true) }
  const handleLink = (pos: any) => { setEditingPosition(pos); setLinkModalOpen(true) }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/ventures/${slug}/team/positions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSelectedPositionId(null)
      loadGraph()
      toast.success('Position archived')
    } catch {
      toast.error('Failed to remove position')
    }
  }

  return (
    <div className="relative">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-[19px] font-bold text-white">Team Structure</h2>
          <p className="text-[12.5px] text-white/45 mt-0.5">How the team is organized and what roles are open</p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-lg p-1">
          <button onClick={() => setView('graph')}
            className={'flex items-center gap-1.5 text-[12px] font-semibold px-3 h-7 rounded-md transition-colors ' +
              (view === 'graph' ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white')}>
            <GridFour size={12} weight="fill" /> Graph
          </button>
          <button onClick={() => setView('members')}
            className={'flex items-center gap-1.5 text-[12px] font-semibold px-3 h-7 rounded-md transition-colors ' +
              (view === 'members' ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white')}>
            <User size={12} weight="fill" /> Members
          </button>
          <button onClick={() => setView('roles')}
            className={'flex items-center gap-1.5 text-[12px] font-semibold px-3 h-7 rounded-md transition-colors ' +
              (view === 'roles' ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white')}>
            <Briefcase size={12} weight="fill" /> Roles
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[500px] rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-zinc-500">
          <CircleNotch size={20} className="animate-spin mr-2" /> Loading structure...
        </div>
      ) : view === 'graph' && graphData ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 relative">

          {isOwner && (
            <button
              onClick={handleAdd}
              className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white text-black px-3 h-8 rounded-md text-[12px] font-bold shadow-lg hover:bg-zinc-200 transition-colors"
            >
              <Plus size={12} weight="bold" /> Add Position
            </button>
          )}

          <div className="bg-[#09090b] border border-white/[0.06] rounded-2xl overflow-hidden shadow-inner relative h-[600px]">
            <TeamGraphCanvas
              slug={slug}
              data={graphData}
              isOwner={isOwner}
              onNodeSelect={setSelectedPositionId}
              onRefresh={loadGraph}
            />
          </div>

          <div>
            <PositionInspector
              position={selectedPosition}
              memberships={graphData.memberships.filter((m: any) => m.position_id === selectedPositionId)}
              isOwner={isOwner}
              slug={slug}
              onRefresh={loadGraph}
              onClose={() => setSelectedPositionId(null)}
              onEdit={handleEdit}
              onInvite={handleInvite}
              onDelete={handleDelete}
              onLinkOpportunity={handleLink}
            />
          </div>
        </div>
      ) : view === 'members' && graphData ? (
        <TeamDirectory memberships={graphData.memberships} positions={graphData.positions} />
      ) : view === 'roles' && graphData ? (
        <TeamOpenRoles
          positions={graphData.positions}
          isOwner={isOwner}
          slug={slug}
          ventureId={venture.id}
        />
      ) : null}

      {/* Modals */}
      <PositionEditorModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        slug={slug}
        existingPosition={editingPosition}
        onSuccess={loadGraph}
      />
      <TeamInviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        slug={slug}
        position={editingPosition}
        onSuccess={loadGraph}
      />
      <LinkOpportunityModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        slug={slug}
        position={editingPosition}
        onSuccess={loadGraph}
      />
    </div>
  )
}