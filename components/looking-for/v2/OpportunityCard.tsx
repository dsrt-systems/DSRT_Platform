'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BookmarkSimple, Clock, MapPin, Users } from '@phosphor-icons/react'

interface Opportunity {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  description?: string | null
  opportunity_type: string
  required_skills?: string[]
  compensation_type?: string
  compensation_min?: number | null
  compensation_max?: number | null
  compensation_currency?: string
  time_commitment?: string | null
  work_mode?: string | null
  location?: string | null
  project_length?: string | null
  application_count?: number
  published_at?: string | null
  poster?: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    is_verified?: boolean
  } | null
  project?: { id: string; slug: string; name: string; icon?: string | null; cover_image_url?: string | null } | null
  venture?: { id: string; slug: string; name: string; logo_url: string | null } | null
  is_saved?: boolean
  has_applied?: boolean
}

interface Props {
  opportunity: Opportunity
  onSave?: (id: string, currentlySaved: boolean) => void
}

const TYPE_LABELS: Record<string, string> = {
  'hire': 'Hire',
  'freelance': 'Freelance',
  'part-time': 'Part-time',
  'full-time': 'Full-time',
  'contract': 'Contract',
  'project-collaboration': 'Project Collab',
  'team-up': 'Team Up',
  'cofounder': 'Co-founder',
  'mentorship': 'Mentorship',
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'Just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

export function OpportunityCard({ opportunity, onSave }: Props) {
  const type = TYPE_LABELS[opportunity.opportunity_type] || opportunity.opportunity_type
  const posterName = opportunity.poster?.full_name || opportunity.poster?.username || 'Anonymous'
  const posterContext = opportunity.project?.name || opportunity.venture?.name || null
  const appCount = opportunity.application_count || 0

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onSave) onSave(opportunity.id, opportunity.is_saved || false)
  }

  return (
    <Link
      href={`/looking-for/${opportunity.slug}?source=feed`}
      className={
        'group block rounded-2xl border border-zinc-800/80 transition-all duration-300 ' +
        'bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] ' +
        'hover:from-[#1f1f23] hover:to-[#141417] hover:border-zinc-600/80 hover:-translate-y-0.5 ' +
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_20px_rgba(0,0,0,0.4)] ' +
        'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.6)] ' +
        'relative overflow-hidden'
      }
    >
      <div className="p-5 md:p-6 flex flex-col md:flex-row gap-5">
        {/* Left: Avatar/Context Icon */}
        <div className="shrink-0 hidden sm:block">
          <ContextIcon opportunity={opportunity} />
        </div>

        {/* Center: Main Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {opportunity.published_at &&
              (Date.now() - new Date(opportunity.published_at).getTime() < 24 * 60 * 60 * 1000) && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                New
              </span>
            )}
            <span className="text-[11.5px] font-medium text-zinc-500 uppercase tracking-wider">
              {type} • {timeAgo(opportunity.published_at)}
            </span>
          </div>

          <h3 className="text-[17px] md:text-[19px] font-bold text-white group-hover:text-blue-400 leading-tight line-clamp-2 mb-1.5 transition-colors tracking-tight">
            {opportunity.title}
          </h3>

          <div className="text-[13px] text-zinc-400 mb-3 truncate flex items-center gap-1.5">
            <span className="text-zinc-300 font-medium">{posterName}</span>
            {posterContext && (
              <>
                <span className="text-zinc-700">•</span>
                <span>{posterContext}</span>
              </>
            )}
          </div>

          {(opportunity.subtitle || opportunity.description) && (
            <p className="text-[13.5px] text-zinc-400 leading-relaxed line-clamp-2 mb-4">
              {opportunity.subtitle || opportunity.description}
            </p>
          )}

          {opportunity.required_skills && opportunity.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {opportunity.required_skills.slice(0, 5).map((s: string) => (
                <span
                  key={s}
                  className="inline-flex items-center h-6 px-2.5 rounded-md text-[11px] font-medium bg-zinc-900 border border-zinc-700/60 text-zinc-300 shadow-sm"
                >
                  {s}
                </span>
              ))}
              {opportunity.required_skills.length > 5 && (
                <span className="inline-flex items-center h-6 px-2 rounded-md text-[11px] font-medium text-zinc-500 bg-zinc-950 border border-zinc-800">
                  +{opportunity.required_skills.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 md:gap-5 text-[12px] text-zinc-400 font-medium">
            {opportunity.work_mode && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-zinc-500" />
                <span className="capitalize">{opportunity.work_mode}</span>
              </span>
            )}
            {opportunity.time_commitment && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-zinc-500" />
                {opportunity.time_commitment.replace(/-/g, ' ')}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-zinc-500" />
              {appCount} {appCount === 1 ? 'applicant' : 'applicants'}
            </span>
          </div>
        </div>

        {/* Right Actions & CTA */}
        <div className="shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 border-t md:border-t-0 md:border-l border-zinc-800/60 pt-4 md:pt-0 md:pl-5 min-w-[140px]">
          <button
            onClick={handleSave}
            aria-label={opportunity.is_saved ? 'Unsave' : 'Save'}
            className={
              'w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-sm ' +
              (opportunity.is_saved
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[inset_0_1px_0_rgba(251,191,36,0.2)]'
                : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 text-zinc-400 hover:text-white hover:bg-zinc-800')
            }
          >
            <BookmarkSimple size={16} weight={opportunity.is_saved ? 'fill' : 'bold'} />
          </button>

          <div className={
            'h-10 px-4 rounded-xl border text-[13px] font-bold transition-all flex items-center justify-center ' +
            'border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-900 text-white ' +
            'group-hover:border-zinc-500 group-hover:from-zinc-700 group-hover:to-zinc-800 ' +
            'shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]'
          }>
            View Details
          </div>
        </div>
      </div>
    </Link>
  )
}

function ContextIcon({ opportunity }: { opportunity: Opportunity }) {
  const projectLogo = opportunity.project?.cover_image_url
  const projectIcon = opportunity.project?.icon
  const ventureLogo = opportunity.venture?.logo_url

  const wrapClasses = "w-14 h-14 rounded-2xl overflow-hidden border border-zinc-700/80 relative bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center"

  if (projectLogo) {
    return (
      <div className={wrapClasses}>
        <Image src={projectLogo} alt="" fill className="object-cover" sizes="56px" />
      </div>
    )
  }
  if (ventureLogo) {
    return (
      <div className={wrapClasses}>
        <Image src={ventureLogo} alt="" fill className="object-cover" sizes="56px" />
      </div>
    )
  }
  if (projectIcon) {
    return (
      <div className={wrapClasses + " text-2xl"}>
        {projectIcon}
      </div>
    )
  }

  const initial = (opportunity.poster?.full_name || opportunity.title || '?').charAt(0).toUpperCase()
  return (
    <div className={wrapClasses + " text-[20px] font-bold text-zinc-300"}>
      {initial}
    </div>
  )
}