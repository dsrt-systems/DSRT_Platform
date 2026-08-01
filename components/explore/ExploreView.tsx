'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, Sparkles, Users, Rocket, Filter, Compass } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FollowButton } from '@/components/follow/FollowButton'
import { JoinButton } from '@/components/communities/JoinButton'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const colorMap: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  green: 'from-green-500 to-emerald-600',
  orange: 'from-orange-500 to-red-500',
  pink: 'from-pink-500 to-rose-500',
  red: 'from-red-500 to-red-600',
  cyan: 'from-cyan-500 to-blue-500',
  yellow: 'from-yellow-500 to-orange-500',
  gray: 'from-gray-500 to-gray-600',
}

interface ExploreViewProps {
  builders: any[]
  projects: any[]
  communities: any[]
  followingIds: string[]
  currentUserId: string
}

export function ExploreView({ builders, projects, communities, followingIds, currentUserId }: ExploreViewProps) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'builders' | 'projects' | 'communities'>('all')

  const filteredBuilders = builders.filter(b => 
    !search || 
    b.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.tagline?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredProjects = projects.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCommunities = communities.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Discover builders, projects, and communities across DSRT
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium hover:bg-muted transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Leaderboard
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search anything on DSRT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Tabs */}
      <div className="bg-card border rounded-xl p-1 grid grid-cols-4 gap-1">
        {[
          { id: 'all', label: 'All', icon: Sparkles },
          { id: 'builders', label: 'Builders', icon: Users },
          { id: 'projects', label: 'Projects', icon: Rocket },
          { id: 'communities', label: 'Communities', icon: Filter },
        ].map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={cn(
                'py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5',
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Trending Builders */}
      {(tab === 'all' || tab === 'builders') && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h2 className="font-bold">Trending Builders</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredBuilders.length} builders
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBuilders.slice(0, tab === 'builders' ? 20 : 6).map((builder, idx) => (
              <motion.div
                key={builder.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-card border rounded-xl p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Link href={`/profile/${builder.username}`}>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={builder.avatar_url} />
                      <AvatarFallback>
                        {builder.full_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/profile/${builder.username}`}
                      className="font-semibold text-sm hover:underline truncate block"
                    >
                      {builder.full_name}
                    </Link>
                    {builder.tagline && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {builder.tagline}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>{builder.follower_count || 0} followers</span>
                      <span>·</span>
                      <span>{builder.execution_score || 0} score</span>
                    </div>
                    {builder.brings?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {builder.brings.slice(0, 2).map((b: string) => (
                          <span key={b} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium capitalize">
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <FollowButton
                    targetId={builder.id}
                    initialFollowing={followingIds.includes(builder.id)}
                    size="sm"
                    showText={false}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Rising Projects */}
      {(tab === 'all' || tab === 'projects') && filteredProjects.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold">Rising Projects</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredProjects.length} projects
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProjects.slice(0, tab === 'projects' ? 20 : 6).map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Link
                  href={`/projects/${project.slug}`}
                  className="block bg-card border rounded-xl p-4 hover:border-primary/30 transition-colors group h-full"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0',
                      colorMap[project.color] || colorMap.blue
                    )}>
                      {project.icon || project.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {project.progress_percent}%
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {project.sector} · by {project.founder_name}
                      </p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full bg-gradient-to-r',
                            colorMap[project.color] || colorMap.blue
                          )}
                          style={{ width: `${project.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Top Communities */}
      {(tab === 'all' || tab === 'communities') && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <h2 className="font-bold">Top Communities</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredCommunities.length} communities
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCommunities.slice(0, tab === 'communities' ? 20 : 6).map((community, idx) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-card border rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
              >
                <div className={cn('h-12 bg-gradient-to-br', colorMap[community.icon_color] || colorMap.blue)} />
                <div className="p-4 -mt-6">
                  <div className={cn(
                    'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center border-4 border-background shadow-lg text-white font-bold',
                    colorMap[community.icon_color] || colorMap.blue
                  )}>
                    {community.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/community/${community.slug}`}
                        className="font-semibold text-sm hover:underline truncate"
                      >
                        {community.name}
                      </Link>
                      {community.is_verified && <span className="text-blue-500 text-xs">✓</span>}
                    </div>
                    {community.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {community.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="text-[10px] text-muted-foreground">
                        {community.member_count?.toLocaleString() || 0} members
                      </div>
                      <JoinButton
                        communityId={community.id}
                        size="sm"
                        showText={false}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {search && (
        filteredBuilders.length === 0 && 
        filteredProjects.length === 0 && 
        filteredCommunities.length === 0
      ) && (
        <div className="bg-card border rounded-2xl p-12 text-center">
          <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No results for "{search}"
          </p>
        </div>
      )}
    </div>
  )
}