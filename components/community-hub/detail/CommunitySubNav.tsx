'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutGrid, MessagesSquare, CalendarDays, FolderKanban, Users, Info } from 'lucide-react'

interface Props {
  slug: string
  memberCount: number
}

export function CommunitySubNav({ slug, memberCount }: Props) {
  const pathname = usePathname()
  const base = `/community/${slug}`

  const items = [
    { key: 'overview', label: 'Overview', href: base, icon: LayoutGrid, exact: true },
    { key: 'discussion', label: 'Discussion', href: `${base}/discussion`, icon: MessagesSquare },
    { key: 'events', label: 'Events', href: `${base}/events`, icon: CalendarDays },
    { key: 'projects', label: 'Projects', href: `${base}/projects`, icon: FolderKanban },
    { key: 'people', label: 'People', href: `${base}/people`, icon: Users, badge: memberCount },
    { key: 'about', label: 'About', href: `${base}/about`, icon: Info },
  ]

  return (
    <nav className="border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-1">
        {items.map((it) => {
          const Icon = it.icon
          const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + '/')
          return (
            <Link
              key={it.key}
              href={it.href}
              className={cn(
                'group relative flex items-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors whitespace-nowrap',
                active ? 'text-white' : 'text-white/55 hover:text-white/85'
              )}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              {it.label}
              {typeof it.badge === 'number' && it.badge > 0 && (
                <span className={cn(
                  'ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold leading-none',
                  active ? 'bg-white/15 text-white' : 'bg-white/[0.06] text-white/60'
                )}>
                  {it.badge > 99 ? '99+' : it.badge}
                </span>
              )}
              {active && (
                <span className="absolute left-0 right-0 -bottom-px h-px bg-white/80" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}