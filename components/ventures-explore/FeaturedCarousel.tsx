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

export function FeaturedCarousel({ banners }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Track which banners have been seen to avoid spamming the DB
  const trackedImpressions = useRef<Set<string>>(new Set())

  // Auto-play timer
  useEffect(() => {
    if (isPaused || banners.length <= 1) return
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 7000)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [currentIndex, isPaused, banners.length])

  // Impression Logging
  useEffect(() => {
    if (!banners || banners.length === 0) return
    const activeBanner = banners[currentIndex]
    
    if (activeBanner && !trackedImpressions.current.has(activeBanner.id)) {
      trackedImpressions.current.add(activeBanner.id)
      
      // Fire analytics
      fetch('/api/ventures/explore/banner-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_id: activeBanner.id, event_type: 'impression' })
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
      keepalive: true
    }).catch(() => {})
  }

  if (!banners || banners.length === 0) return null

  const activeBanner = banners[currentIndex]

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d10] group shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full aspect-[2/1] sm:aspect-[3/1] md:aspect-[4.7/1] overflow-hidden bg-zinc-900">
        <Link href={activeBanner.cta_route || '#'} onClick={handleBannerClick} className="block w-full h-full">
          <img
            src={activeBanner.image_url}
            alt={activeBanner.title || 'Featured Banner'}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        </Link>

        {banners.length > 1 && (
          <div className="absolute bottom-4 right-5 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
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
            >
              {isPaused ? <Play size={10} weight="fill" /> : <Pause size={10} weight="fill" />}
            </button>
          </div>
        )}

        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}