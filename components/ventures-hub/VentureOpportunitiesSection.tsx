'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserPlus, CurrencyCircleDollar, Handshake, Sparkle, Briefcase,
  Buildings, ArrowRight, Certificate, MapPin, Circle
} from '@phosphor-icons/react'

interface Opportunity {
  id: string
  type: string
  title: string
  description: string | null
  amount: string | null
  urgency: string | null
  skills: string[] | null
  location_type: string | null
  venture_id: string
  venture_name: string
  venture_slug: string
  venture_logo: string | null
  venture_industry: string | null
  venture_stage: string
  venture_number: string | null
  venture_verified: boolean
  venture_followers: number
  founder_name: string | null
  founder_avatar: string | null
  created_at: string
}

interface Props {
  scope?: 'foryou' | 'all'
  onScopeChange?: (scope: 'foryou' | 'all') => void
  compact?: boolean
}

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string; ring: string }> = {
  cofounder:    { icon: UserPlus,             label: 'Co-founder', color: 'text-purple-300', bg: 'bg-purple-500/12', ring: 'border-purple-500/30' },
  investment:   { icon: CurrencyCircleDollar, label: 'Investment', color: 'text-yellow-300', bg: 'bg-yellow-500/12', ring: 'border-yellow-500/30' },
  investor:     { icon: CurrencyCircleDollar, label: 'Investment', color: 'text-yellow-300', bg: 'bg-yellow-500/12', ring: 'border-yellow-500/30' },
  funding:      { icon: CurrencyCircleDollar, label: 'Funding',    color: 'text-yellow-300', bg: 'bg-yellow-500/12', ring: 'border-yellow-500/30' },
  hiring:       { icon: Briefcase,            label: 'Hiring',     color: 'text-orange-300', bg: 'bg-orange-500/12', ring: 'border-orange-500/30' },
  developer:    { icon: Briefcase,            label: 'Hiring',     color: 'text-orange-300', bg: 'bg-orange-500/12', ring: 'border-orange-500/30' },
  advisor:      { icon: Sparkle,              label: 'Advisor',    color: 'text-cyan-300',   bg: 'bg-cyan-500/12',   ring: 'border-cyan-500/30' },
  partner:      { icon: Handshake,            label: 'Partner',    color: 'text-emerald-300',bg: 'bg-emerald-500/12',ring: 'border-emerald-500/30' },
  partnership:  { icon: Handshake,            label: 'Partner',    color: 'text-emerald-300',bg: 'bg-emerald-500/12',ring: 'border-emerald-500/30' },
}

const FILTER_TABS = [
  { id: 'all',        label: 'All' },
  { id: 'cofounder',  label: 'Co-founder' },
  { id: 'hiring',     label: 'Hiring' },
  { id: 'investment', label: 'Investment' },
  { id: 'advisor',    label: 'Advisor' },
  { id: 'partner',    label: 'Partner' },
]

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diff < 60) return diff + 'm ago'
  const h = Math.floor(diff / 60)
  if (h < 24) return h + 'h ago'
  const days = Math.floor(h / 24)
  if (days < 30) return days + 'd ago'
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function getConfig(type: string) {
  const key = (type || '').toLowerCase().replace(/[^a-z]/g, '')
  for (const [k, cfg] of Object.entries(TYPE_CONFIG)) {
    if (key.includes(k)) return cfg
  }
  return { icon: Circle, label: type || 'Other', color: 'text-white/70', bg: 'bg-white/[0.05]', ring: 'border-white/[0.1]' }
}

export function VentureOpportunitiesSection({ scope = 'all', onScopeChange, compact = false }: Props) {
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    const url = '/api/ventures/opportunities?scope=' + scope + (filter !== 'all' ? '&type=' + filter : '') + '&limit=' + (compact ? 6 : 30)
    fetch(url)
      .then(r => r.json())
      .then(j => setOpportunities(j.opportunities || []))
      .catch(() => setOpportunities([]))
      .finally(() => setLoading(false))
  }, [scope, filter, compact])

  return (
    <div>
      {!compact && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-[19px] font-bold text-white">Opportunities</h2>
            <p className="text-[12.5px] text-white/45 mt-0.5">Co-founder · Hiring · Investment · Partnerships · Advisors</p>
          </div>
          {onScopeChange && (
            <div className="flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.08] rounded-lg p-0.5">
              <button
                onClick={() => onScopeChange('foryou')}
                className={
                  'px-3 h-8 text-[12px] font-semibold rounded-md transition-colors ' +
                  (scope === 'foryou' ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white/85')
                }
              >
                For you
              </button>
              <button
                onClick={() => onScopeChange('all')}
                className={
                  'px-3 h-8 text-[12px] font-semibold rounded-md transition-colors ' +
                  (scope === 'all' ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white/85')
                }
              >
                All
              </button>
            </div>
          )}
        </div>
      )}

      {!compact && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {FILTER_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={
                'px-3 h-8 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ' +
                (filter === t.id
                  ? 'bg-white text-black'
                  : 'bg-white/[0.03] border border-white/[0.08] text-white/70 hover:bg-white/[0.06] hover:text-white')
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[90px] bg-white/[0.02] border border-white/[0.06] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl py-10 text-center">
          <Sparkle size={26} weight="fill" className="mx-auto mb-2 text-white/25" />
          <p className="text-[13px] text-white/50">No opportunities match right now</p>
          <p className="text-[11px] text-white/35 mt-1">Check back soon — new ones appear every day.</p>
        </div>
      ) : (
        <div className={compact ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-3'}>
          {opportunities.map(op => {
            const cfg = getConfig(op.type)
            const Icon = cfg.icon
            return (
              <div
                key={op.id}
                onClick={() => router.push('/ventures/' + op.venture_slug)}
                className="group flex items-start gap-3 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] rounded-xl p-3.5 cursor-pointer transition-all"
              >
                {/* Type icon */}
                <div className={'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ' + cfg.bg + ' ' + cfg.ring}>
                  <Icon size={16} weight="fill" className={cfg.color} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Type label */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={'text-[10px] font-bold uppercase tracking-wider ' + cfg.color}>
                      {cfg.label}
                    </span>
                    {op.urgency && op.urgency !== 'normal' && (
                      <span className="text-[9px] font-bold uppercase text-red-300 bg-red-500/12 border border-red-500/25 px-1.5 py-0.5 rounded">
                        {op.urgency}
                      </span>
                    )}
                    <span className="text-[10px] text-white/35">· {timeAgo(op.created_at)}</span>
                  </div>

                  {/* Title */}
                  <p className="text-[13.5px] font-semibold text-white line-clamp-1 mb-1">{op.title}</p>

                  {/* Venture row */}
                  <div className="flex items-center gap-2 text-[11px] text-white/55">
                    <div className="w-4 h-4 rounded bg-white/[0.05] border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {op.venture_logo ? (
                        <img src={op.venture_logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Buildings size={9} weight="fill" className="text-white/40" />
                      )}
                    </div>
                    <span className="text-white/75 font-medium truncate">{op.venture_name}</span>
                    {op.venture_verified && <Certificate size={9} weight="fill" className="text-blue-400 flex-shrink-0" />}
                    {op.venture_industry && (
                      <span className="text-white/40">· {op.venture_industry}</span>
                    )}
                  </div>

                  {/* Skills / location */}
                  {(op.skills && op.skills.length > 0) || op.location_type ? (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {op.location_type && (
                        <span className="text-[10px] text-white/50 flex items-center gap-0.5">
                          <MapPin size={9} /> {op.location_type}
                        </span>
                      )}
                      {(op.skills || []).slice(0, 3).map((s, i) => (
                        <span key={i} className="text-[10px] text-white/60 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <ArrowRight size={13} className="text-white/30 group-hover:text-white/70 flex-shrink-0 mt-1" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
