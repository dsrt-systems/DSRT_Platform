'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home, FolderKanban, Rocket, Compass,
  CalendarDays, Search, BookOpen, User, Settings,
  Zap, Building2, UsersRound, Network, Inbox, Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  user: any
}

const mainNav = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Ventures', href: '/ventures', icon: Rocket },
  { name: 'Looking For', href: '/looking-for', icon: Search },
  { name: 'DSRT Mail', href: '/inbox', icon: Inbox, badge: 'inbox' },
  { name: 'COCO', href: '/coco', icon: Bot },
]

const communityNav = [
  { name: 'Discover', href: '/community', icon: Compass },
  { name: 'My Network', href: '/my-network', icon: Network },
  { name: 'My Communities', href: '/my-communities', icon: UsersRound },
]

const exploreNav = [
  { name: 'Events', href: '/events', icon: CalendarDays },
  { name: 'Resources', href: '/resources', icon: BookOpen },
]

const personalNav = [
  { name: 'My Profile', href: '/profile/me', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const [myOrg, setMyOrg] = useState<{ slug: string; name: string; short_name?: string } | null>(null)
  const [badges, setBadges] = useState({ messages: 0, invitations: 0, inbox: 0 })

  useEffect(() => {
    if (!user?.id) return

    const loadOrg = async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('organizations:organization_id(slug, name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
      if (data?.[0]) {
        const org = (data[0] as any).organizations
        if (org) setMyOrg({ slug: org.slug, name: org.name, short_name: extractShortName(org.name) })
      }
    }

    const loadBadges = async () => {
      const [msgRes, invRes, inboxRes] = await Promise.all([
        supabase
          .from('conversation_participants')
          .select('conversation_id, last_read_at, conversations:conversation_id(last_message_at)')
          .eq('user_id', user.id),
        supabase
          .from('organization_invitations')
          .select('id', { count: 'exact', head: true })
          .eq('invited_user_id', user.id)
          .eq('status', 'pending'),
        fetch('/api/inbox/count').then(r => r.json()).catch(() => ({ count: 0 })),
      ])

      let unread = 0
      ;(msgRes.data || []).forEach((cp: any) => {
        const lm = cp.conversations?.last_message_at
        if (lm && (!cp.last_read_at || new Date(lm) > new Date(cp.last_read_at))) unread++
      })

      setBadges({
        messages: unread,
        invitations: invRes.count || 0,
        inbox: inboxRes.count || 0,
      })
    }

    loadOrg()
    loadBadges()

    const interval = setInterval(loadBadges, 15000)
    return () => clearInterval(interval)
  }, [user?.id, supabase])

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/' || pathname === '/feed'
    if (href === '/profile/me') return pathname === `/profile/${user?.username}`
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderItem = (item: any) => {
    const Icon = item.icon
    const href = item.href === '/profile/me' ? `/profile/${user?.username}` : item.href
    const active = isActive(item.href)
    const badge = item.badge ? badges[item.badge as keyof typeof badges] : 0

    return (
      <Link
        key={item.name}
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
          active
            ? 'bg-white/[0.08] text-white'
            : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate">{item.name}</span>
        {badge > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-[76px] bottom-0 w-56 border-r border-white/[0.06] bg-[#0a0a0f]">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-hide">
        <Link
          href={`/profile/${user?.username}`}
          className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
        >
          <Avatar className="w-10 h-10 border border-white/[0.1]">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-xs bg-white/[0.08] text-white font-bold">
              {user?.full_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white truncate leading-tight">{user?.full_name}</p>
            <p className="text-[11px] text-white/50 truncate mt-0.5">
              {user?.tagline || myOrg?.short_name || 'Builder'}
            </p>
          </div>
        </Link>

        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 px-3 mb-2">Main</p>
          <nav className="space-y-0.5">
            {mainNav.map(item => renderItem(item))}
          </nav>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 px-3 mb-2">Community Hub</p>
          <nav className="space-y-0.5">
            {communityNav.map(item => renderItem(item))}
            {myOrg && (
              <Link
                href={`/organizations/${myOrg.slug}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(`/organizations/${myOrg.slug}`)
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                )}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">My Organization</span>
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded leading-none',
                  pathname.startsWith(`/organizations/${myOrg.slug}`)
                    ? 'bg-white/15 text-white'
                    : 'bg-white/[0.06] text-white/60'
                )}>
                  {myOrg.short_name}
                </span>
              </Link>
            )}
          </nav>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 px-3 mb-2">Explore</p>
          <nav className="space-y-0.5">
            {exploreNav.map(item => renderItem(item))}
          </nav>
        </div>

        <div className="pt-3 border-t border-white/[0.06] space-y-0.5">
          {personalNav.map(item => renderItem(item))}
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white/80" />
            </div>
            <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
          </div>
          <p className="text-xs text-white/50">Unlock advanced tools and analytics.</p>
          <Button size="sm" className="w-full bg-white text-black hover:bg-zinc-200 font-semibold">
            Upgrade Now
          </Button>
        </div>
      </div>

      <div className="p-3 border-t border-white/[0.06]">
        <p className="text-[10px] text-white/30 font-light tracking-wide italic text-center">
          dedicated to my beautiful wife hajra
        </p>
      </div>
    </aside>
  )
}

function extractShortName(fullName: string): string {
  if (!fullName) return ''
  const patterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [/Indian Institute of Technology\s+(\w+)/i, (m) => `IIT ${m[1]}`],
    [/Indian Institute of Management\s+(\w+)/i, (m) => `IIM ${m[1]}`],
    [/National Institute of Technology\s+(\w+)/i, (m) => `NIT ${m[1]}`],
    [/Birla Institute of Technology/i, () => 'BITS'],
  ]
  for (const [regex, transform] of patterns) {
    const match = fullName.match(regex)
    if (match) return transform(match)
  }
  const words = fullName.split(/\s+/).filter(w => !['of', 'and', 'the'].includes(w.toLowerCase()))
  return words.length >= 2 ? words.slice(0, 3).map(w => w[0]).join('').toUpperCase() : fullName.slice(0, 4)
}