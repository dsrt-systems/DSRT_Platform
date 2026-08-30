'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DotsThree, MapPin, Users, CheckCircle, EyeSlash,
  BookmarkSimple, GitBranch, ShareNetwork
} from '@phosphor-icons/react'
import { ExploreProjectCard } from '@/lib/project-explore/types'
import { getProjectAffinityLearner } from '@/lib/project-explore/affinity-learner'

interface ProjectCardProps {
  project: ExploreProjectCard
  onNotInterested?: (id: string) => void
  position?: number
  moduleType?: string
}

export function ProjectCard({
  project,
  onNotInterested,
  position = 0,
  moduleType,
}: ProjectCardProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(project.is_saved || false)
  const cardRef = useRef<HTMLDivElement>(null)
  const impressionFiredRef = useRef(false)
  const longViewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const domainSlugs = [
    ...(project.domains || []),
    ...(project.technologies || []),
    project.industry,
    project.sector,
  ]
    .filter(Boolean)
    .map(s => (s as string).toLowerCase())

  // ─── Impression tracking + long-view detection ───
  useEffect(() => {
    if (!cardRef.current || impressionFiredRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (entry.isIntersecting && !impressionFiredRef.current) {
          impressionFiredRef.current = true

          // Fire impression event (analytics)
          fetch('/api/projects/explore/impression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: project.id,
              module_type: moduleType || 'recommended',
              position,
              session_id: getProjectAffinityLearner().getSessionId(),
            }),
            keepalive: true,
          }).catch(() => {})

          // Fire "view" affinity signal
          getProjectAffinityLearner().track({
            project_id: project.id,
            action: 'view',
            domain_slugs: domainSlugs,
          })

          // Start long-view timer (fires after 3s)
          longViewTimerRef.current = setTimeout(() => {
            getProjectAffinityLearner().track({
              project_id: project.id,
              action: 'long_view',
              domain_slugs: domainSlugs,
            })
          }, 3000)
        }

        if (!entry.isIntersecting && longViewTimerRef.current) {
          clearTimeout(longViewTimerRef.current)
          longViewTimerRef.current = null
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(cardRef.current)
    return () => {
      observer.disconnect()
      if (longViewTimerRef.current) clearTimeout(longViewTimerRef.current)
    }
  }, [project.id, position, moduleType])

  // ─── Handlers ───
  const handleCardClick = () => {
    getProjectAffinityLearner().track({
      project_id: project.id,
      action: 'click',
      domain_slugs: domainSlugs,
    })
    router.push(`/projects/${project.slug}`)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/projects/${project.slug}`
    await navigator.clipboard.writeText(url)
    toast.success('Project link copied')
    setMenuOpen(false)
    getProjectAffinityLearner().track({
      project_id: project.id,
      action: 'share',
      domain_slugs: domainSlugs,
    })
  }

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const wasSaved = isSaved
    setIsSaved(!wasSaved)

    try {
      await fetch('/api/projects/save', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id }),
      })
      toast.success(wasSaved ? 'Removed from saved' : 'Saved to your library')

      if (!wasSaved) {
        getProjectAffinityLearner().track({
          project_id: project.id,
          action: 'save',
          domain_slugs: domainSlugs,
        })
      }
    } catch {
      setIsSaved(wasSaved) // revert
      toast.error('Could not update saved status')
    }
  }

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    onNotInterested?.(project.id)

    getProjectAffinityLearner().track({
      project_id: project.id,
      action: 'dismiss',
      domain_slugs: domainSlugs,
    })

    try {
      await fetch('/api/projects/explore/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, reason: 'not_relevant' }),
      })
      toast.info('Project hidden from your recommendations')
    } catch {}
  }

  // Meta tag composition
  const domainTags = (project.domains || []).slice(0, 2)
  const techTags = (project.technologies || project.tech_stack || []).slice(0, 3)

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className="group bg-[#121215] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col shadow-sm"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[16/9] bg-[#09090b] border-b border-white/[0.04] overflow-hidden">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
            <span className="text-3xl font-bold text-zinc-700">
              {project.name[0]?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Logo overlay */}
        <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-[#09090b] border border-white/[0.12] p-0.5 shadow-lg overflow-hidden">
          {project.logo_url ? (
            <img src={project.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="w-full h-full bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-bold text-white">
              {project.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Reason label (contextual) */}
        {project.reason_label && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300 uppercase tracking-wider shadow-sm">
            {project.reason_label}
          </div>
        )}

        {/* Save button (top right, overlays cover) */}
        <button
          onClick={handleToggleSave}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all backdrop-blur-md ${
            isSaved
              ? 'bg-black/60 text-white'
              : 'bg-black/40 text-zinc-300 hover:bg-black/70 hover:text-white'
          }`}
          aria-label={isSaved ? 'Unsave' : 'Save'}
        >
          <BookmarkSimple size={13} weight={isSaved ? 'fill' : 'regular'} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col space-y-3">
        <div>
          {/* Name row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[15px] font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                  {project.name}
                </h3>
                {project.is_dsrt_verified && (
                  <CheckCircle size={14} weight="fill" className="text-purple-400 shrink-0" />
                )}
              </div>
            </div>

            <div className="relative shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                className="w-7 h-7 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              >
                <DotsThree size={18} weight="bold" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={e => { e.stopPropagation(); setMenuOpen(false) }} />
                  <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-[#0d0d10] border border-white/[0.1] rounded-xl shadow-2xl p-1 space-y-0.5">
                    <button
                      onClick={e => { e.stopPropagation(); handleCardClick() }}
                      className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      Open project
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <ShareNetwork size={12} /> Share link
                    </button>
                    <div className="h-px bg-white/[0.06] my-1" />
                    <button
                      onClick={handleDismiss}
                      className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <EyeSlash size={12} /> Not interested
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tagline (2 lines) */}
          {(project.tagline || project.short_description) && (
            <p className="text-[12.5px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
              {project.tagline || project.short_description}
            </p>
          )}

          {/* Domain + stage + location chips */}
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            {domainTags.map((d, i) => (
              <span
                key={`d-${i}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-white/[0.04] text-zinc-300 border border-white/[0.08]"
              >
                {d}
              </span>
            ))}
            {project.stage && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-white/[0.06] text-white border border-white/[0.12] capitalize">
                {project.stage}
              </span>
            )}
            {project.location && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-white/[0.03] text-zinc-400 border border-white/[0.06]">
                <MapPin size={9} /> {project.location.split(',')[0]}
              </span>
            )}
          </div>

          {/* Tech chips (below meta) */}
          {techTags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-2">
              {techTags.map((t, i) => (
                <span
                  key={`t-${i}`}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.02] border border-white/[0.05] text-zinc-500"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer: founder + hiring/open-source */}
        <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11.5px] text-zinc-400 mt-auto">
          {project.founder ? (
            <Link
              href={`/profile/${project.founder.username}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 hover:text-white transition-colors min-w-0"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                {project.founder.avatar_url ? (
                  <img src={project.founder.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white">
                    {project.founder.full_name[0]}
                  </span>
                )}
              </div>
              <span className="truncate">{project.founder.full_name}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1">
              <Users size={12} weight="duotone" /> {project.team_size || 1}
            </span>
          )}

          <div className="flex items-center gap-1.5">
            {project.is_open_source && (
              <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-300 font-semibold text-[10px] border border-white/[0.1] flex items-center gap-1">
                <GitBranch size={9} /> OSS
              </span>
            )}
            {project.collaboration_status === 'looking_for_collaborators' && (
              <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white font-semibold text-[10.5px] border border-white/[0.12] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Collab
              </span>
            )}
            {project.is_hiring && (
              <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white font-semibold text-[10.5px] border border-white/[0.12] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Hiring
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}