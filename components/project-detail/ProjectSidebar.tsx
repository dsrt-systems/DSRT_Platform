'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Globe, Users, Briefcase, Heart, EyeSlash, Eye,
  GithubLogo, TwitterLogo, LinkedinLogo, InstagramLogo,
  YoutubeLogo, FileText, PresentationChart, Link as LinkIcon,
  Plus, Trash, X, Certificate, Calendar, Flag, Check,
  ArrowRight, ArrowSquareOut, DiscordLogo
} from '@phosphor-icons/react'

interface ProjectLite {
  id: string
  slug: string
  stage: string
  industry: string | null
  founded_date: string | null
  team_size: number
  open_roles: number
  follower_count: number
  visibility: string
  is_public: boolean
  founder_id: string | null
  user_id: string | null
}

interface TeamMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  is_verified: boolean
}

interface LinkRow {
  id: string
  type: string
  label: string | null
  url: string
  position: number
}

interface Props {
  project: ProjectLite
  team: TeamMember[]
  links: LinkRow[]
  isOwner: boolean
  onAddMember: () => void
  onAddLink: (type: string, url: string, label?: string) => Promise<void>
  onDeleteLink: (id: string) => Promise<void>
  onEditGlance: (field: string) => void
}

const STAGE_LABELS: Record<string, string> = {
  idea:'Idea', research:'Research', planning:'Planning', prototype:'Prototype',
  mvp:'MVP', beta:'Beta', production:'Production', scaling:'Scaling',
  completed:'Completed', 'on-hold':'On Hold'
}

// Icon-based social/resource types
const SOCIAL_LINK_TYPES = [
  { id: 'website', label: 'Website', icon: Globe, color: 'text-white/80' },
  { id: 'github', label: 'GitHub', icon: GithubLogo, color: 'text-white/80' },
  { id: 'twitter', label: 'Twitter / X', icon: TwitterLogo, color: 'text-white/80' },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedinLogo, color: 'text-white/80' },
  { id: 'youtube', label: 'YouTube', icon: YoutubeLogo, color: 'text-white/80' },
  { id: 'instagram', label: 'Instagram', icon: InstagramLogo, color: 'text-white/80' },
  { id: 'documentation', label: 'Docs', icon: FileText, color: 'text-white/80' },
  { id: 'pitch_deck', label: 'Pitch Deck', icon: PresentationChart, color: 'text-white/80' },
]

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en', { month: 'short', year: 'numeric' })
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

export function ProjectSidebar({
  project, team, links, isOwner,
  onAddMember, onAddLink, onDeleteLink, onEditGlance
}: Props) {
  const [customLinkOpen, setCustomLinkOpen] = useState(false)
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)

  // Map existing links by type
  const linksByType: Record<string, LinkRow | undefined> = {}
  const customLinks: LinkRow[] = []
  for (const l of links) {
    if (SOCIAL_LINK_TYPES.some(t => t.id === l.type)) {
      linksByType[l.type] = l
    } else {
      customLinks.push(l)
    }
  }

  const promptForUrl = async (typeId: string, typeLabel: string) => {
    const existing = linksByType[typeId]
    if (existing) {
      // Remove flow
      if (confirm('Remove ' + typeLabel + ' link?')) {
        await onDeleteLink(existing.id)
      }
      return
    }
    const url = window.prompt('Enter ' + typeLabel + ' URL:', 'https://')
    if (!url || !/^https?:\/\//.test(url)) return
    await onAddLink(typeId, url)
  }

  const addCustom = async () => {
    if (!newLinkUrl.trim() || !newLinkLabel.trim()) return
    setSaving(true)
    try {
      await onAddLink('other', newLinkUrl.trim(), newLinkLabel.trim())
      setNewLinkUrl('')
      setNewLinkLabel('')
      setCustomLinkOpen(false)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">

      {/* ═══ AT A GLANCE (compact 2-column) ═══ */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-white">At a Glance</h3>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.05]">
          <GlanceItem
            icon={<Flag size={13} className="text-white/50" />}
            label="Stage"
            value={STAGE_LABELS[project.stage] || project.stage}
            editable={isOwner}
            onEdit={() => onEditGlance('stage')}
          />
          <GlanceItem
            icon={<Globe size={13} className="text-white/50" />}
            label="Industry"
            value={project.industry || '—'}
            emptyValueLabel="Add"
            editable={isOwner}
            onEdit={() => onEditGlance('industry')}
          />
          <GlanceItem
            icon={<Calendar size={13} className="text-white/50" />}
            label="Founded"
            value={formatDate(project.founded_date)}
            emptyValueLabel="Add"
            editable={isOwner}
            onEdit={() => onEditGlance('founded_date')}
          />
          <GlanceItem
            icon={<Users size={13} className="text-white/50" />}
            label="Team"
            value={(team.length || 1) + ' ' + ((team.length || 1) === 1 ? 'Member' : 'Members')}
          />
          <GlanceItem
            icon={<Briefcase size={13} className="text-white/50" />}
            label="Open Roles"
            value={project.open_roles.toString()}
            editable={isOwner}
            onEdit={() => onEditGlance('open_roles')}
          />
          <GlanceItem
            icon={<Heart size={13} className="text-white/50" />}
            label="Followers"
            value={formatNumber(project.follower_count || 0)}
          />
          <div className="col-span-2 flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] cursor-pointer"
               onClick={() => isOwner && onEditGlance('visibility')}>
            <div className="flex items-center gap-2">
              {project.is_public ? <Eye size={13} className="text-white/50" /> : <EyeSlash size={13} className="text-white/50" />}
              <span className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Visibility</span>
            </div>
            <span className="text-[13px] font-medium text-white/90">
              {project.is_public ? 'Public' : (project.visibility === 'unlisted' ? 'Unlisted' : 'Private')}
              {isOwner && <ArrowRight size={11} className="inline ml-1 text-white/30" />}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ TEAM MEMBERS ═══ */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-white">
            Team <span className="text-white/40 font-normal text-[13px]">· {team.length || 1}</span>
          </h3>
          {team.length > 4 && (
            <button className="text-[12px] text-white/60 hover:text-white font-medium">View all</button>
          )}
        </div>
        <div className="divide-y divide-white/[0.05]">
          {team.length === 0 ? (
            <div className="px-4 py-5 text-center text-[13px] text-white/40">
              No members yet.
            </div>
          ) : (
            team.slice(0, 4).map((m) => (
              <Link
                key={m.id}
                href={'/profile/' + (m.username || m.user_id)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[13px] font-semibold text-white/80">{(m.full_name || '?').charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-[13px] font-semibold text-white truncate">{m.full_name || 'Unknown'}</p>
                    {m.is_verified && <Certificate size={11} weight="fill" className="text-blue-400 flex-shrink-0" />}
                  </div>
                  <p className="text-[12px] text-white/50 truncate">{m.role || 'Member'}</p>
                </div>
              </Link>
            ))
          )}
        </div>
        {isOwner && (
          <button
            onClick={onAddMember}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/[0.04] border-t border-white/[0.06] transition-colors"
          >
            <Plus size={13} weight="bold" /> Add member
          </button>
        )}
      </div>

      {/* ═══ PROJECT LINKS (icon grid) ═══ */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-white">Links</h3>
        </div>

        {/* Icon grid for standard social/resource links */}
        <div className="p-3 grid grid-cols-4 gap-1.5">
          {SOCIAL_LINK_TYPES.map(t => {
            const existing = linksByType[t.id]
            const active = !!existing
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (existing) {
                    window.open(existing.url, '_blank', 'noopener,noreferrer')
                  } else if (isOwner) {
                    promptForUrl(t.id, t.label)
                  }
                }}
                onContextMenu={(e) => {
                  if (isOwner && existing) {
                    e.preventDefault()
                    if (confirm('Remove ' + t.label + ' link?')) onDeleteLink(existing.id)
                  }
                }}
                disabled={!active && !isOwner}
                title={active ? t.label + ': ' + existing.url + (isOwner ? ' (right-click to remove)' : '') : (isOwner ? 'Add ' + t.label : t.label + ' (not set)')}
                className={
                  'aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all group ' +
                  (active
                    ? 'bg-white/[0.06] border border-white/[0.15] hover:bg-white/[0.1] hover:border-white/25 text-white cursor-pointer'
                    : isOwner
                      ? 'bg-white/[0.02] border border-dashed border-white/[0.1] text-white/25 hover:text-white/60 hover:border-white/20 cursor-pointer'
                      : 'bg-white/[0.02] border border-white/[0.05] text-white/15 cursor-not-allowed'
                  )
                }
              >
                <Icon size={16} weight={active ? 'fill' : 'regular'} />
                <span className="text-[9px] font-medium truncate w-full text-center px-1">{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Custom links */}
        {customLinks.length > 0 && (
          <div className="border-t border-white/[0.06] divide-y divide-white/[0.05]">
            {customLinks.map(l => (
              <div key={l.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/[0.02] group">
                <LinkIcon size={13} className="text-white/40 flex-shrink-0" />
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 text-[13px] text-white/85 hover:text-white truncate"
                >
                  {l.label}
                </a>
                <ArrowSquareOut size={11} className="text-white/30 flex-shrink-0" />
                {isOwner && (
                  <button
                    onClick={() => onDeleteLink(l.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all ml-1"
                    aria-label="Remove"
                  >
                    <Trash size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add custom link */}
        {isOwner && (
          <div className="border-t border-white/[0.06]">
            {customLinkOpen ? (
              <div className="p-3 space-y-2 bg-black/20">
                <input
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="Link title (e.g. Product Hunt)"
                  className="w-full text-[13px] bg-white/[0.04] border border-white/[0.1] text-white placeholder:text-white/30 rounded-md h-8 px-2.5 outline-none focus:border-white/25"
                />
                <input
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-[13px] bg-white/[0.04] border border-white/[0.1] text-white placeholder:text-white/30 rounded-md h-8 px-2.5 outline-none focus:border-white/25"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setCustomLinkOpen(false); setNewLinkUrl(''); setNewLinkLabel('') }}
                    className="flex-1 text-[12px] text-white/60 hover:text-white h-8 rounded border border-white/[0.1]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCustom}
                    disabled={saving || !newLinkUrl.trim() || !newLinkLabel.trim()}
                    className="flex-1 text-[12px] font-semibold bg-white text-black hover:bg-white/90 h-8 rounded disabled:opacity-40"
                  >
                    {saving ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCustomLinkOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <Plus size={13} weight="bold" /> Custom link
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function GlanceItem({
  icon, label, value, editable, onEdit, emptyValueLabel
}: {
  icon: React.ReactNode
  label: string
  value: string
  editable?: boolean
  onEdit?: () => void
  emptyValueLabel?: string
}) {
  const isEmpty = value === '—' || value === '0'
  return (
    <div
      className={'px-4 py-2.5 ' + (editable ? 'cursor-pointer hover:bg-white/[0.02]' : '')}
      onClick={editable && onEdit ? onEdit : undefined}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] text-white/45 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={'text-[14px] font-semibold ' + (isEmpty ? 'text-white/40' : 'text-white/95')}>
        {isEmpty && editable && emptyValueLabel ? (
          <span className="text-white/50 hover:text-white">+ {emptyValueLabel}</span>
        ) : value}
      </p>
    </div>
  )
}
