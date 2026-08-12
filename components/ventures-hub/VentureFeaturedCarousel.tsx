'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Buildings, CaretLeft, CaretRight, Trophy, Certificate, ArrowRight,
  Users, Heart, TrendUp, MapPin, Sparkle
} from '@phosphor-icons/react'

interface Venture {
  id: string
  slug: string
  name: string
  tagline: string | null
  logo_url: string | null
  industry: string | null
  stage: string
  location: string | null
  headquarters: string | null
  team_size: number | null
  follower_count: number
  traction_score: number
  global_rank: number | null
  is_verified: boolean
  key_metric_label: string | null
  key_metric_value: string | null
  revenue_range: string | null
  user_count: string | null
  monthly_growth: string | null
  is_hiring: boolean
  seeking_investment: boolean
  founder?: { full_name: string; username: string; avatar_url: string | null; is_verified: boolean } | null
}

interface Props {
  ventures: Venture[]
  autoRotate?: boolean
  intervalMs?: number
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea', validation: 'Validation', pre_seed: 'Pre-Seed', seed: 'Seed',
  early_growth: 'Early Growth', growth: 'Growth', scale: 'Scale', public: 'Public',
}

function formatNumber(n: number | null | undefined): string {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

export function VentureFeaturedCarousel({ ventures, autoRotate = true, intervalMs = 7000 }: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const total = ventures.length

  useEffect(() => {
    if (!autoRotate || paused || total <= 1) return
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % total), intervalMs)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRotate, paused, total, intervalMs])

  if (total === 0) {
    return (
      <div className="w-full rounded-2xl bg-gradient-to-br from-indigo-900/25 to-blue-900/15 border border-white/[0.08] flex items-center justify-center" style={{ height: 260 }}>
        <div className="text-center">
          <Sparkle size={26} weight="fill" className="mx-auto mb-2 text-white/25" />
          <p className="text-[13px] text-white/45">No featured ventures yet</p>
        </div>
      </div>
    )
  }

  const v = ventures[index]
  const stageLabel = STAGE_LABELS[v.stage] || v.stage

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/[0.1] group bg-gradient-to-br from-[#12121a] via-[#0f0f18] to-[#0a0a0f]"
      style={{ minHeight: 280 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background gradient accent based on logo */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/15 blur-3xl rounded-full" />
      </div>

      <div className="relative h-full p-6 md:p-8 flex flex-col md:flex-row md:items-start gap-6">
        {/* LEFT: Logo + brand block */}
        <div className="flex md:flex-col items-start gap-4 md:w-[180px] flex-shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xl">
            {v.logo_url ? (
              <img src={v.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Buildings size={36} weight="fill" className="text-white/40" />
            )}
          </div>
          <div className="flex-1 md:flex-none min-w-0">
            <span className="inline-flex items-center gap-1 bg-purple-600/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white mb-2">
              <Trophy size={10} weight="fill" /> Featured Venture
            </span>
            {v.global_rank && (
              <div className="flex items-center gap-1 text-[11px] text-white/60 mt-1">
                <Trophy size={10} weight="fill" className="text-yellow-400" />
                <span className="text-white font-bold">#{v.global_rank}</span>
                <span>Global rank</span>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Name + tagline + meta + metrics */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-[24px] md:text-[28px] font-bold text-white leading-tight tracking-tight">{v.name}</h2>
            {v.is_verified && <Certificate size={16} weight="fill" className="text-blue-400 flex-shrink-0" />}
          </div>
          {v.tagline && (
            <p className="text-[14px] md:text-[15px] text-white/70 line-clamp-2 leading-relaxed mb-3 max-w-2xl">{v.tagline}</p>
          )}

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold text-purple-200 bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded">
              {stageLabel}
            </span>
            {v.industry && (
              <span className="text-[11px] font-semibold text-white/70 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded">
                {v.industry}
              </span>
            )}
            {(v.location || v.headquarters) && (
              <span className="text-[11px] text-white/50 flex items-center gap-1">
                <MapPin size={10} /> {v.location || v.headquarters}
              </span>
            )}
            {v.team_size && v.team_size > 0 && (
              <span className="text-[11px] text-white/50 flex items-center gap-1">
                <Users size={10} weight="fill" /> {v.team_size} members
              </span>
            )}
          </div>

          {/* Business metrics */}
          {(v.key_metric_value || v.user_count || v.revenue_range || v.monthly_growth) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {v.user_count && (
                <MetricTile label="Users" value={v.user_count} />
              )}
              {v.key_metric_value && v.key_metric_label && (
                <MetricTile label={v.key_metric_label} value={v.key_metric_value} />
              )}
              {v.revenue_range && (
                <MetricTile label="Revenue" value={v.revenue_range} accent="text-emerald-300" />
              )}
              {v.monthly_growth && (
                <MetricTile label="Growth" value={v.monthly_growth} accent="text-emerald-300" icon={<TrendUp size={11} weight="bold" />} />
              )}
            </div>
          )}

          {/* Opportunity badges + CTA */}
          <div className="flex flex-wrap items-center gap-2">
            {v.is_hiring && (
              <span className="text-[11px] font-semibold text-orange-300 bg-orange-500/12 border border-orange-500/25 px-2 py-0.5 rounded flex items-center gap-1">
                <Users size={10} weight="fill" /> Hiring
              </span>
            )}
            {v.seeking_investment && (
              <span className="text-[11px] font-semibold text-yellow-300 bg-yellow-500/12 border border-yellow-500/25 px-2 py-0.5 rounded">
                Raising
              </span>
            )}
            <div className="flex-1" />
            <button
              onClick={() => router.push('/ventures/' + v.slug)}
              className="inline-flex items-center gap-1.5 bg-white text-black hover:bg-white/90 font-semibold text-[13px] px-4 py-2 rounded-lg transition-colors shadow-lg"
            >
              View venture <ArrowRight size={12} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      {total > 1 && (
        <>
          <button
            onClick={() => setIndex(i => (i - 1 + total) % total)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Previous"
          >
            <CaretLeft size={15} weight="bold" />
          </button>
          <button
            onClick={() => setIndex(i => (i + 1) % total)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Next"
          >
            <CaretRight size={15} weight="bold" />
          </button>

          <div className="absolute bottom-3 right-6 flex items-center gap-1">
            {ventures.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={
                  (i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/30') +
                  ' h-1.5 rounded-full transition-all'
                }
                aria-label={'Go to slide ' + (i + 1)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MetricTile({ label, value, accent = 'text-white', icon }: {
  label: string; value: string; accent?: string; icon?: React.ReactNode
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 min-w-[100px]">
      <p className={'text-[15px] font-bold leading-none flex items-center gap-1 ' + accent}>
        {icon}{value}
      </p>
      <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mt-1">{label}</p>
    </div>
  )
}
