'use client'

import {
  Buildings, Users, Heart, BookmarkSimple, ArrowRight, MapPin, Trophy,
  Certificate, Circle, CurrencyCircleDollar, ChartLineUp, Sparkle,
  Handshake, Briefcase, UserPlus, TrendUp, DotsThree, EyeSlash
} from '@phosphor-icons/react'
import { useState } from 'react'

interface Venture {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  logo_url: string | null
  industry: string | null
  sector: string | null
  stage: string
  venture_number: string | null
  location: string | null
  headquarters: string | null
  team_size: number | null
  follower_count: number
  save_count: number
  view_count: number
  traction_score: number
  global_rank: number | null
  industry_rank: number | null
  is_verified: boolean
  is_building_public: boolean
  is_hiring: boolean
  seeking_investment: boolean
  seeking_cofounder: boolean
  seeking_advisor: boolean
  seeking_partner: boolean
  key_metric_label: string | null
  key_metric_value: string | null
  revenue_range: string | null
  user_count: string | null
  monthly_growth: string | null
  growth_status: string | null
  funding_stage: string | null
  funding_amount: string | null
  tags: string[]
  founder_name?: string | null
  founder_username?: string | null
  founder_avatar?: string | null
  founder_user_verified?: boolean
  user_saved?: boolean
  user_following?: boolean
  active_opportunities?: number
  member_count?: number
}

interface Props {
  venture: Venture
  onOpen: () => void
  onToggleSave: () => void
  onDismiss?: () => void
  variant?: 'default' | 'compact'
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea',
  validation: 'Validation',
  pre_seed: 'Pre-Seed',
  seed: 'Seed',
  early_growth: 'Early Growth',
  growth: 'Growth',
  scale: 'Scale',
  public: 'Public',
}

const STAGE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  idea:         { bg: 'bg-purple-500/10', text: 'text-purple-200', dot: 'bg-purple-400' },
  validation:   { bg: 'bg-indigo-500/10', text: 'text-indigo-200', dot: 'bg-indigo-400' },
  pre_seed:     { bg: 'bg-blue-500/10',   text: 'text-blue-200',   dot: 'bg-blue-400' },
  seed:         { bg: 'bg-cyan-500/10',   text: 'text-cyan-200',   dot: 'bg-cyan-400' },
  early_growth: { bg: 'bg-emerald-500/10',text: 'text-emerald-200',dot: 'bg-emerald-400' },
  growth:       { bg: 'bg-green-500/10',  text: 'text-green-200',  dot: 'bg-green-400' },
  scale:        { bg: 'bg-yellow-500/10', text: 'text-yellow-200', dot: 'bg-yellow-400' },
  public:       { bg: 'bg-pink-500/10',   text: 'text-pink-200',   dot: 'bg-pink-400' },
}

function formatNumber(n: number | null | undefined): string {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

export function VentureCard({ venture, onOpen, onToggleSave, onDismiss, variant = 'default' }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const stage = STAGE_STYLES[venture.stage] || STAGE_STYLES.idea
  const stageLabel = STAGE_LABELS[venture.stage] || venture.stage

  const opportunityBadges = []
  if (venture.is_hiring) opportunityBadges.push({ icon: Briefcase, label: 'Hiring', color: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/25' })
  if (venture.seeking_investment) opportunityBadges.push({ icon: CurrencyCircleDollar, label: 'Raising', color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/25' })
  if (venture.seeking_cofounder) opportunityBadges.push({ icon: UserPlus, label: 'Co-founder', color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/25' })
  if (venture.seeking_advisor) opportunityBadges.push({ icon: Sparkle, label: 'Advisor', color: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-500/25' })
  if (venture.seeking_partner) opportunityBadges.push({ icon: Handshake, label: 'Partner', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/25' })

  const teamCount = venture.member_count || venture.team_size || 1

  if (variant === 'compact') {
    return (
      <div
        onClick={onOpen}
        className="group flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] rounded-lg cursor-pointer transition-all"
      >
        <div className="w-11 h-11 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {venture.logo_url ? (
            <img src={venture.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Buildings size={17} weight="fill" className="text-white/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-[13px] font-semibold text-white truncate">{venture.name}</p>
            {venture.is_verified && <Certificate size={10} weight="fill" className="text-blue-400 flex-shrink-0" />}
          </div>
          <p className="text-[11px] text-white/45 truncate">{venture.industry || 'Venture'} · {stageLabel}</p>
        </div>
        <ArrowRight size={13} className="text-white/30 flex-shrink-0" />
      </div>
    )
  }

  return (
    <div
      onClick={onOpen}
      className="group relative flex flex-col bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.18] rounded-2xl overflow-hidden cursor-pointer transition-all"
    >
      {/* Header row: logo + save/menu */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {venture.logo_url ? (
              <img src={venture.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Buildings size={22} weight="fill" className="text-white/40" />
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSave() }}
              className={
                'w-8 h-8 rounded-lg border flex items-center justify-center transition-all ' +
                (venture.user_saved
                  ? 'bg-amber-500/20 border-amber-400/45 text-amber-300'
                  : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white')
              }
              aria-label={venture.user_saved ? 'Unsave' : 'Save'}
            >
              <BookmarkSimple size={13} weight={venture.user_saved ? 'fill' : 'regular'} />
            </button>
            {onDismiss && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                  className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white flex items-center justify-center"
                >
                  <DotsThree size={14} weight="bold" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                    <div className="absolute z-40 top-9 right-0 w-[160px] bg-[#12121a] border border-white/[0.08] rounded-lg shadow-2xl py-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDismiss?.() }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/80 hover:bg-white/[0.05]"
                      >
                        <EyeSlash size={12} /> Not interested
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Name + verified */}
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="text-[16px] font-bold text-white leading-tight truncate">{venture.name}</h3>
          {venture.is_verified && <Certificate size={12} weight="fill" className="text-blue-400 flex-shrink-0" />}
        </div>

        {/* Tagline */}
        {venture.tagline && (
          <p className="text-[12.5px] text-white/60 line-clamp-2 leading-snug mb-2">{venture.tagline}</p>
        )}

        {/* Venture number + stage + industry meta */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] mb-3">
          {venture.venture_number && (
            <span className="text-white/40 font-mono">{venture.venture_number}</span>
          )}
          <span className={'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ' + stage.bg + ' ' + stage.text}>
            <span className={'w-1 h-1 rounded-full ' + stage.dot} />
            {stageLabel}
          </span>
          {venture.industry && (
            <span className="text-white/50">· {venture.industry}</span>
          )}
        </div>

        {/* Business metrics row (only if venture chose to disclose) */}
        {(venture.key_metric_value || venture.user_count || venture.revenue_range || venture.monthly_growth) && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {venture.key_metric_value && (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-2 py-1.5 text-center">
                <p className="text-[13px] font-bold text-white leading-none">{venture.key_metric_value}</p>
                <p className="text-[9px] text-white/45 uppercase tracking-wider font-semibold mt-0.5 truncate">
                  {venture.key_metric_label || 'Metric'}
                </p>
              </div>
            )}
            {venture.user_count && !venture.key_metric_value && (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-2 py-1.5 text-center">
                <p className="text-[13px] font-bold text-white leading-none">{venture.user_count}</p>
                <p className="text-[9px] text-white/45 uppercase tracking-wider font-semibold mt-0.5">Users</p>
              </div>
            )}
            {venture.revenue_range && (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-2 py-1.5 text-center">
                <p className="text-[13px] font-bold text-emerald-300 leading-none">{venture.revenue_range}</p>
                <p className="text-[9px] text-white/45 uppercase tracking-wider font-semibold mt-0.5">Revenue</p>
              </div>
            )}
            {venture.monthly_growth && (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-2 py-1.5 text-center">
                <p className="text-[13px] font-bold text-emerald-300 leading-none flex items-center justify-center gap-0.5">
                  <TrendUp size={10} weight="bold" /> {venture.monthly_growth}
                </p>
                <p className="text-[9px] text-white/45 uppercase tracking-wider font-semibold mt-0.5">Growth</p>
              </div>
            )}
          </div>
        )}

        {/* Founder + Team + Location row */}
        <div className="flex items-center gap-3 text-[11px] text-white/55 mb-3">
          <span className="flex items-center gap-1"><Users size={11} weight="fill" /> {teamCount} team</span>
          <span className="flex items-center gap-1"><Heart size={11} weight="fill" /> {formatNumber(venture.follower_count)}</span>
          {(venture.location || venture.headquarters) && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={11} /> {venture.location || venture.headquarters}
            </span>
          )}
        </div>

        {/* Opportunity badges */}
        {opportunityBadges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {opportunityBadges.slice(0, 3).map((b, i) => {
              const Icon = b.icon
              return (
                <span key={i} className={'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ' + b.bg + ' ' + b.color}>
                  <Icon size={9} weight="fill" /> {b.label}
                </span>
              )
            })}
            {opportunityBadges.length > 3 && (
              <span className="text-[10px] font-semibold text-white/40 px-1.5 py-0.5">+{opportunityBadges.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer: ranks + View button */}
      <div className="mt-auto flex items-center justify-between px-4 py-3 border-t border-white/[0.05] bg-white/[0.01]">
        {venture.global_rank ? (
          <span className="flex items-center gap-1 text-[11px]">
            <Trophy size={11} weight="fill" className="text-yellow-400" />
            <span className="text-white font-bold">#{venture.global_rank}</span>
            <span className="text-white/40">Global</span>
          </span>
        ) : venture.industry_rank && venture.industry ? (
          <span className="flex items-center gap-1 text-[11px]">
            <Trophy size={11} weight="fill" className="text-white/50" />
            <span className="text-white font-bold">#{venture.industry_rank}</span>
            <span className="text-white/40 truncate">{venture.industry}</span>
          </span>
        ) : (
          <span className="text-[11px] text-white/40 flex items-center gap-1">
            <ChartLineUp size={11} /> Building
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onOpen() }}
          className="flex items-center gap-1 text-[11.5px] font-semibold text-white bg-white/[0.06] group-hover:bg-white group-hover:text-black px-2.5 h-7 rounded-md transition-colors"
        >
          View venture <ArrowRight size={11} weight="bold" />
        </button>
      </div>
    </div>
  )
}
