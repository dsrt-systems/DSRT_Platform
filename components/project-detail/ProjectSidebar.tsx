'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Globe, Users, Briefcase, Heart, EyeSlash, Eye,
  GithubLogo, TwitterLogo, LinkedinLogo, InstagramLogo,
  YoutubeLogo, FileText, PresentationChart, Link as LinkIcon,
  Plus, Trash, Flag, Calendar, ArrowRight, ArrowSquareOut
} from '@phosphor-icons/react'

import { ProjectKnowledgePanel } from './widgets/ProjectKnowledgePanel'
import { ProjectMilestonesWidget } from './widgets/ProjectMilestonesWidget'
import { ProjectResourcesWidget } from './widgets/ProjectResourcesWidget'
import { ProjectDomainTechEditor } from './widgets/ProjectDomainTechEditor'
import { DsrtPanel, DsrtAvatar, DsrtButton, DsrtInput } from '@/components/dsrt'

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
  project_type?: string | null
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
  idea: 'Idea', research: 'Research', planning: 'Planning', prototype: 'Prototype',
  mvp: 'MVP', beta: 'Beta', production: 'Production', scaling: 'Scaling',
  completed: 'Completed', 'on-hold': 'On Hold'
}

const SOCIAL_LINK_TYPES = [
  { id: 'website', label: 'Website', icon: Globe },
  { id: 'github', label: 'GitHub', icon: GithubLogo },
  { id: 'twitter', label: 'Twitter / X', icon: TwitterLogo },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedinLogo },
  { id: 'youtube', label: 'YouTube', icon: YoutubeLogo },
  { id: 'instagram', label: 'Instagram', icon: InstagramLogo },
  { id: 'documentation', label: 'Docs', icon: FileText },
  { id: 'pitch_deck', label: 'Pitch Deck', icon: PresentationChart },
]

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en', { month: 'short', year: 'numeric' })
}

export function ProjectSidebar({
  project, team, links, isOwner,
  onAddMember, onAddLink, onDeleteLink, onEditGlance
}: Props) {
  const [customLinkOpen, setCustomLinkOpen] = useState(false)
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const linksByType: Record<string, LinkRow | undefined> = {}
  const customLinks: LinkRow[] = []
  for (const l of links) {
    if (SOCIAL_LINK_TYPES.some(t => t.id === l.type)) linksByType[l.type] = l
    else customLinks.push(l)
  }

  const promptForUrl = async (typeId: string, typeLabel: string) => {
    const existing = linksByType[typeId]
    if (existing) {
      if (confirm('Remove ' + typeLabel + ' link?')) await onDeleteLink(existing.id)
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
      {/* 1. At a Glance */}
      <DsrtPanel padding="none" variant="default" className="overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-[14px] font-semibold text-white">At a Glance</h3>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.04]">
          <GlanceItem icon={<Flag size={13} />} label="Stage" value={STAGE_LABELS[project.stage] || project.stage} editable={isOwner} onEdit={() => onEditGlance('stage')} />
          <GlanceItem icon={<Globe size={13} />} label="Industry" value={project.industry || '—'} editable={isOwner} onEdit={() => onEditGlance('industry')} />
          <GlanceItem icon={<Calendar size={13} />} label="Founded" value={formatDate(project.founded_date)} editable={isOwner} onEdit={() => onEditGlance('founded_date')} />
          <GlanceItem icon={<Users size={13} />} label="Team" value={`${team.length || 1} Members`} />
          <GlanceItem icon={<Briefcase size={13} />} label="Open Roles" value={project.open_roles.toString()} editable={isOwner} onEdit={() => onEditGlance('open_roles')} />
          <GlanceItem icon={<Heart size={13} />} label="Followers" value={(project.follower_count || 0).toLocaleString()} />
          <div className="col-span-2 flex items-center justify-between p-3 hover:bg-white/[0.02] cursor-pointer" onClick={() => isOwner && onEditGlance('visibility')}>
            <div className="flex items-center gap-2 text-white/50 text-[11px] uppercase tracking-wider font-mono">
              {project.is_public ? <Eye size={12} /> : <EyeSlash size={12} />} Visibility
            </div>
            <span className="text-[13px] text-white font-medium">
              {project.is_public ? 'Public' : 'Private'}
              {isOwner && <ArrowRight size={10} className="inline ml-1 opacity-50" />}
            </span>
          </div>
        </div>
      </DsrtPanel>

      <ProjectDomainTechEditor slug={project.slug} isOwner={isOwner} />

      {/* Team Widget */}
      <DsrtPanel padding="none" variant="default" className="overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h3 className="text-[14px] font-semibold text-white">Team ({team.length || 1})</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {team.slice(0, 4).map((m) => (
            <Link key={m.id} href={'/profile/' + (m.username || m.user_id)} className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors">
              <DsrtAvatar src={m.avatar_url} name={m.full_name || ''} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate">{m.full_name || 'Member'}</p>
                <p className="text-[11px] text-white/40 truncate">{m.role || 'Member'}</p>
              </div>
            </Link>
          ))}
        </div>
        {isOwner && (
          <div className="p-3 border-t border-white/[0.04]">
            <DsrtButton size="xs" variant="outline" fullWidth onClick={onAddMember}>
              <Plus size={12} /> Add Member
            </DsrtButton>
          </div>
        )}
      </DsrtPanel>

      <ProjectMilestonesWidget slug={project.slug} projectId={project.id} isOwner={isOwner} />
      <ProjectResourcesWidget slug={project.slug} isOwner={isOwner} />
      <ProjectKnowledgePanel slug={project.slug} projectId={project.id} isOwner={isOwner} />

      {/* Socials */}
      <DsrtPanel padding="none" variant="default" className="overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-[14px] font-semibold text-white">Socials & Links</h3>
        </div>
        <div className="p-3 grid grid-cols-4 gap-1.5">
          {SOCIAL_LINK_TYPES.filter(t => t.id !== 'documentation' && t.id !== 'pitch_deck').map(t => {
            const existing = linksByType[t.id]
            const active = !!existing
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => existing ? window.open(existing.url, '_blank') : isOwner && promptForUrl(t.id, t.label)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
                  active ? 'bg-[#1e3a5f]/40 border-[#2c5282]/50 text-white' : 'bg-white/[0.02] border-white/[0.06] text-white/30'
                }`}
              >
                <Icon size={16} />
                <span className="text-[9px] font-mono">{t.label}</span>
              </button>
            )
          })}
        </div>

        {customLinks.length > 0 && (
          <div className="border-t border-white/[0.04] divide-y divide-white/[0.04]">
            {customLinks.map(l => (
              <div key={l.id} className="flex items-center gap-2 p-3 text-[12px]">
                <LinkIcon size={12} className="text-white/40" />
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-white/80 hover:text-white truncate">{l.label}</a>
                {isOwner && <button onClick={() => onDeleteLink(l.id)} className="text-white/40 hover:text-red-400"><Trash size={12} /></button>}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <div className="p-3 border-t border-white/[0.04]">
            {customLinkOpen ? (
              <div className="space-y-2">
                <DsrtInput placeholder="Title" value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} sizeVariant="sm" />
                <DsrtInput placeholder="https://..." value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} sizeVariant="sm" />
                <div className="flex gap-2">
                  <DsrtButton size="xs" variant="ghost" fullWidth onClick={() => setCustomLinkOpen(false)}>Cancel</DsrtButton>
                  <DsrtButton size="xs" variant="primary" fullWidth loading={saving} onClick={addCustom}>Add</DsrtButton>
                </div>
              </div>
            ) : (
              <DsrtButton size="xs" variant="outline" fullWidth onClick={() => setCustomLinkOpen(true)}>
                <Plus size={12} /> Add Link
              </DsrtButton>
            )}
          </div>
        )}
      </DsrtPanel>
    </div>
  )
}

function GlanceItem({ icon, label, value, editable, onEdit }: any) {
  return (
    <div className={`p-3 ${editable ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`} onClick={editable ? onEdit : undefined}>
      <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-mono uppercase tracking-wider mb-1">
        {icon} {label}
      </div>
      <p className="text-[13px] font-semibold text-white truncate">{value}</p>
    </div>
  )
}