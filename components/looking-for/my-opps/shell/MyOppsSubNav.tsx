'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/looking-for/my-opportunities', label: 'Overview', match: (p: string) => p === '/looking-for/my-opportunities' },
  { href: '/looking-for/my-opportunities/portfolio', label: 'Opportunities' },
  { href: '/looking-for/my-opportunities/applications', label: 'Applications' },
  { href: '/looking-for/my-opportunities/messages', label: 'Messages' },
  { href: '/looking-for/my-opportunities/analytics', label: 'Analytics' },
]

export function MyOppsSubNav() {
  const pathname = usePathname() || ''

  return (
    <div className="border-b border-zinc-800/80">
      <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
        {ITEMS.map(item => {
          const active = item.match ? item.match(pathname) : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                'relative py-3 px-4 text-[13px] font-semibold whitespace-nowrap transition-colors ' +
                (active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200')
              }
            >
              {item.label}
              {active && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-white"
                />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}