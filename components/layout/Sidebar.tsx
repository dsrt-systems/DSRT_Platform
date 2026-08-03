'use client'

import Link from 'next/link'
import { Search, CalendarDays } from 'lucide-react'
import { usePathname } from 'next/navigation'
import {
  Home,
  FolderKanban,
  Rocket,
  Users,
  Compass,
  Trophy,
  Sparkles,
  BookOpen,
  User,
  Settings,
  UserPlus,
  Zap,
  Rss,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SidebarProps {
  user: any
}

const mainNav = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Feed', href: '/feed', icon: Rss },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Ventures', href: '/ventures', icon: Rocket },
  { name: 'Looking For', href: '/looking-for', icon: Search },
  { name: 'Community', href: '/community', icon: Users },
  { name: 'Explore', href: '/explore', icon: Compass },
  { name: 'Events', href: '/events', icon: CalendarDays },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'AI Mentor', href: '/mentor', icon: Sparkles },
  { name: 'Resources', href: '/resources', icon: BookOpen },
]

const personalNav = [
  { name: 'My Profile', href: '/profile/me', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Invite Friends', href: '/invite', icon: UserPlus },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/profile/me') return pathname === `/profile/${user.username}`
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-56 border-r bg-background">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <nav className="space-y-0.5">
          {mainNav.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href === '/profile/me' ? `/profile/${user.username}` : item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="pt-4 border-t space-y-0.5">
          {personalNav.map((item) => {
            const Icon = item.icon
            const href = item.href === '/profile/me' ? `/profile/${user.username}` : item.href
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Upgrade to Pro</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Unlock advanced tools and analytics.
          </p>
          <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Upgrade Now
          </Button>
        </div>

        <div className="bg-muted/30 border rounded-xl p-3 flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              AI
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">DSRT Mentor</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className="text-[10px] text-muted-foreground">Online</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-t">
        <p className="text-[10px] text-muted-foreground/40 font-light tracking-wide italic text-center">
          dedicated to my beautiful wife hajra
        </p>
      </div>
    </aside>
  )
}