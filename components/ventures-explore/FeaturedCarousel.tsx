'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CaretLeft, CaretRight, Play, Pause } from '@phosphor-icons/react'
import Link from 'next/link'

interface Banner {
  id: string
  image_url: string
  cta_route?: string
  title?: string
}

interface FeaturedCarouselProps {
  banners: Banner[]
}

// VENTURES-ONLY fallbacks (never shared with Projects)
const VENTURE_FALLBACK_BANNERS = [
  '/banners/venture-1.png',
  '/banners/venture-2.png',
  '/banners/venture-3.png',
  '/banners/venture-4.png',
  '/banners/venture-5.png',
  // Temporary until new assets are uploaded:
  '/banners/coco-bg.png',
  '/banners/team-up-2.png',
  '/dsrt-community-banner.png',
]

export function FeaturedCarousel({ banners }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const trackedImpressions = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (isPaused || !banners || banners.length <= 1) return
    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length)
    }, 7000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [currentIndex, isPaused, banners])

  useEffect(() => {
    if (!banners || banners.length === 0) return
    const activeBanner = banners[currentIndex]
    if (activeBanner && !trackedImpressions.current.has(activeBanner.id)) {
      trackedImpressions.current.add(activeBanner.id)
      fetch('/api/ventures/explore/banner-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_id: activeBanner.id, event_type: 'impression' }),
      }).catch(() => {})
    }
  }, [currentIndex, banners])

  const handleBannerClick = () => {
    const activeBanner = banners[currentIndex]
    if (!activeBanner) return
    fetch('/api/ventures/explore/banner-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banner_id: activeBanner.id, event_type: 'click' }),
      keepalive: true,
    }).catch(() => {})
  }

  if (!banners || banners.length === 0) return null

  const activeBanner = banners[currentIndex] || banners[0]
  const bannerId = activeBanner.id || `venture-banner-${currentIndex}`
  const hasError = imageErrors[bannerId]
  const displayImageUrl = hasError
    ? VENTURE_FALLBACK_BANNERS[currentIndex % VENTURE_FALLBACK_BANNERS.length]
    : activeBanner.image_url || VENTURE_FALLBACK_BANNERS[0]

  const handleImageError = () => {
    setImageErrors(prev => ({ ...prev, [bannerId]: true }))
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d10] group shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Strict 3:1 — scales identically on every device */}
      <div className="relative w-full aspect-[3/1] overflow-hidden bg-zinc-900">
        <Link href={activeBanner.cta_route || '#'} onClick={handleBannerClick} className="block w-full h-full">
          <img
            src={displayImageUrl}
            alt={activeBanner.title || 'Venture featured banner'}
            onError={handleImageError}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        </Link>

        {banners.length > 1 && (
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-5 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/10 scale-75 sm:scale-100 origin-bottom-right">
            <div className="flex items-center gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="ml-1 text-zinc-400 hover:text-white transition-colors"
              aria-label={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? <Play size={10} weight="fill" /> : <Pause size={10} weight="fill" />}
            </button>
          </div>
        )}

        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <CaretLeft size={14} weight="bold" className="sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex(prev => (prev + 1) % banners.length)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <CaretRight size={14} weight="bold" className="sm:w-4 sm:h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}