'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Rocket,
  Bookmark,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface InvestorDashboardProps {
  profile: any
  watchlist: any[]
  newVentures: any[]
  trending: any[]
  focusVentures: any[]
}

export function InvestorDashboard({
  profile,
  watchlist,
  newVentures,
  trending,
  focusVentures,
}: InvestorDashboardProps) {
  const [tab, setTab] = useState<
    'overview' | 'watchlist' | 'new' | 'trending' | 'focus'
  >('overview')

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-transparent p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-primary" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Investor Dashboard
              </p>
            </div>
            <h1 className="text-3xl font-bold">Welcome, {profile.full_name}</h1>
            <p className="text-muted-foreground mt-1">
              {profile.investor_type || 'Angel Investor'}
              {profile.check_size && ` · ${profile.check_size}`}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/settings?tab=investor">Edit Profile</Link>
          </Button>
        </div>

        {profile.focus_sectors && profile.focus_sectors.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.focus_sectors.map((s: string) => (
              <span
                key={s}
                className="px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Watchlist"
            value={watchlist.length}
            icon={Bookmark}
          />
          <StatCard
            label="Focus Sectors"
            value={profile.focus_sectors?.length || 0}
            icon={Target}
          />
          <StatCard
            label="New This Week"
            value={newVentures.length}
            icon={Rocket}
          />
          <StatCard
            label="Portfolio"
            value={profile.portfolio_count || 0}
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-1.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'watchlist', label: `Watchlist (${watchlist.length})` },
            { id: 'focus', label: `My Focus (${focusVentures.length})` },
            { id: 'new', label: 'New Ventures' },
            { id: 'trending', label: 'Trending' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5">
            <h3 className="font-semibold mb-3">In Your Focus Sectors</h3>
            {focusVentures.slice(0, 5).map((v) => (
              <VentureRow key={v.id} venture={v} />
            ))}
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5">
            <h3 className="font-semibold mb-3">Recently Added</h3>
            {newVentures.slice(0, 5).map((v) => (
              <VentureRow key={v.id} venture={v} />
            ))}
          </div>
        </div>
      )}

      {tab === 'watchlist' && (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5">
          {watchlist.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Your watchlist is empty. Add ventures you want to track.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {watchlist.map((w) => (
                <VentureRow key={w.id} venture={w.startups} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'focus' && (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5">
          {focusVentures.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No ventures match your focus sectors yet. Update your sectors
                in Settings.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {focusVentures.map((v) => (
                <VentureRow key={v.id} venture={v} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'new' && (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5">
          <div className="space-y-2">
            {newVentures.map((v) => (
              <VentureRow key={v.id} venture={v} />
            ))}
          </div>
        </div>
      )}

      {tab === 'trending' && (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5">
          <div className="space-y-2">
            {trending.map((v) => (
              <VentureRow key={v.id} venture={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function VentureRow({ venture }: any) {
  if (!venture) return null
  return (
    <Link
      href={`/ventures/${venture.slug}`}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
        {venture.logo_url ? (
          <img
            src={venture.logo_url}
            alt=""
            className="w-full h-full rounded-xl object-cover"
          />
        ) : (
          <Rocket className="w-4 h-4 text-primary-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm truncate">{venture.name}</p>
          {venture.is_verified && (
            <CheckCircle2 className="w-3 h-3 text-primary" />
          )}
        </div>
        {venture.tagline && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {venture.tagline}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
          <span className="capitalize">{venture.stage}</span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {venture.member_count}
          </span>
          {venture.category?.slice(0, 2).map((c: string) => (
            <span key={c} className="px-1.5 py-0.5 bg-muted/60 rounded">
              {c}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}