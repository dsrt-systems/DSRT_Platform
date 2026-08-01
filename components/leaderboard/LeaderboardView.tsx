'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trophy, Users, Rocket, Flame, Sparkles, TrendingUp, Medal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

interface LeaderboardViewProps {
  builders: any[]
  projects: any[]
  communities: any[]
  currentUserId: string
}

export function LeaderboardView({ builders, projects, communities, currentUserId }: LeaderboardViewProps) {
  const [tab, setTab] = useState<'builders' | 'projects' | 'communities'>('builders')

  const myRank = builders.findIndex(b => b.id === currentUserId)

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">
              Top builders, projects, and communities on DSRT
            </p>
          </div>
        </div>

        {myRank >= 0 && (
          <div className="mt-4 pt-4 border-t border-orange-500/20">
            <p className="text-xs text-muted-foreground">
              Your rank: <span className="font-bold text-foreground">#{myRank + 1}</span> of {builders.length}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-card border rounded-xl p-1 grid grid-cols-3 gap-1">
        {[
          { id: 'builders', label: 'Builders', icon: Users },
          { id: 'projects', label: 'Projects', icon: Rocket },
          { id: 'communities', label: 'Communities', icon: Sparkles },
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

      {/* Builders Leaderboard */}
      {tab === 'builders' && (
        <div className="space-y-2">
          {builders.length === 0 ? (
            <EmptyLeaderboard message="No builders yet" />
          ) : (
            <>
              {/* Top 3 Podium */}
              {builders.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <PodiumCard user={builders[1]} rank={2} isCurrentUser={builders[1].id === currentUserId} />
                  <PodiumCard user={builders[0]} rank={1} isCurrentUser={builders[0].id === currentUserId} />
                  <PodiumCard user={builders[2]} rank={3} isCurrentUser={builders[2].id === currentUserId} />
                </div>
              )}

              {/* Rest of list */}
              <div className="bg-card border rounded-2xl overflow-hidden">
                {builders.slice(3).map((builder, idx) => (
                  <motion.div
                    key={builder.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={cn(
                      'p-4 border-b last:border-b-0 flex items-center gap-4 hover:bg-muted/30 transition-colors',
                      builder.id === currentUserId && 'bg-primary/5'
                    )}
                  >
                    <div className="w-8 text-center">
                      <span className={cn(
                        'text-sm font-bold',
                        idx + 4 <= 10 ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        #{idx + 4}
                      </span>
                    </div>
                    <Link href={`/profile/${builder.username}`}>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={builder.avatar_url} />
                        <AvatarFallback>{builder.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${builder.username}`}
                          className="font-semibold text-sm hover:underline truncate"
                        >
                          {builder.full_name}
                        </Link>
                        {builder.id === currentUserId && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      {builder.tagline && (
                        <p className="text-xs text-muted-foreground truncate">
                          {builder.tagline}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      {builder.streak_days > 0 && (
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="w-3 h-3" />
                          <span className="font-bold">{builder.streak_days}</span>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="font-bold">{builder.leaderboard_score?.toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">score</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Projects Leaderboard */}
      {tab === 'projects' && (
        <div className="bg-card border rounded-2xl overflow-hidden">
          {projects.length === 0 ? (
            <EmptyLeaderboard message="No public projects yet" />
          ) : (
            projects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center">
                    <span className="text-sm font-bold">#{idx + 1}</span>
                  </div>
                  <div className={cn(
                    'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
                    colorMap[project.color] || colorMap.blue
                  )}>
                    {project.icon || project.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="font-semibold text-sm hover:underline truncate block"
                    >
                      {project.name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {project.sector} · by {project.founder_name}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">{project.progress_percent}%</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                      progress
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">{project.traction_score || 0}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                      traction
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Communities Leaderboard */}
      {tab === 'communities' && (
        <div className="bg-card border rounded-2xl overflow-hidden">
          {communities.length === 0 ? (
            <EmptyLeaderboard message="No communities yet" />
          ) : (
            communities.map((community, idx) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center">
                    <span className="text-sm font-bold">#{idx + 1}</span>
                  </div>
                  <div className={cn(
                    'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
                    colorMap[community.icon_color] || colorMap.blue
                  )}>
                    {community.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/community/${community.slug}`}
                        className="font-semibold text-sm hover:underline truncate"
                      >
                        {community.name}
                      </Link>
                      {community.is_verified && <span className="text-blue-500 text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {community.category} · {community.type}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">{community.member_count?.toLocaleString() || 0}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                      members
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">{community.community_score || 0}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                      score
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function PodiumCard({ user, rank, isCurrentUser }: any) {
  const medalColors = {
    1: 'from-yellow-400 to-yellow-600 shadow-yellow-500/50',
    2: 'from-slate-300 to-slate-500 shadow-slate-500/50',
    3: 'from-orange-400 to-orange-600 shadow-orange-500/50',
  }

  const medalIcons = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (4 - rank) * 0.1 }}
      className={cn(
        'bg-card border rounded-2xl p-4 text-center relative',
        rank === 1 && 'md:pt-8',
        isCurrentUser && 'ring-2 ring-primary'
      )}
    >
      <div className="text-2xl mb-2">{medalIcons[rank as 1|2|3]}</div>
      <div className="relative inline-block">
        <Avatar className="w-16 h-16 mx-auto border-4 border-background">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
        </Avatar>
        <div className={cn(
          'absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold shadow-lg',
          medalColors[rank as 1|2|3]
        )}>
          {rank}
        </div>
      </div>
      <Link
        href={`/profile/${user.username}`}
        className="block mt-2 font-semibold text-sm hover:underline truncate"
      >
        {user.full_name}
      </Link>
      <p className="text-xs text-muted-foreground truncate">
        @{user.username}
      </p>
      <div className="mt-2 pt-2 border-t">
        <p className="font-bold text-lg">{user.leaderboard_score?.toLocaleString()}</p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
          score
        </p>
      </div>
    </motion.div>
  )
}

function EmptyLeaderboard({ message }: { message: string }) {
  return (
    <div className="p-12 text-center">
      <Trophy className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}