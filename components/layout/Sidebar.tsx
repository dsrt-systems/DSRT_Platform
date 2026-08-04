'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home,
  FolderKanban,
  Rocket,
  Users,
  Compass,
  Trophy,
  CalendarDays,
  Search,
  Sparkles,
  BookOpen,
  User,
  Settings,
  UserPlus,
  Zap,
  Rss,
  MessageSquare,
  Building2,
  Heart,
  Bookmark,
  Mail,
  ClipboardList,
  UsersRound,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  user: any
}

// MAIN NAVIGATION
const mainNav = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Feed', href: '/feed', icon: Rss },
  { name: 'Messages', href: '/messages', icon: MessageSquare, badge: 'messages' },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Ventures', href: '/ventures', icon: Rocket },
  { name: 'Looking For', href: '/looking-for', icon: Search },
]

// COMMUNITIES SECTION
const communityBaseNav = [
  { name: 'Discover', href: '/community', icon: Compass },
]

// Rendered dynamically: My Organization

const communityMoreNav = [
  { name: 'Following', href: '/community?tab=following', icon: Heart, exactMatch: false },
  { name: 'Saved', href: '/saved', icon: Bookmark },
  { name: 'Invitations', href: '/invitations', icon: Mail, badge: 'invitations' },
  { name: 'Applications', href: '/applications', icon: ClipboardList, badge: 'applications' },
  { name: 'My Communities', href: '/community?tab=mine', icon: UsersRound, exactMatch: false },
]

// EXPLORE SECTION
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

  // Dynamic org detection
  const [myOrg, setMyOrg] = useState<{ slug: string; name: string; short_name?: string } | null>(null)
  const [badges, setBadges] = useState({
    messages: 0,
    invitations: 0,
    applications: 0,
  })

  // Detect user's primary organization
  useEffect(() => {
    if (!user?.id) return

    const loadOrg = async () => {
      // First: check if user is a member of any organization
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organizations:organization_id(slug, name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(1)

      if (memberships && memberships.length > 0) {
        const org = (memberships[0] as any).organizations
        if (org) {
          setMyOrg({
            slug: org.slug,
            name: org.name,
            short_name: extractShortName(org.name),
          })
          return
        }
      }

      // Fallback: check user's institution and match to an org
      if (user.institution_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('slug, name')
          .eq('institution_id', user.institution_id)
          .maybeSingle()

        if (org) {
          setMyOrg({
            slug: org.slug,
            name: org.name,
            short_name: extractShortName(org.name),
          })
        }
      }
    }

    loadOrg()
  }, [user?.id, user?.institution_id, supabase])

  // Load badge counts (unread messages, pending invitations, etc.)
  useEffect(() => {
    if (!user?.id) return

    const loadBadges = async () => {
      const [msgRes, inviteRes, appRes] = await Promise.all([
        // Unread messages: count conversations where last message > my last_read_at
        supabase
          .from('conversation_participants')
          .select('conversation_id, last_read_at, conversations:conversation_id(last_message_at)')
          .eq('user_id', user.id),
        // Pending organization invitations
        supabase
          .from('organization_invitations')
          .select('id', { count: 'exact', head: true })
          .eq('invited_user_id', user.id)
          .eq('status', 'pending'),
        // Pending applications (as applicant, still under review)
        supabase
          .from('looking_for_applications')
          .select('id', { count: 'exact', head: true })
          .eq('applicant_id', user.id)
          .in('status', ['pending', 'reviewing', 'shortlisted']),
      ])

      // Count messages with newer last_message than my last_read
      let unreadMessages = 0
      ;(msgRes.data || []).forEach((cp: any) => {
        const lastMsg = cp.conversations?.last_message_at
        const lastRead = cp.last_read_at
        if (lastMsg && (!lastRead || new Date(lastMsg) > new Date(lastRead))) {
          unreadMessages++
        }
      })

      setBadges({
        messages: unreadMessages,
        invitations: inviteRes.count || 0,
        applications: appRes.count || 0,
      })
    }

    loadBadges()

    // Realtime updates for badges
    const channel = supabase
      .channel('sidebar-badges')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => loadBadges())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'organization_invitations',
        filter: `invited_user_id=eq.${user.id}`,
      }, () => loadBadges())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'looking_for_applications',
        filter: `applicant_id=eq.${user.id}`,
      }, () => loadBadges())
      .subscribe()

    // Refresh every 60 seconds
    const interval = setInterval(loadBadges, 60000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [user?.id, supabase])

  const isActive = (href: string, exactMatch = true) => {
    if (href === '/') return pathname === '/'
    if (href === '/profile/me') return pathname === `/profile/${user.username}`

    // For hrefs with query params (?tab=...), just check pathname portion
    if (href.includes('?')) {
      const [basePath] = href.split('?')
      return pathname === basePath
    }

    if (exactMatch === false) return pathname === href || pathname.startsWith(href + '/')
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isOrgActive = () => {
    if (!myOrg) return false
    return pathname.startsWith(`/organizations/${myOrg.slug}`)
  }

  const renderNavItem = (item: any, section: 'main' | 'community' | 'explore' | 'personal') => {
    const Icon = item.icon
    const href = item.href === '/profile/me' ? `/profile/${user.username}` : item.href
    const active = isActive(item.href, item.exactMatch)
    const badgeValue = item.badge ? badges[item.badge as keyof typeof badges] : 0
    const showBadge = badgeValue > 0

    return (
      <Link
        key={item.name}
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
          active
            ? section === 'personal'
              ? 'bg-muted text-foreground'
              : 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate">{item.name}</span>
        {showBadge && (
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none flex items-center justify-center',
            'bg-red-500 text-white'
          )}>
            {badgeValue > 99 ? '99+' : badgeValue}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-56 border-r bg-background">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-hide">

        {/* MAIN */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 px-3 mb-2">
            Main
          </p>
          <nav className="space-y-0.5">
            {mainNav.map((item) => renderNavItem(item, 'main'))}
          </nav>
        </div>

        {/* COMMUNITIES */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 px-3 mb-2">
            Communities
          </p>
          <nav className="space-y-0.5">
            {/* Discover */}
            {communityBaseNav.map((item) => renderNavItem(item, 'community'))}

            {/* My Organization (dynamic) */}
            {myOrg && (
              <Link
                href={`/organizations/${myOrg.slug}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isOrgActive()
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">My Organization</span>
                {myOrg.short_name && (
                  <span className={cn(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded leading-none',
                    isOrgActive()
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted/60 text-muted-foreground'
                  )}>
                    {myOrg.short_name}
                  </span>
                )}
              </Link>
            )}

            {/* Other community links */}
            {communityMoreNav.map((item) => renderNavItem(item, 'community'))}
          </nav>
        </div>

        {/* EXPLORE */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 px-3 mb-2">
            Explore
          </p>
          <nav className="space-y-0.5">
            {exploreNav.map((item) => renderNavItem(item, 'explore'))}
          </nav>
        </div>

        {/* PERSONAL */}
        <div className="pt-3 border-t space-y-0.5">
          {personalNav.map((item) => renderNavItem(item, 'personal'))}
        </div>

        {/* UPGRADE CARD */}
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

        {/* MENTOR STATUS */}
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

      {/* DEDICATION FOOTER */}
      <div className="p-3 border-t">
        <p className="text-[10px] text-muted-foreground/40 font-light tracking-wide italic text-center">
          dedicated to my beautiful wife hajra
        </p>
      </div>
    </aside>
  )
}

// Extract short name from org name (e.g., "Indian Institute of Technology Delhi" → "IIT Delhi")
function extractShortName(fullName: string): string {
  if (!fullName) return ''
  // Common patterns
  const patterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [/Indian Institute of Technology\s+(\w+)/i, (m) => `IIT ${m[1]}`],
    [/Indian Institute of Management\s+(\w+)/i, (m) => `IIM ${m[1]}`],
    [/National Institute of Technology\s+(\w+)/i, (m) => `NIT ${m[1]}`],
    [/Birla Institute of Technology\s+(\w+)/i, (m) => `BITS ${m[1]}`],
  ]
  for (const [regex, transform] of patterns) {
    const match = fullName.match(regex)
    if (match) return transform(match)
  }
  // Default: initials of first 3 words
  const words = fullName.split(/\s+/).filter(w => w.length > 0 && !['of', 'and', 'the'].includes(w.toLowerCase()))
  if (words.length >= 2) {
    return words.slice(0, 3).map(w => w[0]).join('').toUpperCase()
  }
  return fullName.slice(0, 4)
}