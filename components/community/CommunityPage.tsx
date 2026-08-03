'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  GlobeHemisphereWest, Buildings, UsersThree, Article, Rocket, Code,
  MagnifyingGlass, CalendarBlank, Lightbulb, Megaphone, Trophy,
  Plus, X, TrendUp, Lightning, Sparkle, Users, MapPin, ArrowRight,
  SquaresFour, List, CaretRight, Check, DotsThree, Heart, ChatCircle,
  BookmarkSimple, ShareNetwork, FunnelSimple, ArrowsClockwise,
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import { CATEGORIES, SKILLS, POST_TYPES, CONTENT_TABS, COMMUNITY_TABS } from '@/lib/config/community'

const ICON_MAP: any = {
  GlobeHemisphereWest, Buildings, UsersThree, Article, Rocket, Code,
  MagnifyingGlass, CalendarBlank, Lightbulb, Megaphone, Trophy,
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
  green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/30' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  red: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/30' },
}

export function CommunityPage({ currentUser, myCommunities, goals }: any) {
  const supabase = createClient()
  const router = useRouter()

  // ============================================
  // State
  // ============================================
  const [communityTab, setCommunityTab] = useState('global')
  const [contentTab, setContentTab] = useState('all')
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'relevance' | 'recent' | 'popular'>('relevance')

  // Filters
  const [showFilters, setShowFilters] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [goalFilter, setGoalFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set(['all']))

  // Composer
  const [composerType, setComposerType] = useState<string>('post')

  // Sidebar
  const [recommendedBuilders, setRecommendedBuilders] = useState<any[]>([])
  const [trendingSkills, setTrendingSkills] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [stats, setStats] = useState({ members: 0, projects: 0, ventures: 0, looking_for: 0, growth: { members: 0, projects: 0, ventures: 0, looking_for: 0 } })

  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set())

  // ============================================
  // Load feed
  // ============================================
  const loadFeed = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    if (reset) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({
        tab: contentTab,
        sort: sortBy,
        limit: '24',
        offset: currentOffset.toString(),
      })
      if (categoryFilter) params.set('category', categoryFilter)
      if (skillFilter) params.set('skill', skillFilter)
      if (goalFilter) params.set('goal', goalFilter)
      if (locationFilter) params.set('location', locationFilter)

      const res = await fetch(`/api/community/feed?${params}`)
      const data = await res.json()

      if (reset) {
        setPosts(data.posts || [])
        setOffset(24)
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])])
        setOffset(currentOffset + 24)
      }
      setHasMore(data.has_more)
    } catch (err) {
      console.error('Feed error:', err)
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [contentTab, sortBy, categoryFilter, skillFilter, goalFilter, locationFilter, offset])

  // ============================================
  // Load sidebar data
  // ============================================
  const loadSidebar = useCallback(async () => {
    try {
      const [buildersRes, skillsRes, eventsRes, statsRes] = await Promise.all([
        fetch('/api/community/recommended'),
        fetch('/api/community/trending-skills'),
        fetch('/api/community/events'),
        fetch('/api/community/stats'),
      ])

      const buildersData = await buildersRes.json()
      const skillsData = await skillsRes.json()
      const eventsData = await eventsRes.json()
      const statsData = await statsRes.json()

      setRecommendedBuilders(buildersData.builders || [])
      setTrendingSkills(skillsData.skills || [])
      setUpcomingEvents(eventsData.events || [])
      setStats(statsData)
    } catch (err) {
      console.error('Sidebar load error:', err)
    }
  }, [])

  // ============================================
  // Effects
  // ============================================
  useEffect(() => {
    loadFeed(true)
    loadSidebar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadFeed(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentTab, sortBy, categoryFilter, skillFilter, goalFilter, locationFilter])

  // Realtime new posts
  useEffect(() => {
    const channel = supabase
      .channel('community-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: 'visibility=eq.global',
      }, async (payload) => {
        const newPost = payload.new as any
        if (newPost.user_id === currentUser.id) return // skip own (already added)

        const { data: user } = await supabase
          .from('users')
          .select('id, full_name, username, avatar_url, tagline, brings, location')
          .eq('id', newPost.user_id)
          .single()

        setPosts(prev => [{
          ...newPost,
          users: user,
          is_liked: false,
          is_bookmarked: false,
          relevance_score: 50,
          match_reasons: ['Just posted'],
        }, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id])

  // ============================================
  // Handlers
  // ============================================
  const trackActivity = async (signal_type: string, entity_type?: string, entity_id?: string) => {
    fetch('/api/community/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signal_type, entity_type, entity_id }),
    }).catch(() => {})
  }

  const handleConnect = async (userId: string) => {
    if (connectedIds.has(userId)) return
    setConnectedIds(prev => new Set(prev).add(userId))

    const res = await fetch('/api/community/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: userId }),
    })

    if (res.ok) {
      toast.success('Connection request sent')
      setTimeout(() => {
        setRecommendedBuilders(prev => prev.filter(b => b.id !== userId))
      }, 800)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to connect')
      setConnectedIds(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handleAddPost = (newPost: any) => {
    setPosts(prev => [newPost, ...prev])
  }

  const resetFilters = () => {
    setCategoryFilter('')
    setSkillFilter('')
    setGoalFilter('')
    setLocationFilter('')
    setTypeFilters(new Set(['all']))
  }

  const hasActiveFilters = categoryFilter || skillFilter || goalFilter || locationFilter

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 p-4 md:p-6">
        {/* ==================== MAIN ==================== */}
        <div className="space-y-4 min-w-0">
          {/* HEADER */}
          <div className="bg-card border rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-56 h-56 opacity-30 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl" />
            </div>
            <div className="absolute top-4 right-4 flex -space-x-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-background flex items-center justify-center text-white text-[10px] font-bold">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="relative">
              <h1 className="text-2xl font-bold tracking-tight">Community</h1>
              <p className="text-sm text-muted-foreground mt-1">Three communities. Infinite opportunities.</p>
              <div className="flex flex-wrap gap-2 mt-5">
                {COMMUNITY_TABS.map(tab => {
                  const Icon = ICON_MAP[tab.icon]
                  const isOrg = tab.id === 'organization'
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCommunityTab(tab.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                        communityTab === tab.id
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/60 hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" weight="fill" />}
                      {tab.label}
                      {isOrg && currentUser?.institution?.short_name && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded font-bold">
                          {currentUser.institution.short_name}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* CONTENT TABS + SORT */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-1 overflow-x-auto pb-1 flex-1 min-w-0">
              {CONTENT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setContentTab(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5',
                    contentTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-muted/40 border rounded-md px-2 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="recent">Sort by: Recent</option>
                <option value="popular">Sort by: Popular</option>
              </select>
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-1.5 transition-colors', viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted/50')}
                >
                  <SquaresFour className="w-4 h-4" weight={viewMode === 'grid' ? 'fill' : 'regular'} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-1.5 transition-colors', viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted/50')}
                >
                  <List className="w-4 h-4" weight={viewMode === 'list' ? 'fill' : 'regular'} />
                </button>
              </div>
            </div>
          </div>

          {/* CREATE NEW COMPOSER + FILTER */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3">
            <Composer
              currentUser={currentUser}
              composerType={composerType}
              setComposerType={setComposerType}
              onPost={handleAddPost}
            />
            <FilterPanel
              typeFilters={typeFilters}
              setTypeFilters={setTypeFilters}
              onReset={resetFilters}
              hasActiveFilters={!!hasActiveFilters}
            />
          </div>

          {/* HOW MATCHING WORKS */}
          <HowMatchingWorks />

          {/* FILTER BAR */}
          <FilterBar
            categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
            skillFilter={skillFilter} setSkillFilter={setSkillFilter}
            goalFilter={goalFilter} setGoalFilter={setGoalFilter}
            locationFilter={locationFilter} setLocationFilter={setLocationFilter}
            goals={goals}
          />

          {/* FEED */}
          <div>
            {loading ? (
              <div className={cn('gap-3', viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3')}>
                {[1,2,3,4,5,6].map(i => <FeedCardSkeleton key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <EmptyFeed hasFilters={!!hasActiveFilters} onReset={resetFilters} />
            ) : (
              <>
                <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3' : 'space-y-3')}>
                  {posts.map((post, idx) => (
                    <FeedCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      index={idx}
                      viewMode={viewMode}
                      onTrack={trackActivity}
                    />
                  ))}
                </div>
                {hasMore && (
                  <button
                    onClick={() => loadFeed(false)}
                    disabled={loadingMore}
                    className="w-full mt-4 py-3 border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <ArrowsClockwise className="w-4 h-4 animate-spin" weight="bold" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More
                        <ArrowRight className="w-4 h-4" weight="bold" />
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ==================== RIGHT SIDEBAR ==================== */}
        <aside className="hidden lg:block space-y-4">
          <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide pb-6">
            <CommunityOverview stats={stats} />
            <AIMatchSidebar
              builders={recommendedBuilders}
              onConnect={handleConnect}
              connectedIds={connectedIds}
            />
            <TrendingSkillsSidebar
              skills={trendingSkills}
              onSelect={setSkillFilter}
            />
            <UpcomingEventsSidebar events={upcomingEvents} />
          </div>
        </aside>
      </div>
    </div>
  )
}

// ============================================
// COMPOSER
// ============================================
function Composer({ currentUser, composerType, setComposerType, onPost }: any) {
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [skills, setSkills] = useState('')
  const [location, setLocation] = useState('')
  const [posting, setPosting] = useState(false)

  const handleTypeClick = (typeId: string) => {
    setComposerType(typeId)
    setExpanded(true)
  }

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error('Write something first')
      return
    }
    setPosting(true)

    const tagsArr = tags.split(/[\s,]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean).slice(0, 10)
    const skillsArr = skills.split(/[\s,]+/).map(s => s.trim()).filter(Boolean).slice(0, 10)

    const { data, error } = await supabase.from('posts').insert({
      user_id: currentUser.id,
      type: composerType === 'post' ? 'update' : composerType,
      post_category: composerType,
      title: title.trim() || null,
      content: content.trim(),
      tags: tagsArr,
      skills: skillsArr,
      location: location.trim() || null,
      visibility: 'global',
    }).select().single()

    setPosting(false)

    if (error) {
      toast.error('Failed to post: ' + error.message)
    } else {
      toast.success('Posted to community')
      onPost({
        ...data,
        users: {
          id: currentUser.id,
          full_name: currentUser.full_name,
          username: currentUser.username,
          avatar_url: currentUser.avatar_url,
          tagline: currentUser.tagline,
          brings: currentUser.brings,
          location: currentUser.location,
        },
        is_liked: false,
        is_bookmarked: false,
        relevance_score: 100,
        match_reasons: ['Your post'],
      })
      setContent(''); setTitle(''); setTags(''); setSkills(''); setLocation('')
      setExpanded(false)
    }
  }

  return (
    <div className="bg-card border rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-9 h-9">
          <AvatarImage src={currentUser?.avatar_url} />
          <AvatarFallback className="text-xs">{currentUser?.full_name?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold">Create New</p>
          <p className="text-xs text-muted-foreground">What are you building or looking for?</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pl-12 scrollbar-hide">
        {POST_TYPES.map(type => {
          const Icon = ICON_MAP[type.icon]
          const colors = COLOR_MAP[type.color]
          const isActive = expanded && composerType === type.id
          return (
            <button
              key={type.id}
              onClick={() => handleTypeClick(type.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border',
                isActive
                  ? `${colors.bg} ${colors.text} ${colors.border}`
                  : 'bg-muted/50 hover:bg-muted border-transparent'
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" weight={isActive ? 'fill' : 'duotone'} />}
              {type.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pl-12 space-y-2 overflow-hidden"
          >
            {(composerType === 'project' || composerType === 'venture' || composerType === 'event' || composerType === 'hackathon') && (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title..."
                className="text-sm font-semibold"
                maxLength={120}
              />
            )}
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                composerType === 'looking_for' ? "What are you looking for? (e.g., a co-founder, developer, mentor...)" :
                composerType === 'project' ? "Describe your project..." :
                composerType === 'venture' ? "Describe your venture..." :
                composerType === 'event' ? "Event details..." :
                "Share with the community..."
              }
              rows={3}
              autoFocus
              maxLength={2000}
              className="resize-none text-sm"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#tags, #topics" className="text-xs" />
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills (comma-separated)" className="text-xs" />
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="text-xs" />
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] text-muted-foreground">{content.length}/2000</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setExpanded(false)}>Cancel</Button>
                <Button size="sm" onClick={handlePost} disabled={posting || !content.trim()}>
                  {posting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// FILTER PANEL (right of composer)
// ============================================
function FilterPanel({ typeFilters, setTypeFilters, onReset, hasActiveFilters }: any) {
  const toggleType = (id: string) => {
    setTypeFilters((prev: Set<string>) => {
      const next = new Set(prev)
      if (id === 'all') return new Set(['all'])
      next.delete('all')
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size === 0) next.add('all')
      return next
    })
  }

  return (
    <div className="bg-card border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Filter</p>
        {hasActiveFilters && (
          <button onClick={onReset} className="text-xs text-blue-500 hover:underline">Reset</button>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Type</p>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={typeFilters.has('all')}
              onChange={() => toggleType('all')}
              className="rounded"
            />
            <span>All Types</span>
          </label>
          {POST_TYPES.slice(0, 5).map(type => (
            <label key={type.id} className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={typeFilters.has(type.id)}
                onChange={() => toggleType(type.id)}
                className="rounded"
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// HOW MATCHING WORKS
// ============================================
function HowMatchingWorks() {
  const steps = [
    { step: '1', title: 'Tell Us About You', desc: 'Share your skills, interests, and what you want to build or learn.', icon: Users, color: 'blue' },
    { step: '2', title: 'AI Analyzes', desc: 'Our algorithm analyzes compatibility, skills, and goals.', icon: Sparkle, color: 'purple' },
    { step: '3', title: 'Find Your Match', desc: 'Get matched with projects, ventures, and people.', icon: MagnifyingGlass, color: 'green' },
    { step: '4', title: 'Build Together', desc: 'Collaborate, create, and make an impact.', icon: Rocket, color: 'orange' },
  ]

  return (
    <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-2xl p-5">
      <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
        <Lightning className="w-4 h-4 text-yellow-500" weight="fill" />
        How Our Smart Matching Works
      </h3>
      <p className="text-[11px] text-muted-foreground mb-3">Our AI-powered algorithm connects you with the right people and opportunities.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((item, i) => {
          const Icon = item.icon
          const colors = COLOR_MAP[item.color]
          return (
            <div key={i} className="bg-card/60 backdrop-blur rounded-xl p-3 text-center relative">
              <div className={cn('w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-2', colors.bg)}>
                <Icon className={cn('w-4 h-4', colors.text)} weight="fill" />
              </div>
              <p className="text-[11px] font-bold">{item.title}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{item.desc}</p>
              {i < 3 && <CaretRight className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 hidden md:block" weight="bold" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// FILTER BAR
// ============================================
function FilterBar({ categoryFilter, setCategoryFilter, skillFilter, setSkillFilter, goalFilter, setGoalFilter, locationFilter, setLocationFilter, goals }: any) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <AutocompleteSelect label="All Categories" value={categoryFilter} onChange={setCategoryFilter} options={CATEGORIES as unknown as string[]} />
      <AutocompleteSelect label="All Skills" value={skillFilter} onChange={setSkillFilter} options={SKILLS as unknown as string[]} />
      <AutocompleteSelect label="All Goals" value={goalFilter} onChange={setGoalFilter} options={goals.map((g: any) => g.name)} />
      <LocationSelect value={locationFilter} onChange={setLocationFilter} />
    </div>
  )
}

// ============================================
// AUTOCOMPLETE SELECT
// ============================================
function AutocompleteSelect({ label, value, onChange, options }: any) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query
    ? options.filter((o: string) => o.toLowerCase().includes(query.toLowerCase())).slice(0, 20)
    : options.slice(0, 20)

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'h-8 text-xs bg-muted/40 border rounded-lg px-2.5 flex items-center gap-1.5 min-w-[130px] hover:bg-muted/60 transition-colors',
          value && 'border-primary text-primary'
        )}
      >
        <span className="truncate">{value || label}</span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="ml-auto"
          >
            <X className="w-3 h-3" weight="bold" />
          </span>
        ) : (
          <CaretRight className="w-3 h-3 rotate-90 ml-auto" weight="bold" />
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border rounded-lg shadow-lg z-50 max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full h-7 text-xs bg-muted/40 border rounded px-2 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            <button
              onClick={() => { onChange(''); setOpen(false); setQuery('') }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
            >
              {label}
            </button>
            {filtered.map((opt: string) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); setQuery('') }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center justify-between',
                  value === opt && 'bg-primary/10 text-primary'
                )}
              >
                {opt}
                {value === opt && <Check className="w-3 h-3" weight="bold" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// LOCATION SELECT (async)
// ============================================
function LocationSelect({ value, onChange }: any) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.locations || [])
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'h-8 text-xs bg-muted/40 border rounded-lg px-2.5 flex items-center gap-1.5 min-w-[130px] hover:bg-muted/60 transition-colors',
          value && 'border-primary text-primary'
        )}
      >
        <MapPin className="w-3 h-3" weight="duotone" />
        <span className="truncate">{value || 'Location'}</span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="ml-auto"
          >
            <X className="w-3 h-3" weight="bold" />
          </span>
        ) : (
          <CaretRight className="w-3 h-3 rotate-90 ml-auto" weight="bold" />
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border rounded-lg shadow-lg z-50 max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type city or country..."
              className="w-full h-7 text-xs bg-muted/40 border rounded px-2 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {query.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Start typing to search cities...</p>
            )}
            {results.map(loc => (
              <button
                key={loc.id}
                onClick={() => { onChange(loc.display || `${loc.city}, ${loc.country}`); setOpen(false); setQuery('') }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                {loc.display || `${loc.city}, ${loc.country}`}
              </button>
            ))}
            {query.length > 0 && results.length === 0 && (
              <button
                onClick={() => { onChange(query); setOpen(false) }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                Use "{query}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// FEED CARD
// ============================================
function FeedCard({ post, currentUser, index, viewMode, onTrack }: any) {
  const supabase = createClient()
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(post.is_liked)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)

  const typeConfig = POST_TYPES.find(t => t.id === post.post_category) || POST_TYPES[0]
  const colors = COLOR_MAP[typeConfig.color]
  const user = post.users
  const allTags = [...(post.skills || []), ...(post.tags || [])].slice(0, 5)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikeCount((prev: number) => newLiked ? prev + 1 : prev - 1)

    if (newLiked) {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUser.id })
      onTrack('like_post', 'post', post.id)
    } else {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id)
    }
  }

  const handleCardClick = () => {
    onTrack('view_post', 'post', post.id)
    router.push(`/pulse/${post.id}`)
  }

  const title = post.title || post.content?.split('\n')[0]?.slice(0, 80) || 'Untitled'
  const desc = post.title
    ? post.content?.slice(0, 140)
    : post.content?.split('\n').slice(1).join(' ')?.slice(0, 140) || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={handleCardClick}
      className="bg-card border rounded-2xl p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group relative flex flex-col"
    >
      {/* Category badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider', colors.bg, colors.text)}>
          {typeConfig.label}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ArrowRight className="w-4 h-4 text-muted-foreground" weight="bold" />
        </button>
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm leading-snug mb-1.5 line-clamp-2">{title}</h3>

      {/* Description */}
      {desc && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed flex-1">{desc}</p>
      )}

      {/* Skills/tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {allTags.slice(0, 4).map((tag: string) => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium">{tag}</span>
          ))}
          {allTags.length > 4 && (
            <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium">+{allTags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${user?.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="text-[8px]">{user?.full_name?.[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center gap-1 text-[10px] transition-colors',
              isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
            )}
          >
            <Heart className="w-3 h-3" weight={isLiked ? 'fill' : 'regular'} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          {(post.comment_count || 0) > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <ChatCircle className="w-3 h-3" weight="regular" />
              {post.comment_count}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}
        </span>
      </div>
    </motion.div>
  )
}

function FeedCardSkeleton() {
  return (
    <div className="bg-card border rounded-2xl p-4 animate-pulse h-52">
      <div className="h-4 bg-muted rounded w-16 mb-3" />
      <div className="h-4 bg-muted rounded w-4/5 mb-2" />
      <div className="h-3 bg-muted/60 rounded w-full mb-1.5" />
      <div className="h-3 bg-muted/60 rounded w-2/3 mb-4" />
      <div className="flex gap-1 mb-3">
        <div className="h-3 bg-muted rounded w-12" />
        <div className="h-3 bg-muted rounded w-16" />
      </div>
      <div className="mt-auto flex items-center justify-between pt-3 border-t">
        <div className="w-6 h-6 bg-muted rounded-full" />
        <div className="h-2 bg-muted rounded w-10" />
      </div>
    </div>
  )
}

function EmptyFeed({ hasFilters, onReset }: any) {
  return (
    <div className="bg-card border rounded-2xl p-12 text-center">
      <GlobeHemisphereWest className="w-14 h-14 mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
      <h3 className="font-bold">{hasFilters ? 'No matching posts' : 'No posts yet'}</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {hasFilters ? 'Try clearing your filters' : 'Be the first to share something with the community'}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onReset} className="mt-4">
          Clear Filters
        </Button>
      )}
    </div>
  )
}

// ============================================
// COMMUNITY OVERVIEW SIDEBAR
// ============================================
function CommunityOverview({ stats }: any) {
  const format = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`
    return n.toLocaleString()
  }

  const items = [
    { label: 'Members', value: format(stats.members), change: stats.growth.members, color: 'purple', icon: Users },
    { label: 'Projects', value: format(stats.projects), change: stats.growth.projects, color: 'blue', icon: Code },
    { label: 'Ventures', value: format(stats.ventures), change: stats.growth.ventures, color: 'green', icon: Rocket },
    { label: 'Looking For', value: format(stats.looking_for), change: stats.growth.looking_for, color: 'orange', icon: MagnifyingGlass },
  ]

  return (
    <div className="bg-card border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider font-bold">Community Overview</p>
        <button className="text-xs text-blue-500 hover:underline">View Analytics</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => {
          const Icon = item.icon
          const colors = COLOR_MAP[item.color]
          return (
            <div key={item.label} className="bg-muted/30 rounded-xl p-2.5">
              <div className={cn('w-6 h-6 rounded-md flex items-center justify-center mb-1.5', colors.bg)}>
                <Icon className={cn('w-3.5 h-3.5', colors.text)} weight="fill" />
              </div>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{item.label}</p>
              <p className="text-base font-bold mt-0.5">{item.value}</p>
              <p className={cn('text-[9px] font-semibold', colors.text)}>+{item.change}% this month</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// AI MATCH SIDEBAR
// ============================================
function AIMatchSidebar({ builders, onConnect, connectedIds }: any) {
  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <div className="p-3.5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkle className="w-3.5 h-3.5 text-purple-500" weight="fill" />
          <p className="text-xs uppercase tracking-wider font-bold">AI Match For You</p>
        </div>
        <Link href="/explore" className="text-xs text-blue-500 hover:underline">View All</Link>
      </div>
      {builders.length === 0 ? (
        <div className="p-6 text-center">
          <Users className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" weight="duotone" />
          <p className="text-xs text-muted-foreground">Complete your profile to see matches</p>
        </div>
      ) : (
        <div className="divide-y">
          {builders.slice(0, 4).map((builder: any, idx: number) => (
            <motion.div
              key={builder.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <Link href={`/profile/${builder.username}`}>
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={builder.avatar_url} />
                    <AvatarFallback className="text-xs">{builder.full_name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <Link href={`/profile/${builder.username}`} className="text-xs font-bold truncate hover:underline">
                      {builder.full_name}
                    </Link>
                    <span className="text-[10px] text-green-500 font-bold flex-shrink-0">
                      {builder.match_score}% Match
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{builder.tagline || 'Builder'}</p>
                  {builder.location && (
                    <p className="text-[10px] text-muted-foreground truncate flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" weight="duotone" />
                      {builder.location}
                    </p>
                  )}
                  {builder.top_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {builder.top_skills.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={connectedIds.has(builder.id) ? 'secondary' : 'default'}
                    disabled={connectedIds.has(builder.id)}
                    className="h-6 text-[10px] mt-2 px-3"
                    onClick={() => onConnect(builder.id)}
                  >
                    {connectedIds.has(builder.id) ? (
                      <><Check className="w-3 h-3 mr-1" weight="bold" /> Sent</>
                    ) : (
                      'Connect'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// TRENDING SKILLS SIDEBAR
// ============================================
function TrendingSkillsSidebar({ skills, onSelect }: any) {
  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <div className="p-3.5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendUp className="w-3.5 h-3.5 text-orange-500" weight="fill" />
          <p className="text-xs uppercase tracking-wider font-bold">Trending Skills</p>
        </div>
      </div>
      <div className="p-3.5">
        {skills.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center">No trending skills yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 14).map((skill: any, i: number) => (
              <button
                key={i}
                onClick={() => onSelect(skill.name)}
                className="text-[11px] px-2.5 py-1 bg-muted rounded-lg font-medium hover:bg-muted/70 transition-colors"
              >
                {skill.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// UPCOMING EVENTS SIDEBAR
// ============================================
function UpcomingEventsSidebar({ events }: any) {
  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <div className="p-3.5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarBlank className="w-3.5 h-3.5 text-pink-500" weight="fill" />
          <p className="text-xs uppercase tracking-wider font-bold">Upcoming Events</p>
        </div>
        <Link href="/events" className="text-xs text-blue-500 hover:underline">View All</Link>
      </div>
      <div className="divide-y">
        {events.length === 0 ? (
          <div className="p-6 text-center">
            <CalendarBlank className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" weight="duotone" />
            <p className="text-xs text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          events.slice(0, 4).map((event: any) => (
            <div key={event.id} className="p-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-bold text-pink-500 uppercase">
                    {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-sm font-bold text-pink-500 -mt-0.5">
                    {new Date(event.start_time).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{event.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {event.is_online ? 'Online Event' : (event.location || 'TBD')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <Button size="sm" className="h-6 text-[10px] px-2 bg-primary flex-shrink-0">
                  Register
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}