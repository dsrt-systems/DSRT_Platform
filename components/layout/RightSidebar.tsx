'use client'

import Link from 'next/link'
import {
  Bell,
  TrendingUp,
  Sparkles,
  Users,
  ChevronDown,
  Info,
  Hash,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface RightSidebarProps {
  user: any
}

export function RightSidebar({ user }: RightSidebarProps) {
  const [pulseItems, setPulseItems] = useState<any[]>([])
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [showAllNews, setShowAllNews] = useState(false)
  const [suggestedBuilders, setSuggestedBuilders] = useState<any[]>([])
  const [trendingBuilds, setTrendingBuilds] = useState<any[]>([])
  const [trendingTags, setTrendingTags] = useState<any[]>([])
  const [bellFlash, setBellFlash] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      const { data: pulse } = await supabase
        .from('editorial_posts')
        .select(
          'id, headline, published_at, view_count, editorial_categories(name, icon, color)'
        )
        .order('published_at', { ascending: false })
        .limit(showAllNews ? 15 : 5)

      setPulseItems(pulse || [])

      const { count: notifs } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setUnreadNotifs(notifs || 0)

      // Trending builds
      try {
        const trendRes = await fetch('/api/trending')
        const trendData = await trendRes.json()
        const combined = [
          ...(trendData.ventures || []).map((v: any) => ({
            ...v,
            type: 'venture',
            name: v.name,
            href: `/ventures/${v.slug}`,
          })),
          ...(trendData.projects || []).map((p: any) => ({
            ...p,
            type: 'project',
            name: p.title,
            href: `/projects/${p.slug}`,
          })),
        ]
        setTrendingBuilds(combined.slice(0, 4))
      } catch {}

      // Suggested builders
      try {
        const res = await fetch('/api/matching/suggest?type=builders')
        const data = await res.json()
        setSuggestedBuilders((data.items || []).slice(0, 3))
      } catch {}

      // Trending tags
      try {
        const tagsRes = await fetch('/api/trending/tags')
        const tagsData = await tagsRes.json()
        setTrendingTags(tagsData.tags || [])
      } catch {}
    }

    fetchData()

    // Notifications realtime with bell flash + sound
    const notifChannel = supabase
      .channel('notifs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setUnreadNotifs((n) => n + 1)
          setBellFlash(true)
          setTimeout(() => setBellFlash(false), 2500)

          if (typeof window !== 'undefined' && 'Audio' in window) {
            try {
              const audio = new Audio(
                'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
              )
              audio.volume = 0.3
              audio.play().catch(() => {})
            } catch {}
          }
        }
      )
      .subscribe()

    const editorialChannel = supabase
      .channel('editorial')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'editorial_posts',
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    const startupsChannel = supabase
      .channel('startups-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'startups',
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      notifChannel.unsubscribe()
      editorialChannel.unsubscribe()
      startupsChannel.unsubscribe()
    }
  }, [user.id, showAllNews])

  return (
    <aside className="hidden lg:flex flex-col fixed right-0 top-14 bottom-0 w-80 overflow-y-auto">
      <div className="p-3 space-y-3">
        {/* ACTIVITY */}
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-2">
          <p className="px-3 pt-2 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
            ACTIVITY
          </p>
          <Link
            href="/notifications"
            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors ${
              bellFlash ? 'bg-primary/10' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell
                className={
                  bellFlash
                    ? 'w-4 h-4 text-primary animate-bounce'
                    : unreadNotifs > 0
                    ? 'w-4 h-4 text-primary animate-pulse'
                    : 'w-4 h-4 text-muted-foreground'
                }
              />
              <span>Notifications</span>
            </div>
            {unreadNotifs > 0 && (
              <span
                className={`text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold ${
                  bellFlash ? 'animate-pulse' : ''
                }`}
              >
                {unreadNotifs}
              </span>
            )}
          </Link>
        </div>

        {/* DSRT NEWS */}
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <h3 className="font-semibold text-sm">DSRT News</h3>
            <Info className="w-3 h-3 text-muted-foreground" />
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-3">
            {pulseItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Loading headlines...
              </p>
            ) : (
              pulseItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/pulse/${item.id}`}
                  className="block group"
                >
                  <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-foreground text-foreground/90">
                    {item.headline}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(item.published_at), {
                      addSuffix: true,
                    })}
                    {' · '}
                    {item.view_count ||
                      Math.floor(Math.random() * 5000) + 100}{' '}
                    readers
                  </p>
                </Link>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAllNews(!showAllNews)}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            {showAllNews ? 'Show less' : 'Show all news'}
            <ChevronDown
              className={
                showAllNews
                  ? 'w-4 h-4 rotate-180 transition-transform'
                  : 'w-4 h-4 transition-transform'
              }
            />
          </button>
        </div>

        {/* TRENDING BUILDS */}
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Trending Builds</h3>
          </div>
          {trendingBuilds.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No builds yet. Be the first.
            </p>
          ) : (
            <div className="space-y-2.5">
              {trendingBuilds.map((b: any) => (
                <Link
                  key={`${b.type}-${b.id}`}
                  href={b.href}
                  className="block group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">
                      {b.type === 'venture' ? '🚀' : '⚡'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:underline">
                        {b.name}
                      </p>
                      {b.tagline && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {b.tagline}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* TRENDING TAGS */}
        {trendingTags.length > 0 && (
          <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Trending Tags</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingTags.slice(0, 10).map((t: any) => (
                <Link
                  key={t.tag}
                  href={`/explore?tag=${t.tag}`}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                >
                  #{t.tag}
                  <span className="text-muted-foreground ml-1">
                    {t.post_count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SUGGESTED BUILDERS */}
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Suggested Builders</h3>
          </div>
          {suggestedBuilders.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Complete your profile for suggestions.
            </p>
          ) : (
            <div className="space-y-3">
              {suggestedBuilders.map((s: any) => (
                <Link
                  key={s.user.id}
                  href={`/profile/${s.user.username}`}
                  className="flex items-start gap-2 group"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={s.user.avatar_url} />
                    <AvatarFallback className="text-[10px]">
                      {s.user.full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:underline">
                      {s.user.full_name}
                    </p>
                    {s.user.tagline && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {s.user.tagline}
                      </p>
                    )}
                    {s.reasons && s.reasons.length > 0 && (
                      <p className="text-[10px] text-primary mt-0.5">
                        {s.reasons[0]}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
              <Link
                href="/explore?tab=builders"
                className="block text-xs text-primary hover:underline pt-1"
              >
                See more →
              </Link>
            </div>
          )}
        </div>

        {/* TAKE A BREAK */}
        <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 backdrop-blur-sm p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="font-semibold text-sm">Take a break</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Quick games between builds
          </p>
          <div className="space-y-1.5">
            <Link
              href="/games/pingpong"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-background/40 transition-colors"
            >
              <span className="text-base">🏓</span>
              <span className="text-xs font-medium">Emoji PingPong</span>
            </Link>
            <Link
              href="/games/blockcube"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-background/40 transition-colors"
            >
              <span className="text-base">🎲</span>
              <span className="text-xs font-medium">Block Cube</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 pb-4 px-2 space-y-2">
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
            <a href="#" className="hover:text-foreground">
              About
            </a>
            <span>·</span>
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <span>·</span>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
          </div>
          <p className="text-[10px] text-muted-foreground/60">DSRT © 2025</p>
        </div>
      </div>
    </aside>
  )
}