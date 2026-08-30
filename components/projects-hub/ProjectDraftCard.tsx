'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Wrench } from '@phosphor-icons/react'

interface DraftCardProps {
  project: {
    id: string
    slug: string
    name: string
    project_number?: string | null
    icon?: string | null
    cover_image_url?: string | null
    updated_at?: string | null
    created_at?: string | null
  }
}

function timeAgo(iso?: string | null): string {
  if (!iso) return ''
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function ProjectDraftCard({ project }: DraftCardProps) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/projects/${project.slug}`)}
      className="w-[240px] flex-shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden hover:border-amber-500/25 hover:bg-white/[0.04] transition-all cursor-pointer group"
    >
      <div className="relative h-[90px] overflow-hidden">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 flex items-center justify-center">
            <Wrench size={22} className="text-white/25" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute top-2 left-2 text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
          Draft
        </span>
      </div>
      <div className="p-3">
        <h4 className="text-[13px] font-bold text-white truncate mb-0.5">{project.name}</h4>
        {project.project_number && (
          <p className="text-[10.5px] text-white/40 font-mono mb-2">{project.project_number}</p>
        )}
        <p className="text-[10.5px] text-white/50 mb-2">
          Last edited {timeAgo(project.updated_at || project.created_at)}
        </p>
        <button className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-white/[0.06] group-hover:bg-white group-hover:text-black px-2.5 h-7 rounded-md transition-colors">
          Continue <ArrowRight size={10} weight="bold" />
        </button>
      </div>
    </div>
  )
}