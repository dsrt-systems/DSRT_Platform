'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Users, Crown, ShieldCheck, UserPlus, Heart, Check,
  MagnifyingGlass, X, ArrowRight, Compass,
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'

const ROLE_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  owner:     { label: 'Owner', color: 'yellow', icon: Crown },
  admin:     { label: 'Admin', color: 'purple', icon: ShieldCheck },
  moderator: { label: 'Moderator', color: 'blue', icon: ShieldCheck },
  member:    { label: 'Member', color: 'gray', icon: Users },
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  blue:   { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  gray:   { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  pink:   { bg: 'bg-pink-500/10', text: 'text-pink-500' },
}

export function MyCommunitiesPage({ currentUser, initialTab = 'all' }: any) {
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'moderated' | 'member' | 'following'>(initialTab)
  const [data, setData] = useState<{
    all: any[]; owned: any[]; moderated: any[]; member: any[]; following: any[];
  }>({ all: [], owned: [], moderated: [], member: [], following: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/my-communities')
      const d = await res.json()
      setData({
        all: d.all || [],
        owned: d.owned || [],
        moderated: d.moderated || [],
        member: d.member || [],
        following: d.following || [],
      })
      setLoading(false)
    }
    load()
  }, [])

  const tabs = [
    { id: 'all', label: 'All Joined', count: data.all.length },
    { id: 'owned', label: 'Owned', count: data.owned.length, icon: Crown },
    { id: 'moderated', label: 'Moderating', count: data.moderated.length, icon: ShieldCheck },
    { id: 'member', label: 'Member', count: data.member.length, icon: Users },
    { id: 'following', label: 'Following', count: data.following.length, icon: Heart },
  ]

  const current = data[activeTab] || []
  const filtered = search
    ? current.filter((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : current

  const isFollowingTab = activeTab === 'following'

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" weight="fill" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isFollowingTab ? 'Following' : 'My Communities'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isFollowingTab
                ? `You follow ${data.following.length} communit${data.following.length === 1 ? 'y' : 'ies'}`
                : `You&apos;re part of ${data.all.length} communit${data.all.length === 1 ? 'y' : 'ies'}`}
            </p>
          </div>
          <Link href="/community">
            <Button size="sm">
              <Compass className="w-4 h-4 mr-1" weight="bold" />
              Discover More
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card border rounded-2xl px-4 py-2.5 flex items-center gap-2">
        <MagnifyingGlass className="w-4 h-4 text-muted-foreground flex-shrink-0" weight="bold" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your communities..."
          className="flex-1 bg-transparent border-0 focus:outline-none text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')}>
            <X className="w-4 h-4 text-muted-foreground" weight="bold" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto scrollbar-hide">
        {tabs.map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {Icon && <Icon className="w-4 h-4" weight={isActive ? 'fill' : 'regular'} />}
              {t.label}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center',
                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-muted/30 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center">
          <Users className="w-14 h-14 mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
          <h3 className="font-bold">
            {search ? 'No matches found' : isFollowingTab ? 'Not following any communities yet' : 'No communities in this category'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? 'Try a different search term' : 'Discover communities to join'}
          </p>
          <Link href="/community">
            <Button variant="outline" size="sm" className="mt-4">
              <Compass className="w-4 h-4 mr-1" weight="bold" /> Discover Communities
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c: any, i: number) => (
            <MyCommunityCard key={c.id} community={c} index={i} isFollowing={isFollowingTab} />
          ))}
        </div>
      )}
    </div>
  )
}

function MyCommunityCard({ community, index, isFollowing }: any) {
  const roleBadge = community.role ? ROLE_BADGES[community.role] : null
  const badgeColors = roleBadge ? COLOR_MAP[roleBadge.color] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-card border rounded-2xl overflow-hidden hover:border-primary/40 transition-all group"
    >
      <Link href={`/community/${community.slug}`}>
        <div
          className="h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
          style={community.cover_url ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        />
      </Link>

      <div className="p-4 -mt-8 relative">
        <Link href={`/community/${community.slug}`}>
          <div className="w-14 h-14 rounded-xl bg-white border-4 border-background shadow-md flex items-center justify-center mb-2">
            <Users className="w-6 h-6 text-blue-500" weight="fill" />
          </div>
        </Link>

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link href={`/community/${community.slug}`} className="text-sm font-bold hover:underline truncate block">
              {community.name}
            </Link>
            {community.is_verified && (
              <span className="text-[10px] text-blue-500 font-bold">✓ Verified</span>
            )}
          </div>
          {roleBadge && badgeColors && (
            <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5 flex-shrink-0', badgeColors.bg, badgeColors.text)}>
              <roleBadge.icon className="w-2.5 h-2.5" weight="fill" />
              {roleBadge.label}
            </span>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{community.description}</p>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
          <div>
            <p className="text-xs font-bold tabular-nums">{community.member_count?.toLocaleString() || 0}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Members</p>
          </div>
          <div>
            <p className="text-xs font-bold tabular-nums">{community.post_count?.toLocaleString() || 0}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Posts</p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          {isFollowing
            ? `Following since ${formatDistanceToNow(new Date(community.followed_at || Date.now()), { addSuffix: false })} ago`
            : `Joined ${formatDistanceToNow(new Date(community.joined_at || Date.now()), { addSuffix: false })} ago`}
        </p>
      </div>
    </motion.div>
  )
}
