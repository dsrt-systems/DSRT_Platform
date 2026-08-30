'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  DotsThree, MapPin, Users, Buildings, CheckCircle,
  GitCommit, GitBranch, Star, Wrench
} from '@phosphor-icons/react'

export interface ProjectHorizontalCardData {
  id: string
  slug: string
  name: string
  tagline?: string | null
  short_description?: string | null
  description?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  icon?: string | null
  color?: string | null
  stage?: string | null
  status?: string | null
  industry?: string | null
  location?: string | null
  project_type?: string | null
  project_number?: string | null
  is_open_source?: boolean
  is_dsrt_verified?: boolean
  is_hiring?: boolean
  license?: string | null
  team_size?: number | null
  open_roles?: number | null
  follower_count?: number | null
  view_count?: number | null
  tech_stack?: string[] | null
  category?: string[] | null
  technologies?: string[]
  domains?: string[]
  repository_url?: string | null
  repository_stars?: number | null
  repository_contributors?: number | null
  collaboration_status?: string | null
  parent_venture_id?: string | null
  last_activity_at?: string | null
  updated_at?: string | null
  created_at?: string | null
}

interface Props {
  project: ProjectHorizontalCardData
  onDeleteRequest: (v: ProjectHorizontalCardData) => void
  showActionButtons?: boolean
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea',
  planning: 'Planning',
  prototype: 'Prototype',
  development: 'Development',
  building: 'Building',
  testing: 'Testing',
  mvp: 'MVP',
  launched: 'Launched',
  maintaining: 'Maintaining',
  production: 'Production',
  scaling: 'Scaling',
  completed: 'Completed',
  'on-hold': 'On Hold',
  paused: 'Paused',
  archived: 'Archived',
  research: 'Research',
}

function timeAgo(iso?: string | null): string {
  if (!iso) return ''
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function ProjectHorizontalCard({ project, onDeleteRequest }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleCardClick = () => {
    router.push(`/projects/${project.slug}`)
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/projects/${project.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Project link copied')
    setMenuOpen(false)
  }

  const stageLabel = project.stage ? (STAGE_LABELS[project.stage] || project.stage) : null

  // Combined tags: prefer normalized domains + technologies, fall back to legacy
  const domainTags = project.domains && project.domains.length > 0
    ? project.domains
    : (project.category || [project.industry].filter(Boolean) as string[])

  const techTags = project.technologies && project.technologies.length > 0
    ? project.technologies
    : (project.tech_stack || [])

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-[#121215] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-5 flex flex-col md:flex-row gap-5 cursor-pointer transition-all shadow-sm"
    >
      {/* Cover / Thumbnail */}
      <div className="w-full md:w-[200px] h-[125px] rounded-xl bg-[#09090b] border border-white/[0.06] overflow-hidden flex-shrink-0 relative">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900/60">
            <Wrench size={30} className="text-zinc-700" />
          </div>
        )}

        {project.logo_url && (
          <div className="absolute bottom-2.5 left-2.5 w-10 h-10 rounded-lg border border-white/[0.1] shadow-lg bg-[#09090b] overflow-hidden">
            <img src={project.logo_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[17px] font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                {project.name}
              </h3>
              {project.is_dsrt_verified && (
                <CheckCircle size={13} weight="fill" className="text-purple-400 shrink-0" />
              )}
            </div>
            {(project.tagline || project.short_description) && (
              <p className="text-[13px] text-zinc-400 truncate mt-0.5">
                {project.tagline || project.short_description}
              </p>
            )}
          </div>

          {/* Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="w-8 h-8 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            >
              <DotsThree size={20} weight="bold" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                <div className="absolute right-0 top-full mt-1 z-40 w-48 bg-[#0d0d10] border border-white/[0.08] rounded-xl shadow-2xl p-1 space-y-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}`) }}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    Open project
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}?tab=settings`) }}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    Edit project
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}?tab=team`) }}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    Manage team
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    Share project
                  </button>
                  <div className="h-px bg-white/[0.06] my-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDeleteRequest(project) }}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Archive project
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Meta tags row */}
        <div className="flex items-center gap-3 text-[12px] text-zinc-500 font-medium my-2 flex-wrap">
          {domainTags.slice(0, 2).map((d, i) => (
            <span key={`d-${i}`}>{d}</span>
          ))}
          {stageLabel && (
            <>
              {domainTags.length > 0 && <span className="w-1 h-1 rounded-full bg-zinc-700" />}
              <span className="capitalize">{stageLabel}</span>
            </>
          )}
          {project.location && (
            <>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {project.location}
              </span>
            </>
          )}
        </div>

        {/* Tech chips (subtle) */}
        {techTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {techTags.slice(0, 5).map((t, i) => (
              <span
                key={`t-${i}`}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-white/[0.04] border border-white/[0.06] text-zinc-400"
              >
                {t}
              </span>
            ))}
            {techTags.length > 5 && (
              <span className="text-[10.5px] text-zinc-600">+{techTags.length - 5}</span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-[13px] text-zinc-300 line-clamp-2 leading-relaxed mb-auto">
          {project.short_description || project.description || 'Provide a concise overview of what this project builds and why.'}
        </p>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Stage */}
            <div>
              <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Stage</p>
              <p className="text-[12px] font-semibold text-white capitalize">
                {stageLabel || 'Idea'}
              </p>
            </div>
            {/* Status */}
            <div>
              <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Status</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  project.status === 'archived' ? 'bg-zinc-500' :
                  project.status === 'draft' ? 'bg-amber-400' :
                  'bg-emerald-400'
                }`} />
                <p className="text-[12px] font-semibold text-zinc-300 capitalize">
                  {project.status === 'archived' ? 'Archived' :
                   project.status === 'draft' ? 'Draft' :
                   'Active'}
                </p>
              </div>
            </div>
            {/* Team */}
            <div>
              <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Team</p>
              <p className="text-[12px] font-semibold text-zinc-300 flex items-center gap-1">
                <Users size={12} /> {project.team_size || 1}
              </p>
            </div>
            {/* Open source badge */}
            {project.is_open_source && (
              <div>
                <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Open Source</p>
                <p className="text-[12px] font-semibold text-zinc-300 flex items-center gap-1">
                  <GitBranch size={11} /> {project.license || 'Yes'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}`) }}
            className="h-8 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[12px] font-semibold text-white transition-colors"
          >
            Open project
          </button>
        </div>
      </div>
    </div>
  )
}