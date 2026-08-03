'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
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
  Code,
  MagnifyingGlass,
  CalendarBlank,
  Lightbulb,
  Megaphone,
  Trophy,
  Handshake,
  Plus,
  X,
  TrendUp,
  Lightning,
  Sparkle,
  Users,
  MapPin,
  ArrowRight,
  SortAscending,
  SquaresFour,
  List,
  FunnelSimple,
  Eye,
  ChatCircle,
  Heart,
  BookmarkSimple,
  ShareNetwork,
  CaretRight,
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'

const POST_TYPES = [
  { id: 'post', label: 'Post', icon: Article, color: 'blue' },
  { id: 'project', label: 'Project', icon: Code, color: 'purple' },
  { id: 'venture', label: 'Venture', icon: Rocket, color: 'orange' },
  { id: 'looking_for', label: 'Looking For', icon: MagnifyingGlass, color: 'green' },
  { id: 'event', label: 'Event', icon: CalendarBlank, color: 'pink' },
  { id: 'resource', label: 'Resource', icon: Lightbulb, color: 'yellow' },
  { id: 'announcement', label: 'Announcement', icon: Megaphone, color: 'red' },
  { id: 'hackathon', label: 'Hackathon', icon: Trophy, color: 'cyan' },
]

const CONTENT_TABS = [
  { id: 'for_you', label: 'For You' },
  { id: 'projects', label: 'Projects' },
  { id: 'ventures', label: 'Ventures' },
  { id: 'looking_for', label: 'Looking For' },
  { id: 'posts', label: 'Posts' },
  { id: 'events', label: 'Events' },
  { id: 'discussions', label: 'Discussions' },
  { id: 'opportunities', label: 'Opportunities' },
]

const COMMUNITY_TABS = [
  { id: 'global', label: 'Global Community', icon: GlobeHemisphereWest },
  { id: 'organization', label: 'My Organization', icon: Buildings, badge: '' },
  { id: 'following', label: 'Following Communities', icon: UsersThree },
]

const CATEGORIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-Commerce',
  'Food & Beverage', 'Manufacturing', 'Real Estate', 'Media',
  'Agriculture', 'Energy', 'Defense', 'Government', 'Fashion',
  'Automotive', 'Services', 'Hospitality', 'Social Impact',
  'Gaming', 'Sports', 'Legal', 'Construction', 'Logistics',
]

export function CommunityPage({ currentUser, myCommunities, goals }: any) {
  const supabase = createClient()

  const [communityTab, setCommunityTab] = useState('global')
  const [contentTab, setContentTab] = useState('for_you')
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('relevance')

  const [categoryFilter, setCategoryFilter] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [goalFilter, setGoalFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  const [composerOpen, setComposerOpen] = useState(false)
  const [composerType, setComposerType] = useState('post')
  const [composerContent, setComposerContent] = useState('')
  const [composerTags, setComposerTags] = useState('')
  const [composerSkills, setComposerSkills] = useState('')
  const [posting, setPosting] = useState(false)

  const [recommendedBuilders, setRecommendedBuilders] = useState<any[]>([])
  const [trendingSkills, setTrendingSkills] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [communityStats, setCommunityStats] = useState({ members: 0, projects: 0, ventures: 0, lookingFor: 0 })

  const loadFeed = async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    if (reset) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({ tab: contentTab, limit: '20', offset: currentOffset.toString() })
      if (categoryFilter) params.set('category', categoryFilter)
      if (skillFilter) params.set('skill', skillFilter)
      if (goalFilter) params.set('goal', goalFilter)
      if (locationFilter) params.set('location', locationFilter)

      const res = await fetch(`/api/community/feed?${params}`)
      const data = await res.json()

      if (reset) { setPosts(data.posts || []); setOffset(20) }
      else { setPosts(prev => [...prev, ...(data.posts || [])]); setOffset(currentOffset + 20) }
      setHasMore(data.has_more)
    } catch (err) { console.error('Feed error:', err) }
    finally { setLoading(false); setLoadingMore(false) }
  }

  const loadSidebar = async () => {
    try {
      const [buildersRes, skillsRes, eventsRes, statsRes] = await Promise.all([
        fetch('/api/community/recommended'),
        fetch('/api/community/trending-skills'),
        supabase.from('community_events').select('*').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(5),
        Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('onboarding_complete', true),
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('ventures').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('posts').select('*', { count: 'exact', head: true }).eq('post_category', 'looking_for'),
        ]),
      ])

      const buildersData = await buildersRes.json()
      const skillsData = await skillsRes.json()

      setRecommendedBuilders(buildersData.builders || [])
      setTrendingSkills(skillsData.skills || [])
      setUpcomingEvents(eventsRes.data || [])
      setCommunityStats({
        members: statsRes[0].count || 0,
        projects: statsRes[1].count || 0,
        ventures: statsRes[2].count || 0,
        lookingFor: statsRes[3].count || 0,
      })
    } catch (err) { console.error('Sidebar error:', err) }
  }

  useEffect(() => { loadFeed(true); loadSidebar() }, [])
  useEffect(() => { loadFeed(true) }, [contentTab, categoryFilter, skillFilter, goalFilter, locationFilter])

  useEffect(() => {
    const channel = supabase.channel('community-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: 'visibility=eq.global' }, async (payload) => {
        const newPost = payload.new as any
        const { data: user } = await supabase.from('users').select('id, full_name, username, avatar_url, tagline, brings, location').eq('id', newPost.user_id).single()
        setPosts(prev => [{ ...newPost, users: user, is_liked: false, is_bookmarked: false, relevance_score: 100 }, ...prev])
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handlePost = async () => {
    if (!composerContent.trim()) { toast.error('Write something first'); return }
    setPosting(true)
    const tagsArray = composerTags.split(/[\s,]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean).slice(0, 10)
    const skillsArray = composerSkills.split(/[\s,]+/).map(s => s.trim()).filter(Boolean).slice(0, 10)

    const { data, error } = await supabase.from('posts').insert({
      user_id: currentUser.id, type: composerType === 'post' ? 'update' : composerType, post_category: composerType,
      content: composerContent.trim(), tags: tagsArray, skills: skillsArray, visibility: 'global',
    }).select().single()

    setPosting(false)
    if (error) { toast.error('Failed: ' + error.message) }
    else {
      toast.success('Posted')
      setPosts(prev => [{ ...data, users: { id: currentUser.id, full_name: currentUser.full_name, username: currentUser.username, avatar_url: currentUser.avatar_url, tagline: currentUser.tagline, brings: currentUser.brings }, is_liked: false, is_bookmarked: false, relevance_score: 100 }, ...prev])
      setComposerContent(''); setComposerTags(''); setComposerSkills(''); setComposerOpen(false)
    }
  }

  const handleConnect = async (userId: string) => {
    const { error } = await supabase.from('follows').insert({ follower_id: currentUser.id, following_type: 'user', following_id: userId })
    if (error?.code === '23505') { toast.error('Already connected') }
    else if (error) { toast.error('Failed') }
    else { toast.success('Connected!'); setRecommendedBuilders(prev => prev.filter(b => b.id !== userId)) }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 p-4 md:p-6">
        {/* ==================== MAIN ==================== */}
        <div className="space-y-4 min-w-0">
          {/* Header with globe */}
          <div className="bg-card border rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 opacity-20">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h1 className="text-2xl font-bold tracking-tight">Community</h1>
              <p className="text-sm text-muted-foreground mt-1">Three communities. Infinite opportunities.</p>
              <div className="flex gap-2 mt-4">
                {COMMUNITY_TABS.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button key={tab.id} onClick={() => setCommunityTab(tab.id)}
                      className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                        communityTab === tab.id ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted/60 hover:bg-muted text-muted-foreground')}>
                      <Icon className="w-4 h-4" weight="fill" />
                      {tab.label}
                      {tab.badge && <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded font-bold">{tab.badge}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sub-tabs row: All | Projects | Ventures | Looking For | Posts | Events | etc + Sort */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {CONTENT_TABS.map(tab => (
                <button key={tab.id} onClick={() => setContentTab(tab.id)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                    contentTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground')}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs bg-muted/40 border rounded-md px-2 py-1.5 focus:outline-none">
                <option value="relevance">Sort by: Relevance</option>
                <option value="recent">Sort by: Recent</option>
                <option value="popular">Sort by: Popular</option>
              </select>
              <div className="flex border rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={cn('p-1.5', viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted/50')}>
                  <SquaresFour className="w-4 h-4" weight={viewMode === 'grid' ? 'fill' : 'regular'} />
                </button>
                <button onClick={() => setViewMode('list')} className={cn('p-1.5', viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted/50')}>
                  <List className="w-4 h-4" weight={viewMode === 'list' ? 'fill' : 'regular'} />
                </button>
              </div>
            </div>
          </div>

          {/* Create New */}
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

            {composerOpen ? (
              <div className="space-y-3 pl-12">
                <Textarea value={composerContent} onChange={(e) => setComposerContent(e.target.value)} placeholder="Share your update..." rows={3} autoFocus maxLength={2000} className="resize-none" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={composerTags} onChange={(e) => setComposerTags(e.target.value)} placeholder="#tags" className="text-xs" />
                  <Input value={composerSkills} onChange={(e) => setComposerSkills(e.target.value)} placeholder="Skills" className="text-xs" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">{composerContent.length}/2000</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setComposerOpen(false)}>Cancel</Button>
                    <Button size="sm" onClick={handlePost} disabled={posting || !composerContent.trim()}>{posting ? 'Posting...' : 'Post'}</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-1.5 overflow-x-auto pl-12">
                {POST_TYPES.map(type => {
                  const Icon = type.icon
                  return (
                    <button key={type.id} onClick={() => { setComposerOpen(true); setComposerType(type.id) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/50 hover:bg-muted transition-colors whitespace-nowrap">
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
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
              <Lightning className="w-4 h-4 text-yellow-500" weight="fill" />
              How Our Smart Matching Works
            </h3>
            <p className="text-[11px] text-muted-foreground mb-3">Our AI-powered algorithm connects you with the right people and opportunities.</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { step: '1', title: 'Tell Us About You', desc: 'Share your skills, interests, and goals.', icon: Users },
                { step: '2', title: 'AI Analyzes', desc: 'Our algorithm analyzes compatibility, skills, and goals.', icon: Sparkle },
                { step: '3', title: 'Find Your Match', desc: 'Get matched with projects, ventures, and people.', icon: MagnifyingGlass },
                { step: '4', title: 'Build Together', desc: 'Collaborate, create, and make an impact.', icon: Rocket },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="bg-card/60 rounded-xl p-3 text-center relative">
                    <div className="w-8 h-8 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                      <Icon className="w-4 h-4 text-blue-500" weight="fill" />
                    </div>
                    <p className="text-[11px] font-bold">{item.title}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{item.desc}</p>
                    {i < 3 && <CaretRight className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 hidden md:block" weight="bold" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex gap-2 overflow-x-auto">
            <FilterDropdown label="All Categories" value={categoryFilter} onChange={setCategoryFilter} options={CATEGORIES} />
            <FilterInput value={skillFilter} onChange={setSkillFilter} placeholder="All Skills" />
            <FilterDropdown label="All Goals" value={goalFilter} onChange={setGoalFilter} options={goals.map((g: any) => g.name)} />
            <FilterInput value={locationFilter} onChange={setLocationFilter} placeholder="Location" />
          </div>

          {/* Feed — CARD GRID */}
          {loading ? (
            <div className={cn('gap-3', viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3' : 'space-y-3')}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-card border rounded-2xl p-5 animate-pulse h-48">
                  <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-3 bg-muted/60 rounded w-full mb-2" />
                  <div className="h-3 bg-muted/60 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-card border rounded-2xl p-12 text-center">
              <GlobeHemisphereWest className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
              <h3 className="font-bold">No posts yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Be the first to share something</p>
            </div>
          ) : (
            <>
              <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 gap-3' : 'space-y-3')}>
                {posts.map((post, idx) => (
                  <FeedCard key={post.id} post={post} currentUser={currentUser} index={idx} viewMode={viewMode} />
                ))}
              </div>
              {hasMore && (
                <button onClick={() => loadFeed(false)} disabled={loadingMore}
                  className="w-full py-3 border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  {loadingMore ? 'Loading...' : 'Load More ↓'}
                </button>
              )}
            </>
          )}
        </div>

        {/* ==================== RIGHT SIDEBAR ==================== */}
        <aside className="hidden lg:block space-y-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {/* Community Overview */}
          <div className="bg-card border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider font-bold">Community Overview</p>
              <button className="text-xs text-blue-500 hover:underline">View Analytics</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Members', value: communityStats.members > 1000 ? `${(communityStats.members / 1000).toFixed(0)}K+` : communityStats.members, change: '+12%', color: 'purple' },
                { label: 'Projects', value: communityStats.projects.toLocaleString(), change: '+18%', color: 'blue' },
                { label: 'Ventures', value: communityStats.ventures.toLocaleString(), change: '+15%', color: 'green' },
                { label: 'Looking For', value: communityStats.lookingFor.toLocaleString(), change: '+20%', color: 'orange' },
              ].map(stat => (
                <div key={stat.label} className="bg-muted/30 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-bold mt-0.5">{stat.value}</p>
                  <p className={`text-[10px] text-${stat.color}-500 font-semibold`}>{stat.change} this month</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Match For You */}
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkle className="w-3.5 h-3.5 text-purple-500" weight="fill" />
                <p className="text-xs uppercase tracking-wider font-bold">AI Match For You</p>
              </div>
              <Link href="/explore" className="text-xs text-blue-500 hover:underline">View All</Link>
            </div>
            {recommendedBuilders.length === 0 ? (
              <div className="p-4 text-center"><p className="text-xs text-muted-foreground">Complete your profile to see matches</p></div>
            ) : (
              <div className="divide-y">
                {recommendedBuilders.slice(0, 4).map((builder, idx) => (
                  <motion.div key={builder.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <Link href={`/profile/${builder.username}`}>
                        <Avatar className="w-10 h-10"><AvatarImage src={builder.avatar_url} /><AvatarFallback className="text-xs">{builder.full_name?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <Link href={`/profile/${builder.username}`} className="text-xs font-bold truncate hover:underline">{builder.full_name}</Link>
                          <span className="text-[10px] text-green-500 font-bold flex-shrink-0">{builder.match_score}% Match</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{builder.tagline}</p>
                        {builder.location && <p className="text-[10px] text-muted-foreground truncate">{builder.location}</p>}
                        {builder.top_skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {builder.top_skills.slice(0, 3).map((skill: string) => (
                              <span key={skill} className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded font-medium">{skill}</span>
                            ))}
                          </div>
                        )}
                        <Button size="sm" variant="outline" className="h-6 text-[10px] mt-2" onClick={() => handleConnect(builder.id)}>Connect</Button>
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
              <button className="text-xs text-blue-500 hover:underline">View All</button>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1.5">
                {trendingSkills.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No trending skills yet</p>
                ) : (
                  trendingSkills.map((skill, i) => (
                    <button key={i} onClick={() => setSkillFilter(skill.name)}
                      className="text-xs px-2.5 py-1 bg-muted rounded-lg font-medium hover:bg-muted/70 transition-colors">{skill.name}</button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarBlank className="w-3.5 h-3.5 text-pink-500" weight="fill" />
                <p className="text-xs uppercase tracking-wider font-bold">Upcoming Events</p>
              </div>
              <button className="text-xs text-blue-500 hover:underline">View All</button>
            </div>
            <div className="divide-y">
              {upcomingEvents.length === 0 ? (
                <div className="p-4 text-center"><p className="text-xs text-muted-foreground">No upcoming events</p></div>
              ) : (
                upcomingEvents.slice(0, 3).map(event => (
                  <div key={event.id} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[8px] font-bold text-pink-500 uppercase">{new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-sm font-bold text-pink-500 -mt-0.5">{new Date(event.start_time).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{event.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{event.is_online ? 'Online Event' : event.location}</p>
                      </div>
                      <Button size="sm" className="h-6 text-[10px] px-2 bg-primary">Register</Button>
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

// ==================== FEED CARD (Grid/List) ====================

function FeedCard({ post, currentUser, index, viewMode }: any) {
  const supabase = createClient()
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)

  const typeConfig = POST_TYPES.find(t => t.id === post.post_category) || POST_TYPES[0]
  const Icon = typeConfig.icon
  const user = post.users

  const handleLike = async () => {
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikeCount((prev: number) => newLiked ? prev + 1 : prev - 1)

    if (newLiked) {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUser.id })
    } else {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-card border rounded-2xl p-4 hover:border-primary/30 transition-colors group relative"
    >
      {/* Category Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider',
          `bg-${typeConfig.color}-500/10 text-${typeConfig.color}-500`
        )}>
          {typeConfig.label}
        </span>
        <CaretRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" weight="bold" />
      </div>

      {/* Title (first line of content) */}
      <h3 className="font-bold text-sm leading-tight mb-1.5 line-clamp-2">
        {post.content?.split('\n')[0]?.slice(0, 80)}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
        {post.content?.split('\n').slice(1).join(' ')?.slice(0, 120) || post.content?.slice(0, 120)}
      </p>

      {/* Skills/Tags */}
      {(post.skills?.length > 0 || post.tags?.length > 0) && (
        <div className="flex flex-wrap gap-1 mb-3">
          {[...(post.skills || []), ...(post.tags || [])].slice(0, 4).map((tag: string) => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium">{tag}</span>
          ))}
          {[...(post.skills || []), ...(post.tags || [])].length > 4 && (
            <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium">
              +{[...(post.skills || []), ...(post.tags || [])].length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer: Avatar + time */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2">
          {/* Author avatars */}
          <Link href={`/profile/${user?.username}`}>
            <Avatar className="w-6 h-6">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="text-[8px]">{user?.full_name?.[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex -space-x-1.5">
            {[1,2].map(i => (
              <div key={i} className="w-5 h-5 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-bold text-muted-foreground">
                {String.fromCharCode(64 + i + 1)}
              </div>
            ))}
          </div>
          {likeCount > 0 && (
            <span className="text-[10px] text-muted-foreground">+{likeCount}</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}
        </span>
      </div>
    </motion.div>
  )
}

// ==================== FILTER COMPONENTS ====================

function FilterDropdown({ label, value, onChange, options }: any) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-8 text-xs bg-muted/40 border rounded-lg px-2.5 focus:outline-none cursor-pointer min-w-[130px] appearance-none">
      <option value="">{label}</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

function FilterInput({ value, onChange, placeholder }: any) {
  return (
    <div className="relative">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-8 text-xs w-28 pr-6" />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-1.5 top-1/2 -translate-y-1/2">
          <X className="w-3 h-3" weight="bold" />
        </button>
      )}
    </div>
  )
}