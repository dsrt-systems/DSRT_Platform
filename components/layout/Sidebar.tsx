'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Home,
  Compass,
  Building2,
  Zap,
  FolderGit2,
  Rocket,
  User,
  Settings,
  CheckCircle2,
  Menu,
  X as CloseIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: any
}

const sections = [
  {
    label: 'HOME',
    items: [
      { name: 'Feed', href: '/feed', icon: Home },
      { name: 'Explore', href: '/explore', icon: Compass },
      { name: 'Communities', href: '/community', icon: Building2 },
      { name: 'Builder Pulse', href: '/pulse', icon: Zap },
    ],
  },
  {
    label: 'BUILD',
    items: [
      { name: 'Projects', href: '/projects', icon: FolderGit2 },
      { name: 'Ventures', href: '/ventures', icon: Rocket },
    ],
  },
  {
    label: 'PROFILE',
    items: [
      { name: 'My Profile', href: '/profile/me', icon: User },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const profileHref = `/profile/${user.username}`

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 md:hidden bg-primary text-primary-foreground p-3 rounded-full shadow-xl hover:scale-105 transition-transform"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <CloseIcon className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-14 bottom-0 w-72 border-r border-border/40 bg-background overflow-y-auto transition-transform duration-200 z-40 md:flex md:flex-col',
          isOpen
            ? 'translate-x-0 flex flex-col'
            : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-3 space-y-3">
          {/* PROFILE CARD */}
          <Link
            href={profileHref}
            onClick={handleLinkClick}
            className="block group"
          >
            <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden hover:border-border transition-all">
              {/* Cover */}
              <div className="relative h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
                {user.cover_url && (
                  <img
                    src={user.cover_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Body */}
              <div className="px-4 pb-4 -mt-8">
                <div className="w-14 h-14 rounded-full border-4 border-background bg-muted overflow-hidden flex items-center justify-center">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold">
                      {user.full_name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">
                      {user.full_name}
                    </p>
                    {user.is_verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    )}
                  </div>

                  {user.tagline && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {user.tagline}
                    </p>
                  )}
                </div>

                <div className="mt-2.5 space-y-1">
                  {user.brings && user.brings.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="text-foreground/70 capitalize">
                        {user.brings[0]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {user.products_shipped || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Ventures
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">0</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Projects
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">0</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Communities
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/40">
                  <p className="text-xs text-primary text-center font-medium group-hover:underline">
                    View Profile →
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* NAVIGATION SECTIONS */}
          {sections.map((section) => (
            <div
              key={section.label}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-2"
            >
              <p className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                {section.label}
              </p>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const href =
                    item.href === '/profile/me' ? profileHref : item.href
                  const isActive =
                    pathname === href ||
                    (item.href !== '/profile/me' &&
                      pathname.startsWith(item.href + '/'))

                  return (
                    <Link
                      key={item.name}
                      href={href}
                      onClick={handleLinkClick}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            
          ))}
                    {/* Investor mode (conditional) */}
          {user.is_investor && (
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-sm p-2">
              <Link
                href="/investor"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-primary/10"
              >
                <span className="text-base">💰</span>
                Investor Dashboard
              </Link>
            </div>
          )}
          {/* Dedication */}
          <div className="pt-2 pb-4">
            <p className="text-[10px] text-muted-foreground/30 font-light tracking-wide italic text-center">
              dedicated to my beautiful wife hajra
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}