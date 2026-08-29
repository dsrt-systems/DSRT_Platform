'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DotsThree, MapPin, Users, CheckCircle, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ExploreVentureCard } from '@/lib/venture-explore/types'
import { STAGES } from '@/lib/config/sectors'
import { getAffinityLearner } from '@/lib/venture-explore/affinity-learner'

interface VentureCardProps {
  venture: ExploreVentureCard
  onNotInterested?: (id: string) => void
  position?: number
  moduleType?: string
}

export function VentureCard({ venture, onNotInterested, position = 0, moduleType }: VentureCardProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const impressionFiredRef = useRef(false)

  const stageConfig = STAGES.find(s => s.id === venture.stage)
  const domainSlugs = [venture.industry, venture.sector, venture.sub_category].filter(Boolean) as string[]

  // Impression tracking
  useEffect(() => {
    if (!cardRef.current || impressionFiredRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !impressionFiredRef.current) {
          impressionFiredRef.current = true

          getAffinityLearner().track({
            venture_id: venture.id,
            action: 'view',
            domain_slugs: domainSlugs,
          })

          fetch('/api/ventures/explore/impression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              venture_id: venture.id,
              module_type: moduleType || 'unknown',
              position,
            }),
            keepalive: true,
          }).catch(() => {})
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [venture.id, position, moduleType, domainSlugs])

  const handleCardClick = () => {
    getAffinityLearner().track({
      venture_id: venture.id,
      action: 'click',
      domain_slugs: domainSlugs,
    })
    router.push(`/ventures/${venture.slug}`)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/ventures/${venture.slug}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
    setMenuOpen(false)
    getAffinityLearner().track({
      venture_id: venture.id,
      action: 'share',
      domain_slugs: domainSlugs,
    })
  }

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    if (onNotInterested) onNotInterested(venture.id)

    getAffinityLearner().track({
      venture_id: venture.id,
      action: 'dismiss',
      domain_slugs: domainSlugs,
    })

    try {
      await fetch('/api/ventures/explore/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venture_id: venture.id, reason: 'not_relevant' })
      })
      toast.info('Venture hidden from your recommendations')
    } catch {}
  }

  // Build the metadata chip list
  const metaTags: { label: string; type: 'sector' | 'stage' | 'location' }[] = []
  if (venture.industry) metaTags.push({ label: venture.industry, type: 'sector' })
  if (venture.sub_category) metaTags.push({ label: venture.sub_category, type: 'sector' })
  if (stageConfig) metaTags.push({ label: stageConfig.label, type: 'stage' })
  if (venture.location) metaTags.push({ label: venture.location.split(',')[0], type: 'location' })

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className="group bg-[#121215] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col shadow-sm"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[16/9] bg-[#09090b] border-b border-white/[0.04] overflow-hidden">
        {venture.cover_url ? (
          <img
            src={venture.cover_url}
            alt={venture.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
            <span className="text-3xl font-bold text-zinc-700">{venture.name[0]?.toUpperCase()}</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-[#09090b] border border-white/[0.12] p-0.5 shadow-lg overflow-hidden flex-shrink-0">
          {venture.logo_url ? (
            <img src={venture.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="w-full h-full bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-bold text-white">
              {venture.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {venture.reason_label && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300 uppercase tracking-wider shadow-sm">
            {venture.reason_label}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col space-y-3">
        <div>
          {/* Name + Menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[15px] font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                  {venture.name}
                </h3>
                {venture.is_verified && (
                  <CheckCircle size={14} weight="fill" className="text-blue-500 shrink-0" />
                )}
              </div>
            </div>

            <div className="relative shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="w-7 h-7 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              >
                <DotsThree size={18} weight="bold" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                  <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-[#0d0d10] border border-white/[0.1] rounded-xl shadow-2xl p-1 space-y-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                      className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      Open venture
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      Share link
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

          {/* FULL Tagline (2 lines) */}
          {venture.tagline && (
            <p className="text-[12.5px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
              {venture.tagline}
            </p>
          )}

          {/* Sector + Stage + Location Chip Row */}
          {metaTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-3">
              {metaTags.map((tag, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${
                    tag.type === 'sector'
                      ? 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                      : tag.type === 'stage'
                      ? 'bg-white/[0.06] text-white border-white/[0.12]'
                      : 'bg-white/[0.03] text-zinc-400 border-white/[0.06]'
                  }`}
                >
                  {tag.type === 'location' && <MapPin size={9} />}
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Founder + Hiring */}
        <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11.5px] text-zinc-400 mt-auto">
          {venture.founder ? (
            <Link
              href={`/profile/${venture.founder.username}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 hover:text-white transition-colors min-w-0"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                {venture.founder.avatar_url ? (
                  <img src={venture.founder.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white">
                    {venture.founder.full_name[0]}
                  </span>
                )}
              </div>
              <span className="truncate">{venture.founder.full_name}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1">
              <Users size={12} weight="duotone" /> {venture.team_size || 1} Builder{(venture.team_size || 1) !== 1 ? 's' : ''}
            </span>
          )}

          {venture.is_hiring && (
            <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white font-semibold text-[10.5px] border border-white/[0.12] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Hiring
            </span>
          )}
        </div>
      </div>
    </div>
  )
}