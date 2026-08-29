'use client'

import { useState, useMemo } from 'react'
import { Plus } from '@phosphor-icons/react'
import { TeamGraphCanvas } from '../TeamGraphCanvas'
import { PositionInspector } from '../PositionInspector'
import { PositionEditorModal } from '../PositionEditorModal'
import { TeamInviteModal } from '../TeamInviteModal'
import { LinkOpportunityModal } from '../LinkOpportunityModal'
import { toast } from 'sonner'

interface Props {
  slug: string
  graphData: any
  isOwner: boolean
  onRefresh: () => void
  ventureName?: string   // ← ADDED
}

export function GraphPanel({ slug, graphData, isOwner, onRefresh, ventureName }: Props) {
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<any | null>(null)

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
      onRefresh()
      toast.success('Position archived')
    } catch {
      toast.error('Failed to remove position')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 relative">
      {isOwner && (
        <button
          onClick={handleAdd}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white text-black px-3.5 h-8 rounded-lg text-[12px] font-bold shadow-lg hover:bg-zinc-200 transition-colors"
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
          onRefresh={onRefresh}
        />
      </div>

      <div>
        <PositionInspector
          position={selectedPosition}
          memberships={graphData.memberships.filter((m: any) => m.position_id === selectedPositionId)}
          isOwner={isOwner}
          slug={slug}
          onRefresh={onRefresh}
          onClose={() => setSelectedPositionId(null)}
          onEdit={handleEdit}
          onInvite={handleInvite}
          onDelete={handleDelete}
          onLinkOpportunity={handleLink}
        />
      </div>

      <PositionEditorModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        slug={slug}
        existingPosition={editingPosition}
        onSuccess={onRefresh}
      />
      <TeamInviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        slug={slug}
        position={editingPosition}
        ventureName={ventureName || 'Venture'}                  // ← ADDED
        positions={graphData?.positions || []}                  // ← ADDED
        onSuccess={onRefresh}
      />
      <LinkOpportunityModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        slug={slug}
        position={editingPosition}
        onSuccess={onRefresh}
      />
    </div>
  )
}