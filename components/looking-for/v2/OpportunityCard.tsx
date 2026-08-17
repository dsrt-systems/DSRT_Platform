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
  compensation_period?: string | null
  equity_min?: number | null
  equity_max?: number | null
  time_commitment?: string | null
  hours_per_week?: number | null
  work_mode?: string | null
  location?: string | null
  project_length?: string | null
  application_count?: number
  positions_open?: number
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
  primary_category?: { name: string; slug: string } | null
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
  'project-collaboration': 'Project Collaboration',
  'team-up': 'Team Up',
  'cofounder': 'Co-founder',
  'mentorship': 'Mentorship',
  'research': 'Research',
  'open-source': 'Open Source',
  'volunteer': 'Volunteer',
  'consulting': 'Consulting',
  'student-collaboration': 'Student Collaboration',
}

const WORK_MODE_LABELS: Record<string, string> = {
  'remote': 'Remote',
  'hybrid': 'Hybrid',
  'on-site': 'On-site',
  'flexible': 'Flexible',
}

const TIME_LABELS: Record<string, string> = {
  'less-than-5': '<5 hrs/wk',
  '5-10': '5–10 hrs/wk',
  '10-20': '10–20 hrs/wk',
  '20-30': '20–30 hrs/wk',
  '30-plus': 'Full-time',
  'flexible': 'Flexible',
}

const LENGTH_LABELS: Record<string, string> = {
  'one-off': 'One-off',
  'less-than-1-month': '<1 month',
  '1-3-months': '1–3 months',
  '3-6-months': '3–6 months',
  '6-12-months': '6–12 months',
  'long-term': 'Long-term',
  'ongoing': 'Ongoing',
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `Posted ${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Posted ${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Posted yesterday'
  if (days < 7) return `Posted ${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `Posted ${weeks}w ago`
  const months = Math.floor(days / 30)
  return `Posted ${months}mo ago`
}

function formatCompensation(o: Opportunity): { line: string; sub: string | null } | null {
  if (o.compensation_type === 'unpaid' || o.compensation_type === 'volunteer') {
    return { line: 'Unpaid', sub: TYPE_LABELS[o.opportunity_type] || null }
  }
  if (o.compensation_type === 'collaboration') {
    return { line: 'Collaboration', sub: null }
  }
  if (o.compensation_type === 'equity') {
    if (o.equity_min && o.equity_max) {
      return { line: 'Equity', sub: `${o.equity_min}% – ${o.equity_max}%` }
    }
    return { line: 'Equity', sub: 'Negotiable' }
  }
  if (o.compensation_min || o.compensation_max) {
    const curr = o.compensation_currency === 'USD' ? '$' : (o.compensation_currency || '')
    const min = o.compensation_min ? `${curr}${(o.compensation_min / 1000).toFixed(0)}K` : ''
    const max = o.compensation_max ? `${curr}${(o.compensation_max / 1000).toFixed(0)}K` : ''

    let period = ''
    if (o.compensation_type === 'hourly') period = ' / hr'
    else if (o.compensation_type === 'annual') period = ' / year'
    else if (o.compensation_type === 'monthly') period = ' / mo'

    // For hourly, don't format as K
    if (o.compensation_type === 'hourly') {
      const minH = o.compensation_min ? `${curr}${o.compensation_min}` : ''
      const maxH = o.compensation_max ? `${curr}${o.compensation_max}` : ''
      return {
        line: 'Paid',
        sub: `${minH}${maxH ? ` – ${maxH}` : ''}${period}`,
      }
    }

    return {
      line: 'Paid',
      sub: `${min}${max ? ` – ${max}` : ''}${period}`,
    }
  }
  return { line: 'Negotiable', sub: null }
}

export function OpportunityCard({ opportunity, onSave }: Props) {
  const type = TYPE_LABELS[opportunity.opportunity_type] || opportunity.opportunity_type
  const workMode = opportunity.work_mode ? WORK_MODE_LABELS[opportunity.work_mode] : null
  const timeCommit = opportunity.time_commitment ? TIME_LABELS[opportunity.time_commitment] : null
  const length = opportunity.project_length ? LENGTH_LABELS[opportunity.project_length] : null
  const comp = formatCompensation(opportunity)
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
      href={`/looking-for/${opportunity.slug}?source=opportunity`}
      className="group block rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-950/70 transition-all"
    >
      <div className="p-5">
        <div className="flex gap-4">
          {/* Left: Icon/Avatar */}
          <div className="shrink-0">
            <ContextIcon opportunity={opportunity} />
          </div>

          {/* Middle: Content */}
          <div className="flex-1 min-w-0">
            {/* Top row: post age + optional NEW badge */}
            <div className="flex items-center gap-2 mb-1">
              {opportunity.published_at &&
                (Date.now() - new Date(opportunity.published_at).getTime() < 24 * 60 * 60 * 1000) && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  NEW
                </span>
              )}
              <span className="text-[11.5px] text-zinc-500">
                {timeAgo(opportunity.published_at)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-[16px] font-bold text-white group-hover:text-blue-400 leading-tight line-clamp-1 mb-1 transition-colors">
              {opportunity.title}
            </h3>

            {/* Poster · Context · Type */}
            <div className="text-[12.5px] text-zinc-400 mb-2 truncate">
              <span className="text-zinc-300">{posterName}</span>
              {posterContext && (
                <>
                  <span className="text-zinc-600 mx-1.5">·</span>
                  <span>{posterContext}</span>
                </>
              )}
              <span className="text-zinc-600 mx-1.5">·</span>
              <span>{type}</span>
            </div>

            {/* Description / subtitle */}
            {(opportunity.subtitle || opportunity.description) && (
              <p className="text-[13px] text-zinc-400 leading-relaxed line-clamp-2 mb-3">
                {opportunity.subtitle || opportunity.description}
              </p>
            )}

            {/* Skills */}
            {opportunity.required_skills && opportunity.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {opportunity.required_skills.slice(0, 4).map(s => (
                  <span
                    key={s}
                    className="inline-flex items-center h-6 px-2 rounded text-[11px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-300"
                  >
                    {s}
                  </span>
                ))}
                {opportunity.required_skills.length > 4 && (
                  <span className="inline-flex items-center h-6 px-2 rounded text-[11px] font-medium text-zinc-500">
                    +{opportunity.required_skills.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Meta line */}
            <div className="flex items-center gap-3 text-[11.5px] text-zinc-500">
              {timeCommit && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} />
                  {timeCommit}
                </span>
              )}
              {workMode && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} />
                  {opportunity.location || workMode}
                </span>
              )}
              {length && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} weight="regular" />
                  {length}
                </span>
              )}
            </div>
          </div>

          {/* Right: Applicants + Save + Compensation + CTA */}
          <div className="shrink-0 flex flex-col items-end gap-3 text-right min-w-[130px]">
            {/* Applicants + Save */}
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-zinc-400">
                {appCount} {appCount === 1 ? 'applicant' : 'applicants'}
              </span>
              <button
                onClick={handleSave}
                aria-label={opportunity.is_saved ? 'Unsave' : 'Save'}
                className={
                  'w-7 h-7 rounded-md border flex items-center justify-center transition-colors ' +
                  (opportunity.is_saved
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300')
                }
              >
                <BookmarkSimple size={12} weight={opportunity.is_saved ? 'fill' : 'regular'} />
              </button>
            </div>

            {/* Compensation */}
            {comp && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {comp.line}
                </div>
                {comp.sub && (
                  <div className="text-[12.5px] font-semibold text-emerald-400 mt-0.5">
                    {comp.sub}
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="inline-flex items-center h-8 px-3 rounded-md border border-zinc-800 group-hover:border-zinc-600 group-hover:bg-zinc-900 text-[12px] font-semibold text-zinc-300 group-hover:text-white transition-all">
              View Details
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Context icon (project logo / venture logo / opportunity type icon) ───
function ContextIcon({ opportunity }: { opportunity: Opportunity }) {
  const projectLogo = opportunity.project?.cover_image_url
  const projectIcon = opportunity.project?.icon
  const ventureLogo = opportunity.venture?.logo_url

  if (projectLogo) {
    return (
      <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-800 relative bg-zinc-900">
        <Image src={projectLogo} alt="" fill className="object-cover" sizes="48px" />
      </div>
    )
  }
  if (ventureLogo) {
    return (
      <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-800 relative bg-zinc-900">
        <Image src={ventureLogo} alt="" fill className="object-cover" sizes="48px" />
      </div>
    )
  }
  if (projectIcon) {
    return (
      <div className="w-12 h-12 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-2xl">
        {projectIcon}
      </div>
    )
  }

  // Fallback: first letter of poster or title
  const initial = (opportunity.poster?.full_name || opportunity.title || '?').charAt(0).toUpperCase()
  return (
    <div className="w-12 h-12 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-[18px] font-bold text-zinc-400">
      {initial}
    </div>
  )
}