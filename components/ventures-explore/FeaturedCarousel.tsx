'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CaretLeft, CaretRight, Play, Pause } from '@phosphor-icons/react'

interface Banner {
  id: string
  title: string
  subtitle?: string
  image_url: string
  cta_label?: string
  cta_route?: string
}

interface FeaturedCarouselProps {
  banners: Banner[]
}

export function FeaturedCarousel({ banners }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isPaused || banners.length <= 1) return
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 7000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, isPaused, banners.length])

  if (!banners || banners.length === 0) return null

  const activeBanner = banners[currentIndex]

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d10] group shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Aspect Ratio Container 1600x340 (4.7:1) */}
      <div className="relative w-full aspect-[4.7/1] min-h-[180px] max-h-[340px] overflow-hidden">
        <a href={activeBanner.cta_route || '#'} className="block w-full h-full">
          <img
            src={activeBanner.image_url}
            alt={activeBanner.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        </a>

        {/* Carousel Navigation Controls */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 right-5 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {/* Dots */}
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

            {/* Pause/Play toggle */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="ml-1 text-zinc-400 hover:text-white transition-colors"
              aria-label={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? <Play size={12} weight="fill" /> : <Pause size={12} weight="fill" />}
            </button>
          </div>
        )}

        {/* Left / Right Arrow Hover Buttons */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}