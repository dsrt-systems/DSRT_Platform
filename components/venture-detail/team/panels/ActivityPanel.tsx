'use client'

import { useState } from 'react'
import {
  ClockCounterClockwise, PaperPlaneTilt, Eye, PauseCircle,
  CheckCircle, XCircle, UserPlus, UserMinus, Prohibit,
  ArrowClockwise, PencilSimple, ShieldCheck, PlayCircle,
  LinkSimple, LinkBreak, CaretRight
} from '@phosphor-icons/react'

interface Props {
  activity: any[]
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  'invitation.sent': { icon: PaperPlaneTilt, color: 'text-blue-400', label: 'Invitation sent' },
  'invitation.viewed': { icon: Eye, color: 'text-purple-400', label: 'Invitation viewed' },
  'invitation.held': { icon: PauseCircle, color: 'text-amber-400', label: 'Invitation held' },
  'invitation.accepted': { icon: CheckCircle, color: 'text-emerald-400', label: 'Invitation accepted' },
  'invitation.rejected': { icon: XCircle, color: 'text-red-400', label: 'Invitation rejected' },
  'invitation.revoked': { icon: Prohibit, color: 'text-zinc-400', label: 'Invitation revoked' },
  'invitation.resent': { icon: ArrowClockwise, color: 'text-blue-400', label: 'Invitation resent' },
  'invitation.expired': { icon: XCircle, color: 'text-zinc-500', label: 'Invitation expired' },
  'membership.activated': { icon: UserPlus, color: 'text-emerald-400', label: 'Member joined' },
  'membership.suspended': { icon: PauseCircle, color: 'text-amber-400', label: 'Member suspended' },
  'membership.restored': { icon: PlayCircle, color: 'text-emerald-400', label: 'Access restored' },
  'membership.removed': { icon: UserMinus, color: 'text-red-400', label: 'Member removed' },
  'membership.left': { icon: UserMinus, color: 'text-zinc-400', label: 'Member left' },
  'membership.role_changed': { icon: ShieldCheck, color: 'text-blue-400', label: 'Role changed' },
  'position.created': { icon: PencilSimple, color: 'text-zinc-400', label: 'Position created' },
  'position.updated': { icon: PencilSimple, color: 'text-zinc-400', label: 'Position updated' },
  'position.archived': { icon: XCircle, color: 'text-zinc-500', label: 'Position archived' },
  'position.linked_opportunity': { icon: LinkSimple, color: 'text-emerald-400', label: 'Opportunity linked' },
  'position.unlinked_opportunity': { icon: LinkBreak, color: 'text-zinc-400', label: 'Opportunity unlinked' },
  'relationship.updated': { icon: PencilSimple, color: 'text-blue-400', label: 'Relationship updated' },
  'relationship.deleted': { icon: XCircle, color: 'text-zinc-400', label: 'Relationship removed' },
  'role.created': { icon: ShieldCheck, color: 'text-purple-400', label: 'Custom role created' },
  'role.updated': { icon: ShieldCheck, color: 'text-blue-400', label: 'Role updated' },
  'role.deleted': { icon: XCircle, color: 'text-red-400', label: 'Role deleted' },
  'onboarding.completed': { icon: CheckCircle, color: 'text-emerald-400', label: 'Onboarding completed' },
}

export function ActivityPanel({ activity }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (activity.length === 0) {
    return (
      <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-16 text-center">
        <ClockCounterClockwise size={32} className="text-zinc-600 mx-auto mb-3" />
        <h3 className="text-[14px] font-bold text-white mb-1">No activity yet</h3>
        <p className="text-[12.5px] text-zinc-500">
          Team actions like invitations, joins, and role changes will appear here.
        </p>
      </div>
    )
  }

  const grouped = groupByDate(activity)

  return (
    <div className="bg-[#121215] border border-white/[0.06] rounded-2xl p-6">
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, events]) => (
          <div key={date}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-3">
              {date}
            </p>
            <div className="space-y-1 relative">
              <div className="absolute left-[15px] top-1 bottom-1 w-px bg-white/[0.04]" />

              {events.map(event => {
                const config = ACTION_CONFIG[event.action] || {
                  icon: PencilSimple,
                  color: 'text-zinc-400',
                  label: event.action
                }
                const Icon = config.icon
                const isExpanded = expandedIds.has(event.id)
                const hasDetails = event.old_state || event.new_state || (event.metadata && Object.keys(event.metadata).length > 0)

                return (
                  <div key={event.id} className="relative">
                    <button
                      onClick={() => hasDetails && toggle(event.id)}
                      disabled={!hasDetails}
                      className={
                        'w-full flex items-start gap-3 py-1.5 px-2 rounded-lg text-left transition-colors ' +
                        (hasDetails ? 'hover:bg-white/[0.02] cursor-pointer' : 'cursor-default')
                      }
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0d0d10] border border-white/[0.06] flex items-center justify-center flex-shrink-0 z-10">
                        <Icon size={13} className={config.color} weight="bold" />
                      </div>

                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[12.5px] font-semibold text-white">
                            {config.label}
                          </p>
                          {event.actor && (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-white">
                                {event.actor.avatar_url ? (
                                  <img src={event.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  event.actor.full_name?.charAt(0).toUpperCase() || '?'
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500">
                                by <span className="text-zinc-300">{event.actor.full_name}</span>
                              </p>
                            </div>
                          )}
                          {hasDetails && (
                            <CaretRight
                              size={10}
                              className={
                                'text-zinc-600 transition-transform ' +
                                (isExpanded ? 'rotate-90' : '')
                              }
                            />
                          )}
                        </div>

                        {event.metadata && formatMetadata(event.action, event.metadata) && (
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {formatMetadata(event.action, event.metadata)}
                          </p>
                        )}

                        <p className="text-[10.5px] text-zinc-600 mt-0.5">
                          {new Date(event.created_at).toLocaleTimeString('en', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="ml-11 mt-1 mb-2 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 space-y-2">
                        {event.old_state && (
                          <div>
                            <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">
                              Before
                            </p>
                            <pre className="text-[10.5px] text-zinc-400 font-mono overflow-x-auto max-h-32 leading-relaxed">
                              {JSON.stringify(event.old_state, null, 2)}
                            </pre>
                          </div>
                        )}
                        {event.new_state && (
                          <div>
                            <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">
                              After
                            </p>
                            <pre className="text-[10.5px] text-zinc-400 font-mono overflow-x-auto max-h-32 leading-relaxed">
                              {JSON.stringify(event.new_state, null, 2)}
                            </pre>
                          </div>
                        )}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div>
                            <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">
                              Metadata
                            </p>
                            <pre className="text-[10.5px] text-zinc-400 font-mono overflow-x-auto max-h-32 leading-relaxed">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function groupByDate(events: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {}
  events.forEach(e => {
    const d = new Date(e.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let label: string
    if (isSameDay(d, today)) label = 'Today'
    else if (isSameDay(d, yesterday)) label = 'Yesterday'
    else label = d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })

    if (!groups[label]) groups[label] = []
    groups[label].push(e)
  })
  return groups
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatMetadata(action: string, meta: any): string {
  if (action.startsWith('invitation.') && meta.role_title) return `for ${meta.role_title}`
  if (action === 'invitation.resent' && meta.extended_days) return `Extended by ${meta.extended_days} days`
  if (action === 'membership.activated' && meta.role_title) return `as ${meta.role_title}`
  if (action === 'membership.removed' && meta.reason) return `Reason: ${meta.reason}`
  if (action === 'membership.suspended' && meta.reason) return `Reason: ${meta.reason}`
  return ''
}