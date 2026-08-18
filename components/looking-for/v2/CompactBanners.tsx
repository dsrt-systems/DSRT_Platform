'use client'

import Link from 'next/link'
import { Sparkle, Rocket, Users } from '@phosphor-icons/react'

const BANNERS = [
  {
    title: 'Post an opportunity',
    subtitle: 'Find your next teammate',
    href: '/looking-for/create',
    Icon: Rocket,
    gradient: 'from-blue-500/[0.15] via-indigo-500/[0.08] to-transparent',
    accent: 'border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    title: 'Featured builders',
    subtitle: 'Discover top talent',
    href: '/looking-for?tab=people',
    Icon: Users,
    gradient: 'from-purple-500/[0.15] via-fuchsia-500/[0.08] to-transparent',
    accent: 'border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    title: 'Suggested for you',
    subtitle: 'Personalized picks',
    href: '/looking-for?tab=suggested',
    Icon: Sparkle,
    gradient: 'from-emerald-500/[0.15] via-teal-500/[0.08] to-transparent',
    accent: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
]

export function CompactBanners() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {BANNERS.map(b => (
        <Link
          key={b.href}
          href={b.href}
          className={
            'group relative overflow-hidden rounded-xl border bg-zinc-950/50 p-4 h-[76px] flex items-center gap-3 transition-all ' +
            'hover:border-zinc-700 hover:-translate-y-[1px] ' +
            'shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.03)] ' +
            'hover:shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] ' +
            b.accent
          }
        >
          {/* Gradient overlay */}
          <div className={'absolute inset-0 bg-gradient-to-br ' + b.gradient + ' opacity-70 pointer-events-none'} />

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3 w-full">
            <div className={
              'w-10 h-10 rounded-lg bg-zinc-900/80 backdrop-blur border border-zinc-800/80 flex items-center justify-center shrink-0 ' +
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_6px_rgba(0,0,0,0.3)]'
            }>
              <b.Icon size={16} weight="regular" className={b.iconColor} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[13.5px] font-bold text-white leading-tight truncate">
                {b.title}
              </h3>
              <p className="text-[11.5px] text-zinc-400 mt-0.5 truncate">
                {b.subtitle}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}