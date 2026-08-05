'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home, FolderKanban, Rocket, Users, Compass, Trophy,
  CalendarDays, Search, Sparkles, BookOpen, User, Settings,
  UserPlus, Zap, MessageSquare, Building2, Heart, Bookmark,
  Mail, ClipboardList, UsersRound, Globe, Network,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  user: any
}

const mainNav = [
  { name: 'Home', href: '/feed', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Ventures', href: '/ventures', icon: Rocket },
  { name: 'Looking For', href: '/looking-for', icon: Search },
]

const communityNav = [
  { name: 'Discover', href: '/community', icon: Compass },
  { name: 'My Network', href: '/my-network', icon: Network },
  { name: 'My Communities', href: '/my-communities', icon: UsersRound },
]

const exploreNav = [
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
  const supabase = createClient()

  const [myOrg, setMyOrg] = useState<{ slug: string; name: string; short_name?: string } | null>(null)
  const [badges, setBadges] = useState({ messages: 0, invitations: 0 })

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
      const [msgRes, invRes] = await Promise.all([
        supabase.from('conversation_participants').select('conversation_id, last_read_at, conversations:conversation_id(last_message_at)').eq('user_id', user.id),
        supabase.from('organization_invitations').select('id', { count: 'exact', head: true }).eq('invited_user_id', user.id).eq('status', 'pending'),
      ])
      let unread = 0
      ;(msgRes.data || []).forEach((cp: any) => {
        const lm = cp.conversations?.last_message_at
        if (lm && (!cp.last_read_at || new Date(lm) > new Date(cp.last_read_at))) unread++
      })
      setBadges({ messages: unread, invitations: invRes.count || 0 })
    }
    loadOrg()
    loadBadges()
    const interval = setInterval(loadBadges, 60000)
    return () => clearInterval(interval)
  }, [user?.id, supabase])

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/' || pathname === '/feed'
    if (href === '/profile/me') return pathname === `/profile/${user?.username}`
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderItem = (item: any, section: string) => {
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
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
    <aside className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-56 border-r bg-background">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-hide">

        {/* USER PROFILE CARD */}
        <Link
          href={`/profile/${user?.username}`}
          className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {user?.full_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.full_name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {myOrg?.short_name || user?.tagline || 'View Profile'}
            </p>
          </div>
        </Link>

        {/* MAIN */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 px-3 mb-2">Main</p>
          <nav className="space-y-0.5">
            {mainNav.map(item => renderItem(item, 'main'))}
          </nav>
        </div>

        {/* COMMUNITY HUB */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 px-3 mb-2">Community Hub</p>
          <nav className="space-y-0.5">
            {communityNav.map(item => renderItem(item, 'community'))}
            {myOrg && (
              <Link
                href={`/organizations/${myOrg.slug}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(`/organizations/${myOrg.slug}`)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">My Organization</span>
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded leading-none',
                  pathname.startsWith(`/organizations/${myOrg.slug}`)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted/60 text-muted-foreground'
                )}>
                  {myOrg.short_name}
                </span>
              </Link>
            )}
          </nav>
        </div>

        {/* EXPLORE */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 px-3 mb-2">Explore</p>
          <nav className="space-y-0.5">
            {exploreNav.map(item => renderItem(item, 'explore'))}
          </nav>
        </div>

        {/* PERSONAL */}
        <div className="pt-3 border-t space-y-0.5">
          {personalNav.map(item => renderItem(item, 'personal'))}
        </div>

        {/* UPGRADE */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-semibold">Upgrade to Pro</p>
          </div>
          <p className="text-xs text-muted-foreground">Unlock advanced tools and analytics.</p>
          <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Upgrade Now
          </Button>
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