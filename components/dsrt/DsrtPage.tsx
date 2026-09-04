'use client'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface DsrtPageProps {
  children: ReactNode
  className?: string
  /** Page width — mobile-first responsive */
  width?: 'narrow' | 'default' | 'wide' | 'full'
  /** Padding preset */
  padding?: 'none' | 'compact' | 'default' | 'loose'
  /** Enable safe-area bottom for mobile devices with home bar */
  safeBottom?: boolean
}

const widthMap = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-[1400px]',
  full: 'max-w-none',
}

const paddingMap = {
  none: '',
  compact: 'px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6',
  default: 'px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8',
  loose: 'px-3 py-6 sm:px-4 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12',
}

/**
 * DSRT Page — mobile-first responsive page container.
 * Replaces raw <div className="max-w-6xl mx-auto..."> patterns.
 */
export function DsrtPage({
  children,
  className,
  width = 'default',
  padding = 'default',
  safeBottom = true,
}: DsrtPageProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        widthMap[width],
        paddingMap[padding],
        safeBottom && 'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      {children}
    </div>
  )
}