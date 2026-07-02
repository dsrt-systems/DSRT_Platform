'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Users,
  FolderGit2,
  Rocket,
  FileText,
  UserPlus,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommunityViewProps {
  community: any
  members: any[]
  projects: any[]
  ventures: any[]
  isMember: boolean
  currentUserId?: string
}

export function CommunityView({
  community,
  members,
  projects,
  ventures,
  isMember,
  currentUserId,
}: CommunityViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'feed' | 'projects' | 'ventures' | 'members'>(
    'feed'
  )
  const [joining, setJoining] = useState(false)

  const handleJoin = async () => {
    if (!currentUserId) return
    setJoining(true)
    await supabase.from('community_members').insert({
      community_id: community.id,
      user_id: currentUserId,
      role: 'member',
    })
    setJoining(false)
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
        {community.cover_url && (
          <div className="h-32 md:h-48 bg-muted overflow-hidden">
            <img
              src={community.cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {community.name}
                  </h1>
                  {community.is_verified && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </div>
                {community.institutions?.city && (
                  <p className="text-muted-foreground mt-1">
                    {community.institutions.city},{' '}
                    {community.institutions.state}
                  </p>
                )}
                {community.description && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                    {community.description}
                  </p>
                )}
              </div>
            </div>

            <div>
              {!isMember && (
                <Button onClick={handleJoin} disabled={joining}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {joining ? 'Joining...' : 'Join Community'}
                </Button>
              )}
              {isMember && (
                <Button variant="outline" disabled>
                  ✓ Member
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 pt-3 border-t border-border/40">
            <div>
              <span className="text-2xl font-bold">{community.member_count}</span>
              <span className="text-sm text-muted-foreground ml-1.5">
                members
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold">{projects.length}</span>
              <span className="text-sm text-muted-foreground ml-1.5">
                projects
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold">{ventures.length}</span>
              <span className="text-sm text-muted-foreground ml-1.5">
                ventures
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-1.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'feed', label: 'Feed', icon: FileText },
            { id: 'projects', label: `Projects (${projects.length})`, icon: FolderGit2 },
            { id: 'ventures', label: `Ventures (${ventures.length})`, icon: Rocket },
            { id: 'members', label: `Members (${members.length})`, icon: Users },
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

      {tab === 'feed' && (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Community feed coming soon. Members will share posts, build logs,
            and discussions here.
          </p>
        </div>
      )}

      {tab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.length === 0 ? (
            <div className="md:col-span-2 rounded-2xl border border-border/40 bg-card/40 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No projects from this community yet.
              </p>
            </div>
          ) : (
            projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.slug}`}
                className="rounded-2xl border border-border/40 bg-card/40 p-4 hover:border-border transition-all"
              >
                <h3 className="font-bold">{p.title}</h3>
                {p.tagline && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {p.tagline}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'ventures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ventures.length === 0 ? (
            <div className="md:col-span-2 rounded-2xl border border-border/40 bg-card/40 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No ventures from this community yet.
              </p>
            </div>
          ) : (
            ventures.map((v) => (
              <Link
                key={v.id}
                href={`/ventures/${v.slug}`}
                className="rounded-2xl border border-border/40 bg-card/40 p-4 hover:border-border transition-all"
              >
                <h3 className="font-bold">{v.name}</h3>
                {v.tagline && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {v.tagline}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map((m) => (
              <Link
                key={m.id}
                href={`/profile/${m.users?.username}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={m.users?.avatar_url} />
                  <AvatarFallback>
                    {m.users?.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{m.users?.full_name}</p>
                  {m.users?.tagline && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {m.users.tagline}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}