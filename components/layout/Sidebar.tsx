'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dsrtNavigation } from '@/components/nav/navConfig'
import { useActiveNav } from '@/hooks/useActiveNav'
import { DsrtAvatar } from '@/components/dsrt'

interface SidebarProps {
  user: any
  badges: any
  isCollapsed: boolean
  isMobileOpen: boolean
  onCloseMobile: () => void
  onLogout: () => void
}

export function Sidebar({ user, badges, isCollapsed, isMobileOpen, onCloseMobile }: SidebarProps) {
  const { activePrimary } = useActiveNav()

  const mainLinks = dsrtNavigation.filter((n) => n.group === 'main')
  const communityLinks = dsrtNavigation.filter((n) => n.group === 'community')
  const exploreLinks = dsrtNavigation.filter((n) => n.group === 'explore')

  const renderNavGroup = (title: string, links: typeof dsrtNavigation) => (
    <div className="mb-4">
      {!isCollapsed && (
        <p className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-white/30 px-4 mb-1.5">
          {title}
        </p>
      )}
      <nav className={cn("space-y-0.5", isCollapsed ? "px-2" : "px-2.5")}>
        {links.map((item) => {
          const isActive = activePrimary?.id === item.id
          const Icon = item.icon
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'group flex items-center rounded-lg transition-all select-none',
                isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-between px-3 py-1.5',
                isActive
                  ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    'w-[15px] h-[15px] flex-shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80',
                    item.id === 'coco' ? 'fallback-coco flex items-center justify-center font-bold text-xs' : ''
                  )}
                >
                  {item.id === 'coco' && !item.icon ? 'C' : ''}
                </Icon>
                {!isCollapsed && (
                  <span className="text-[13px] font-medium tracking-tight truncate">{item.label}</span>
                )}
              </div>
              {!isCollapsed && badgeCount > 0 && (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white leading-none">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
              {isCollapsed && badgeCount > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#93c5fd] shadow-[0_0_8px_rgba(147,197,253,0.8)]" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#05070D] border-r border-white/[0.06] overflow-y-auto scrollbar-hide py-4">
      <div className={cn("mb-5 transition-all", isCollapsed ? "px-2" : "px-3")}>
        <Link
          href={`/profile/${user?.username}`}
          onClick={onCloseMobile}
          className={cn(
            "flex items-center gap-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] transition-colors",
            isCollapsed ? "justify-center p-1.5" : "p-2.5"
          )}
          title={isCollapsed ? user?.full_name : undefined}
        >
          <DsrtAvatar
            src={user?.avatar_url}
            name={user?.full_name || user?.username}
            size={isCollapsed ? "xs" : "sm"}
            className="shrink-0"
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-bold text-white truncate leading-tight tracking-tight">
                {user?.full_name || 'Builder'}
              </p>
              <p className="text-[10px] text-[#93c5fd] font-mono truncate mt-0.5">
                {user?.tagline || 'Builder'}
              </p>
            </div>
          )}
        </Link>
      </div>

      {renderNavGroup('Main', mainLinks)}
      {renderNavGroup('Community', communityLinks)}
      {renderNavGroup('Explore', exploreLinks)}

      <div className="mt-auto pt-2">
        <div className={cn("border-t border-white/[0.06] pt-2", isCollapsed ? "px-2" : "px-2.5")}>
          <Link
            href={`/profile/${user?.username}`}
            onClick={onCloseMobile}
            className={cn(
              'group flex items-center gap-2.5 rounded-lg transition-all',
              isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 py-1.5',
              'text-white/50 hover:bg-white/[0.04] hover:text-white'
            )}
            title={isCollapsed ? 'My Profile' : undefined}
          >
            <User className="w-[15px] h-[15px] shrink-0" strokeWidth={2} />
            {!isCollapsed && <span className="text-[13px] font-medium tracking-tight">My Profile</span>}
          </Link>

          {!isCollapsed && (
            <div className="px-3 py-3 mt-1">
              <p className="text-[9px] text-white/20 font-mono italic">
                dedicated to my beautiful wife hajra
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          "hidden lg:block sticky top-[64px] z-30 transition-all duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-[68px]" : "w-[220px]",
          "h-[calc(100vh-64px)] bg-[#05070D]"
        )}
      >
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative w-[260px] max-w-[80vw] h-full bg-[#05070D] shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}