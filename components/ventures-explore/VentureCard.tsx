'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DotsThree, MapPin, Users, CheckCircle, Heart, ShareNetwork, EyeSlash, WarningCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ExploreVentureCard } from '@/lib/venture-explore/types'

interface VentureCardProps {
  venture: ExploreVentureCard
  onNotInterested?: (id: string) => void
}

export function VentureCard({ venture, onNotInterested }: VentureCardProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(venture.is_following || false)

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFollowing(!isFollowing)
    try {
      const res = await fetch('/api/profile/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          following_id: venture.id,
          following_type: 'venture'
        })
      })
      if (res.ok) {
        toast.success(isFollowing ? `Unfollowed ${venture.name}` : `Following ${venture.name}`)
      }
    } catch {
      setIsFollowing(isFollowing)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/ventures/${venture.slug}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
    setMenuOpen(false)
  }

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    if (onNotInterested) onNotInterested(venture.id)
    try {
      await fetch('/api/ventures/explore/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venture_id: venture.id, reason: 'not_relevant' })
      })
      toast.info('Venture hidden from your recommendations')
    } catch {
      // Ignore
    }
  }

  return (
    <div
      onClick={() => router.push(`/ventures/${venture.slug}`)}
      className="group bg-[#121215] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col shadow-sm"
    >
      {/* 16:9 Thumbnail Header */}
      <div className="relative w-full aspect-[16/9] bg-[#09090b] border-b border-white/[0.04] overflow-hidden">
        {venture.cover_url ? (
          <img
            src={venture.cover_url}
            alt={venture.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
            <span className="text-3xl font-bold text-zinc-700">{venture.name[0]?.toUpperCase()}</span>
          </div>
        )}

        {/* Logo Overlay */}
        <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-[#09090b] border border-white/[0.12] p-0.5 shadow-lg overflow-hidden flex-shrink-0">
          {venture.logo_url ? (
            <img src={venture.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="w-full h-full bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-bold text-white">
              {venture.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Optional Status Badge */}
        {venture.reason_label && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300 uppercase tracking-wider">
            {venture.reason_label}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Header Row */}
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
              {venture.tagline && (
                <p className="text-[12.5px] text-zinc-400 line-clamp-1 mt-0.5 leading-snug">
                  {venture.tagline}
                </p>
              )}
            </div>

            {/* 3-Dot Context Menu */}
            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(!menuOpen)
                }}
                className="w-7 h-7 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              >
                <DotsThree size={18} weight="bold" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                  <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-[#0d0d10] border border-white/[0.1] rounded-xl shadow-2xl p-1 space-y-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/ventures/${venture.slug}`); }}
                      className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      Open venture
                    </button>
                    <button
                      onClick={handleFollowToggle}
                      className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      {isFollowing ? 'Unfollow' : 'Follow venture'}
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      Share
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

          {/* Tags Metadata Row */}
          <div className="flex items-center gap-2 text-[11.5px] text-zinc-500 font-medium mt-2 flex-wrap">
            {venture.industry && <span>{venture.industry}</span>}
            {venture.industry && venture.stage && <span className="w-1 h-1 rounded-full bg-zinc-700" />}
            {venture.stage && <span className="capitalize">{venture.stage.replace('-', ' ')}</span>}
            {venture.location && (
              <>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-0.5"><MapPin size={10} /> {venture.location}</span>
              </>
            )}
          </div>
        </div>

        {/* Founder & Activity Footer */}
        <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11.5px] text-zinc-400">
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
            <span>{venture.follower_count || 0} followers</span>
          )}

          {venture.is_hiring && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10.5px] border border-emerald-500/20">
              Hiring
            </span>
          )}
        </div>
      </div>
    </div>
  )
}