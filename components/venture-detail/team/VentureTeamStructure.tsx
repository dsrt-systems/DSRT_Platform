'use client'

import { useState, useCallback, useMemo } from 'react'
import ReactFlow, { Background, Controls, MiniMap, Panel, ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus, UsersThree, MagnifyingGlass, GridFour, ListBullets, Briefcase, User } from '@phosphor-icons/react'
import { VentureMemberNode } from './nodes/VentureMemberNode'
import { VentureRoleNode } from './nodes/VentureRoleNode'

interface Props {
  venture: any
  team: any[]
  slug: string
  isOwner: boolean
  currentUserId: string | null
}

const nodeTypes = {
  member: VentureMemberNode,
  role: VentureRoleNode,
}

const LEGEND_ITEMS = [
  { color: 'bg-purple-400', label: 'Leadership' },
  { color: 'bg-cyan-400', label: 'Ownership' },
  { color: 'bg-emerald-400', label: 'Collaboration' },
  { color: 'bg-blue-400', label: 'Reports to' },
  { color: 'bg-yellow-400', label: 'Depends on' },
  { color: 'bg-white/40', label: 'Custom' },
]

export function VentureTeamStructure({ venture, team, slug, isOwner, currentUserId }: Props) {
  const [view, setView] = useState<'graph' | 'members' | 'roles'>('graph')
  const [search, setSearch] = useState('')

  // Build initial nodes from team
  const { nodes, edges } = useMemo(() => {
    const nodes: any[] = []
    const edges: any[] = []

    // Founders center-top
    const founders = team.filter(m => m.is_founder)
    const others = team.filter(m => !m.is_founder)

    founders.forEach((m, i) => {
      const spread = (founders.length - 1) * 220
      nodes.push({
        id: 'member-' + m.id,
        type: 'member',
        position: { x: i * 220 - spread / 2, y: 0 },
        data: { member: m, isFounder: true },
      })
    })

    // Team members below in a grid
    others.forEach((m, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      nodes.push({
        id: 'member-' + m.id,
        type: 'member',
        position: { x: (col - 1) * 240, y: 180 + row * 180 },
        data: { member: m, isFounder: false },
      })
    })

    return { nodes, edges }
  }, [team])

  return (
    <div>
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
            <Briefcase size={12} weight="fill" /> Open Roles
          </button>
        </div>
      </div>

      {view === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Graph */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="h-[500px] relative">
              {team.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md px-6">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-white/[0.06] items-center justify-center mb-3">
                      <UsersThree size={22} className="text-white/40" />
                    </div>
                    <p className="text-[13.5px] font-semibold text-white">No team yet</p>
                    <p className="text-[11.5px] text-white/45 mt-1">
                      {isOwner ? 'Add team members to visualize your org structure.' : 'This venture hasn\'t added team members.'}
                    </p>
                    {isOwner && (
                      <button className="mt-3 text-[12px] font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] px-3.5 h-8 rounded-lg inline-flex items-center gap-1.5">
                        <Plus size={11} weight="bold" /> Add member
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <ReactFlowProvider>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.4}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color="rgba(255,255,255,0.05)" gap={20} />
                    <Controls className="!bg-white/[0.03] !border-white/[0.08] !rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} />
                    {/* Legend panel */}
                    <Panel position="top-right">
                      <div className="bg-black/60 backdrop-blur-md border border-white/[0.1] rounded-full px-3 py-2 flex items-center gap-3 text-[10.5px]">
                        {LEGEND_ITEMS.slice(0, 3).map(item => (
                          <div key={item.label} className="flex items-center gap-1.5">
                            <div className={'w-1.5 h-1.5 rounded-full ' + item.color} />
                            <span className="text-white/70">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  </ReactFlow>
                </ReactFlowProvider>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <h3 className="text-[13px] font-bold text-white">Team Members <span className="text-white/40 font-normal">({team.length})</span></h3>
              </div>
              <div className="p-3">
                <div className="relative mb-3">
                  <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search members..."
                    className="w-full pl-8 pr-3 h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.2]"
                  />
                </div>

                {team.length === 0 ? (
                  <p className="text-[12px] text-white/40 text-center py-4">No members match.</p>
                ) : (
                  <div className="space-y-1">
                    {team
                      .filter(m => !search || (m.users?.full_name || m.name)?.toLowerCase().includes(search.toLowerCase()))
                      .map((m: any) => {
                        const u = m.users
                        const name = u?.full_name || m.name
                        const avatar = u?.avatar_url || m.avatar_url
                        return (
                          <a
                            key={m.id}
                            href={u?.username ? '/profile/' + u.username : '#'}
                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                          >
                            {avatar ? (
                              <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-purple-200">
                                {name?.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[12.5px] font-semibold text-white truncate group-hover:text-purple-200">{name}</p>
                                {m.is_founder && (
                                  <span className="text-[8.5px] font-bold text-purple-200 bg-purple-500/20 px-1 rounded">F</span>
                                )}
                              </div>
                              <p className="text-[10.5px] text-white/45 truncate">{m.role}</p>
                            </div>
                          </a>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {team.length === 0 ? (
            <div className="col-span-full bg-white/[0.02] border border-white/[0.06] rounded-2xl py-16 text-center">
              <UsersThree size={26} className="text-white/40 mx-auto mb-3" />
              <p className="text-[13px] text-white/60">No team members yet</p>
            </div>
          ) : (
            team.map((m: any) => <MemberCardFull key={m.id} member={m} />)
          )}
        </div>
      )}

      {view === 'roles' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-16 text-center">
          <Briefcase size={26} className="text-white/40 mx-auto mb-3" />
          <p className="text-[13px] text-white/60">Switch to the Open Roles tab to view all positions.</p>
        </div>
      )}
    </div>
  )
}

function MemberCardFull({ member }: { member: any }) {
  const u = member.users
  const name = u?.full_name || member.name
  const avatar = u?.avatar_url || member.avatar_url

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 transition-colors flex items-start gap-3">
      {avatar ? (
        <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-[16px] font-bold text-purple-200">
          {name?.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-[14px] font-bold text-white truncate">{name}</h4>
          {member.is_founder && (
            <span className="text-[9px] font-bold text-purple-200 bg-purple-500/20 px-1.5 py-0.5 rounded uppercase">Founder</span>
          )}
        </div>
        <p className="text-[12px] text-white/60 mt-0.5">{member.role}</p>
        {member.title && <p className="text-[11px] text-white/45 mt-0.5">{member.title}</p>}
        <div className="flex items-center gap-2 mt-2">
          {member.linkedin_url && (
            <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[10.5px] text-white/50 hover:text-white">LinkedIn</a>
          )}
          {u?.username && (
            <a href={'/profile/' + u.username} className="text-[10.5px] font-semibold text-purple-300 hover:text-purple-200">View profile →</a>
          )}
        </div>
      </div>
    </div>
  )
}
