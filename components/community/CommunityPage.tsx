'use client'

import { useState, useEffect } from 'react'
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
  GlobeHemisphereWest,
  Buildings,
  UsersThree,
  Article,
  Rocket,
  Briefcase,
  MagnifyingGlass as SearchIcon,
  CalendarBlank,
  Lightbulb,
  Megaphone,
  Code,
  Handshake,
  FunnelSimple,
  SortAscending,
  Plus,
  X,
  TrendUp,
  Lightning,
  Sparkle,
  Users,
  MapPin,
  ArrowRight,
  Heart,
  ChatCircle,
  BookmarkSimple,
  ShareNetwork,
  Eye,
  Clock,
  Star,
  Trophy,
} from '@phosphor-icons/react'
import { PostCard } from '@/components/feed/PostCard'
import { formatDistanceToNow } from 'date-fns'

// Post categories for composer
const POST_TYPES = [
  { id: 'post', label: 'Post', icon: Article, color: 'blue' },
  { id: 'project', label: 'Project', icon: Code, color: 'purple' },
  { id: 'venture', label: 'Venture', icon: Rocket, color: 'orange' },
  { id: 'looking_for', label: 'Looking For', icon: SearchIcon, color: 'green' },
  { id: 'event', label: 'Event', icon: CalendarBlank, color: 'pink' },
  { id: 'resource', label: 'Resource', icon: Lightbulb, color: 'yellow' },
  { id: 'announcement', label: 'Announcement', icon: Megaphone, color: 'red' },
  { id: 'hackathon', label: 'Hackathon', icon: Trophy, color: 'cyan' },
]

// Content tabs
const CONTENT_TABS = [
  { id: 'for_you', label: 'For You' },
  { id: 'projects', label: 'Projects' },
  { id: 'ventures', label: 'Ventures' },
  { id: 'looking_for', label: 'Looking For' },
  { id: 'events', label: 'Events' },
  { id: 'discussions', label: 'Discussions' },
  { id: 'opportunities', label: 'Opportunities' },
]

// Community tabs
const COMMUNITY_TABS = [
  { id: 'global', label: 'Global Community', icon: GlobeHemisphereWest },
  { id: 'organization', label: 'My Organization', icon: Buildings },
  { id: 'following', label: 'Following Communities', icon: UsersThree },
]

export function CommunityPage({ currentUser, myCommunities, goals }: any) {
  const supabase = createClient()
  const router = useRouter()

  // State
  const [communityTab, setCommunityTab] = useState('global')
  const [contentTab, setContentTab] = useState('for_you')
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [goalFilter, setGoalFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [communityFilter, setCommunityFilter] = useState('')

  // Composer
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerType, setComposerType] = useState('post')
  const [composerContent, setComposerContent] = useState('')
  const [composerTags, setComposerTags] = useState('')
  const [composerSkills, setComposerSkills] = useState('')
  const [composerLocation, setComposerLocation] = useState('')
  const [posting, setPosting] = useState(false)

  // Sidebar data
  const [recommendedBuilders, setRecommendedBuilders] = useState<any[]>([])
  const [trendingSkills, setTrendingSkills] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])

  // Load feed
  const loadFeed = async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    if (reset) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({
        tab: contentTab,
        limit: '20',
        offset: currentOffset.toString(),
      })
      if (categoryFilter) params.set('category', categoryFilter)
      if (skillFilter) params.set('skill', skillFilter)
      if (goalFilter) params.set('goal', goalFilter)
      if (locationFilter) params.set('location', locationFilter)
      if (communityFilter) params.set('community', communityFilter)

      const res = await fetch(`/api/community/feed?${params}`)
      const data = await res.json()

      if (reset) {
        setPosts(data.posts || [])
        setOffset(20)
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])])
        setOffset(currentOffset + 20)
      }
      setHasMore(data.has_more)
    } catch (err) {
      console.error('Feed error:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load sidebar data
  const loadSidebar = async () => {
    try {
      const [buildersRes, skillsRes, eventsRes] = await Promise.all([
        fetch('/api/community/recommended'),
        fetch('/api/community/trending-skills'),
        supabase
          .from('community_events')
          .select('*')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(5),
      ])

      const buildersData = await buildersRes.json()
      const skillsData = await skillsRes.json()

      setRecommendedBuilders(buildersData.builders || [])
      setTrendingSkills(skillsData.skills || [])
      setUpcomingEvents(eventsRes.data || [])
    } catch (err) {
      console.error('Sidebar error:', err)
    }
  }

  // Initial load
  useEffect(() => {
    loadFeed(true)
    loadSidebar()
  }, [])

  // Reload on filter/tab change
  useEffect(() => {
    loadFeed(true)
  }, [contentTab, categoryFilter, skillFilter, goalFilter, locationFilter, communityFilter])

  // Real-time new posts
  useEffect(() => {
    const channel = supabase
      .channel('community-posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: 'visibility=eq.global',
      }, async (payload) => {
        const newPost = payload.new as any
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
          relevance_score: 100,
        }, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Post new content
  const handlePost = async () => {
    if (!composerContent.trim()) {
      toast.error('Write something first')
      return
    }

    setPosting(true)

    const tagsArray = composerTags.split(/[\s,]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean).slice(0, 10)
    const skillsArray = composerSkills.split(/[\s,]+/).map(s => s.trim()).filter(Boolean).slice(0, 10)

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: currentUser.id,
        type: composerType === 'post' ? 'update' : composerType,
        post_category: composerType,
        content: composerContent.trim(),
        tags: tagsArray,
        skills: skillsArray,
        location: composerLocation.trim() || null,
        visibility: 'global',
      })
      .select()
      .single()

    setPosting(false)

    if (error) {
      toast.error('Failed to post: ' + error.message)
    } else {
      toast.success('Posted to community')
      setComposerContent('')
      setComposerTags('')
      setComposerSkills('')
      setComposerLocation('')
      setComposerOpen(false)

      // Add to feed optimistically
      setPosts(prev => [{
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
      }, ...prev])
    }
  }

  const handleConnect = async (userId: string) => {
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUser.id,
        following_type: 'user',
        following_id: userId,
      })

    if (error) {
      if (error.code === '23505') {
        toast.error('Already connected')
      } else {
        toast.error('Failed to connect')
      }
    } else {
      toast.success('Connected!')
      setRecommendedBuilders(prev => prev.filter(b => b.id !== userId))
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 p-4 md:p-6">
        {/* ==================== MAIN CONTENT ==================== */}
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-card border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Community</h1>
                <p className="text-sm text-muted-foreground">Connect, collaborate, and build together.</p>
              </div>
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-background flex items-center justify-center text-white text-[9px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
            </div>

            {/* Community Tabs */}
            <div className="flex gap-2">
              {COMMUNITY_TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCommunityTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                      communityTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/70 text-muted-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" weight="fill" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Post Composer */}
          <div className="bg-card border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={currentUser?.avatar_url} />
                <AvatarFallback>{currentUser?.full_name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {!composerOpen ? (
                  <button
                    onClick={() => setComposerOpen(true)}
                    className="w-full text-left px-4 py-2.5 bg-muted/40 rounded-xl text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
                  >
                    What are you building or looking for?
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      value={composerContent}
                      onChange={(e) => setComposerContent(e.target.value)}
                      placeholder="Share your update, project, or what you're looking for..."
                      rows={4}
                      autoFocus
                      maxLength={2000}
                      className="resize-none"
                    />

                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {POST_TYPES.map(type => {
                        const Icon = type.icon
                        return (
                          <button
                            key={type.id}
                            onClick={() => setComposerType(type.id)}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                              composerType === type.id
                                ? `bg-${type.color}-500/10 text-${type.color}-500 border border-${type.color}-500/30`
                                : 'bg-muted hover:bg-muted/70'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" weight="fill" />
                            {type.label}
                          </button>
                        )
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        value={composerTags}
                        onChange={(e) => setComposerTags(e.target.value)}
                        placeholder="#tags (comma separated)"
                        className="text-xs"
                      />
                      <Input
                        value={composerSkills}
                        onChange={(e) => setComposerSkills(e.target.value)}
                        placeholder="Skills (comma separated)"
                        className="text-xs"
                      />
                      <Input
                        value={composerLocation}
                        onChange={(e) => setComposerLocation(e.target.value)}
                        placeholder="Location"
                        className="text-xs"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-[10px] text-muted-foreground">{composerContent.length}/2000</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setComposerOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handlePost} disabled={posting || !composerContent.trim()}>
                          {posting ? 'Posting...' : 'Post'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!composerOpen && (
              <div className="flex gap-2 mt-3 ml-13 overflow-x-auto">
                {POST_TYPES.slice(0, 6).map(type => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => { setComposerOpen(true); setComposerType(type.id) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/70 transition-colors whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5" weight="duotone" />
                      {type.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* How Matching Works */}
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Lightning className="w-4 h-4 text-yellow-500" weight="fill" />
              How Our Smart Matching Works
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Our AI-powered algorithm connects you with the right people and opportunities.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { step: '1', title: 'Tell Us About You', desc: 'Share your skills, interests, and goals.', icon: Users },
                { step: '2', title: 'AI Analyzes', desc: 'Our algorithm analyzes compatibility, skills, and goals.', icon: Sparkle },
                { step: '3', title: 'Find Your Match', desc: 'Get matched with projects, ventures, and people.', icon: SearchIcon },
                { step: '4', title: 'Build Together', desc: 'Collaborate, create, and make an impact.', icon: Rocket },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.step} className="bg-card/50 rounded-xl p-3 text-center">
                    <div className="w-8 h-8 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                      <Icon className="w-4 h-4 text-blue-500" weight="fill" />
                    </div>
                    <p className="text-xs font-bold">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Content Tabs + Filters */}
          <div className="space-y-3">
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {CONTENT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setContentTab(tab.id)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                    contentTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterSelect
                label="All Categories"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[
                  'Technology', 'Healthcare', 'Finance', 'Education', 'E-Commerce',
                  'Food & Beverage', 'Manufacturing', 'Real Estate', 'Media',
                  'Agriculture', 'Energy', 'Defense', 'Government', 'Fashion',
                  'Automotive', 'Services', 'Hospitality', 'Social Impact',
                ]}
              />
              <div className="relative">
                <Input
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  placeholder="All Skills"
                  className="h-8 text-xs w-32 pr-6"
                />
                {skillFilter && (
                  <button onClick={() => setSkillFilter('')} className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3" weight="bold" />
                  </button>
                )}
              </div>
              <FilterSelect
                label="All Goals"
                value={goalFilter}
                onChange={setGoalFilter}
                options={goals.map((g: any) => g.name)}
              />
              <div className="relative">
                <Input
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Location"
                  className="h-8 text-xs w-32 pr-6"
                />
                {locationFilter && (
                  <button onClick={() => setLocationFilter('')} className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3" weight="bold" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-card border rounded-2xl p-6 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-1/3" />
                        <div className="h-2 bg-muted/60 rounded w-2/3" />
                        <div className="h-2 bg-muted/60 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-card border rounded-2xl p-12 text-center">
                <GlobeHemisphereWest className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
                <h3 className="font-bold">No posts yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Be the first to share something with the community</p>
              </div>
            ) : (
              <>
                {posts.map((post, idx) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    index={idx}
                    onUpdate={(updated) => {
                      setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
                    }}
                    onDelete={(id) => {
                      setPosts(prev => prev.filter(p => p.id !== id))
                    }}
                  />
                ))}

                {hasMore && (
                  <button
                    onClick={() => loadFeed(false)}
                    disabled={loadingMore}
                    className="w-full py-3 border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                  >
                    {loadingMore ? 'Loading...' : 'Load More ↓'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ==================== RIGHT SIDEBAR ==================== */}
        <aside className="hidden lg:block space-y-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {/* Recommended Builders */}
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkle className="w-3.5 h-3.5 text-purple-500" weight="fill" />
                <p className="text-xs uppercase tracking-wider font-bold">Recommended Builders</p>
              </div>
              <Link href="/explore" className="text-xs text-blue-500 hover:underline">View All</Link>
            </div>

            {recommendedBuilders.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Complete your profile to see matches</p>
              </div>
            ) : (
              <div className="divide-y">
                {recommendedBuilders.slice(0, 4).map((builder, idx) => (
                  <motion.div
                    key={builder.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <Link href={`/profile/${builder.username}`}>
                        <Avatar className="w-10 h-10">
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
                        <p className="text-[10px] text-muted-foreground truncate">{builder.tagline}</p>
                        {builder.location && (
                          <p className="text-[10px] text-muted-foreground truncate flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" weight="duotone" />
                            {builder.location}
                          </p>
                        )}
                        {builder.top_skills && builder.top_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {builder.top_skills.slice(0, 3).map((skill: string) => (
                              <span key={skill} className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleConnect(builder.id)}
                          >
                            Connect
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Skills */}
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendUp className="w-3.5 h-3.5 text-orange-500" weight="fill" />
                <p className="text-xs uppercase tracking-wider font-bold">Trending Skills</p>
              </div>
              <Link href="/explore" className="text-xs text-blue-500 hover:underline">View All</Link>
            </div>
            <div className="p-4">
              {trendingSkills.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center">No trending skills yet</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {trendingSkills.map((skill, i) => (
                    <button
                      key={i}
                      onClick={() => setSkillFilter(skill.name)}
                      className="text-xs px-2.5 py-1 bg-muted rounded-lg font-medium hover:bg-muted/70 transition-colors"
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarBlank className="w-3.5 h-3.5 text-pink-500" weight="fill" />
                <p className="text-xs uppercase tracking-wider font-bold">Upcoming Events</p>
              </div>
              <Link href="/community" className="text-xs text-blue-500 hover:underline">View All</Link>
            </div>
            <div className="divide-y">
              {upcomingEvents.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">No upcoming events</p>
                </div>
              ) : (
                upcomingEvents.slice(0, 3).map(event => (
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
                          {event.is_online ? 'Online Event' : event.location}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
                        Register
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ==================== SUB COMPONENTS ====================

function CommunityPostCard({ post, currentUser, index, onUpdate, onDelete }: any) {
  const typeConfig = POST_TYPES.find(t => t.id === post.post_category) || POST_TYPES[0]
  const Icon = typeConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <PostCard
        post={post}
        currentUser={currentUser}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </motion.div>
  )
}

function FilterSelect({ label, value, onChange, options }: any) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 text-xs bg-muted border rounded-lg px-2 focus:outline-none cursor-pointer min-w-[120px]"
    >
      <option value="">{label}</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}