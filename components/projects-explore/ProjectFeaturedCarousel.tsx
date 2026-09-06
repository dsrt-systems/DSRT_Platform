'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { CaretLeft, CaretRight, Play, Pause } from '@phosphor-icons/react'

interface Banner {
  id: string
  title?: string
  image_url: string
  cta_route?: string
}

// PROJECTS-ONLY fallbacks (never shared with Ventures)
const PROJECT_FALLBACK_BANNERS = [
  '/banners/project-1.png',
  '/banners/project-2.png',
  '/banners/project-3.png',
  '/banners/project-4.png',
  '/banners/project-5.png',
  // Temporary until new assets are uploaded:
  '/banners/create-project-bg.png',
  '/banners/team-up-1.png',
  '/banners/team-up-3.png',
]

export function ProjectFeaturedCarousel({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isTabHidden, setIsTabHidden] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = () => setIsTabHidden(document.hidden)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  useEffect(() => {
    if (isPaused || isTabHidden || !banners || banners.length <= 1) return
    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length)
    }, 7000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, isPaused, isTabHidden, banners])

  if (!banners || banners.length === 0) return null

  const activeBanner = banners[currentIndex] || banners[0]
  const bannerId = activeBanner.id || `project-banner-${currentIndex}`
  const hasError = imageErrors[bannerId]
  const displayImageUrl = hasError
    ? PROJECT_FALLBACK_BANNERS[currentIndex % PROJECT_FALLBACK_BANNERS.length]
    : activeBanner.image_url || PROJECT_FALLBACK_BANNERS[0]

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
        <Link href={activeBanner.cta_route || '#'} className="block w-full h-full">
          <img
            src={displayImageUrl}
            alt={activeBanner.title || 'Project featured banner'}
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