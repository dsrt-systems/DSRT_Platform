'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CircleNotch, WarningCircle } from '@phosphor-icons/react'
import { useTeamData } from './hooks/useTeamData'
import { TeamSubNav, type TeamSection } from './TeamSubNav'
import { GraphPanel } from './panels/GraphPanel'
import { DirectoryPanel } from './panels/DirectoryPanel'
import { StructurePanel } from './panels/StructurePanel'
import { InvitationsPanel } from './panels/InvitationsPanel'
import { RequestsPanel } from './panels/RequestsPanel'
import { RolesPanel } from './panels/RolesPanel'
import { OpenRolesPanel } from './panels/OpenRolesPanel'
import { ActivityPanel } from './panels/ActivityPanel'

interface Props {
  venture: any
  team: any[]
  slug: string
  isOwner: boolean
  currentUserId: string | null
}

const VALID_SECTIONS: TeamSection[] = [
  'graph',
  'directory',
  'structure',
  'invitations',
  'requests',
  'roles',
  'open-roles',
  'activity',
]

export function VentureTeamStructure({ venture, slug, isOwner, currentUserId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeSection, setActiveSection] = useState<TeamSection>('graph')

  // Sync URL param with active section
  useEffect(() => {
    const section = searchParams.get('section')
    if (section && VALID_SECTIONS.includes(section as TeamSection)) {
      setActiveSection(section as TeamSection)
    }
  }, [searchParams])

  const handleSectionChange = (section: TeamSection) => {
    setActiveSection(section)
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', section)
    router.replace(`/ventures/${slug}?${params.toString()}`, { scroll: false })
  }

  const {
    graph,
    invitations,
    requests,
    activity,
    stats,
    loading,
    error,
    reloadAll,
    loadInvitations,
    loadRequests,
  } = useTeamData(slug, venture.id, isOwner)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[20px] font-bold text-white">Team & Governance</h2>
          <p className="text-[12.5px] text-zinc-400 mt-0.5">
            Organizational structure, membership, invitations, and access control
          </p>
        </div>

        {/* Live stats pill */}
        <div className="flex items-center gap-4 text-[11.5px] text-zinc-500">
          <span>
            <span className="font-bold text-white">{stats.activeMembers}</span> active
          </span>
          {stats.pendingInvitations > 0 && (
            <>
              <span className="text-zinc-700">·</span>
              <span>
                <span className="font-bold text-white">{stats.pendingInvitations}</span> pending
              </span>
            </>
          )}
          {stats.openPositions > 0 && (
            <>
              <span className="text-zinc-700">·</span>
              <span>
                <span className="font-bold text-white">{stats.openPositions}</span> open
              </span>
            </>
          )}
        </div>
      </div>

      {/* Sub-Navigation */}
      <TeamSubNav
        activeSection={activeSection}
        onSelect={handleSectionChange}
        stats={stats}
        isOwner={isOwner}
      />

      {/* Content */}
      {loading ? (
        <div className="h-[500px] rounded-2xl border border-white/[0.06] bg-[#121215]/50 flex items-center justify-center text-zinc-500 text-xs gap-2">
          <CircleNotch size={18} className="animate-spin" /> Loading team workspace…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <WarningCircle size={24} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-[14px] font-bold text-white mb-1">Failed to load team</h3>
          <p className="text-[12px] text-zinc-400 mb-4">{error}</p>
          <button
            onClick={reloadAll}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[12.5px] font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div>
          {activeSection === 'graph' && graph && (
            <GraphPanel
              slug={slug}
              graphData={graph}
              isOwner={isOwner}
              onRefresh={reloadAll}
              ventureName={venture.name}
            />
          )}

          {activeSection === 'directory' && graph && (
            <DirectoryPanel
              slug={slug}
              memberships={graph.memberships}
              positions={graph.positions}
              isOwner={isOwner}
              currentUserId={currentUserId}
              onRefresh={reloadAll}
            />
          )}

          {activeSection === 'structure' && graph && (
            <StructurePanel
              positions={graph.positions}
              memberships={graph.memberships}
            />
          )}

          {activeSection === 'invitations' && isOwner && (
            <InvitationsPanel
              invitations={invitations}
              onRefresh={loadInvitations}
            />
          )}

          {activeSection === 'requests' && isOwner && (
            <RequestsPanel
              requests={requests}
              slug={slug}
              onRefresh={loadRequests}
            />
          )}

          {activeSection === 'roles' && isOwner && (
            <RolesPanel
              slug={slug}
              isOwner={isOwner}
            />
          )}

          {activeSection === 'open-roles' && (
            <OpenRolesPanel
              slug={slug}
              ventureId={venture.id}
              isOwner={isOwner}
              positions={graph?.positions || []}
            />
          )}

          {activeSection === 'activity' && isOwner && (
            <ActivityPanel activity={activity} />
          )}
        </div>
      )}
    </div>
  )
}