'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Users,
  FolderGit2,
  Rocket,
  Building2,
  Trophy,
  Calendar,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface ExploreViewProps {
  builders: any[]
  projects: any[]
  ventures: any[]
  communities: any[]
  hackathons: any[]
}

export function ExploreView({
  builders,
  projects,
  ventures,
  communities,
  hackathons,
}: ExploreViewProps) {
  const [tab, setTab] = useState<
    'builders' | 'projects' | 'ventures' | 'communities' | 'hackathons'
  >('builders')

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="text-muted-foreground mt-1">
          Discover builders, projects, ventures, and opportunities across DSRT.
        </p>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-1.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'builders', label: `Builders (${builders.length})`, icon: Users },
            { id: 'projects', label: `Projects (${projects.length})`, icon: FolderGit2 },
            { id: 'ventures', label: `Ventures (${ventures.length})`, icon: Rocket },
            { id: 'communities', label: `Communities (${communities.length})`, icon: Building2 },
            { id: 'hackathons', label: `Hackathons (${hackathons.length})`, icon: Trophy },
          ].map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                  tab === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'builders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {builders.map((b) => (
            <Link
              key={b.id}
              href={`/profile/${b.username}`}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4 hover:border-border transition-all"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={b.avatar_url} />
                  <AvatarFallback>{b.full_name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{b.full_name}</p>
                  {b.tagline && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {b.tagline}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {b.brings?.slice(0, 3).map((br: string) => (
                      <span
                        key={br}
                        className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary capitalize"
                      >
                        {br}
                      </span>
                    ))}
                  </div>
                  {b.location && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {b.location}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4 hover:border-border transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-muted capitalize">
                  {p.stage}
                </span>
                {p.is_hiring && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-500/10 text-rose-500">
                    Hiring
                  </span>
                )}
              </div>
              <h3 className="font-bold">{p.title}</h3>
              {p.tagline && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {p.tagline}
                </p>
              )}
              {p.tech_stack && p.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.tech_stack.slice(0, 4).map((t: string) => (
                    <span key={t} className="px-1.5 py-0.5 text-[10px] bg-muted/60 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {tab === 'ventures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ventures.map((v) => (
            <Link
              key={v.id}
              href={`/ventures/${v.slug}`}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4 hover:border-border transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold">{v.name}</h3>
                    {v.is_verified && (
                      <span className="text-primary text-xs">✓</span>
                    )}
                  </div>
                  {v.tagline && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {v.tagline}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="capitalize">{v.stage}</span>
                    <span>•</span>
                    <span>{v.member_count} members</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'communities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {communities.map((c) => (
            <Link
              key={c.id}
              href={`/community/${c.slug}`}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4 hover:border-border transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{c.name}</h3>
                  {c.institutions?.city && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.institutions.city}, {c.institutions.state}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.member_count} members
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'hackathons' && (
        <div className="grid grid-cols-1 gap-3">
          {hackathons.length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No hackathons listed yet.
              </p>
            </div>
          ) : (
            hackathons.map((h) => (
              <div
                key={h.id}
                className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-500 capitalize">
                        {h.status}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-muted capitalize">
                        {h.mode}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg">{h.title}</h3>
                    {h.tagline && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {h.tagline}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {h.start_date && format(new Date(h.start_date), 'MMM d')}
                      </span>
                      {h.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {h.location}
                        </span>
                      )}
                      {h.prize_pool && (
                        <span className="text-amber-500 font-medium">
                          🏆 {h.prize_pool}
                        </span>
                      )}
                      <span>{h.participants?.toLocaleString()} registered</span>
                    </div>
                    {h.themes && h.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {h.themes.map((t: string) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 text-[10px] rounded-full bg-muted"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}