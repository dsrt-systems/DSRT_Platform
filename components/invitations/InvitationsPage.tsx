'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  Envelope, Buildings, Users, Kanban as FolderKanban, UserPlus, Check, X, Clock,
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'

export function InvitationsPage({ currentUser }: any) {
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'all' | 'organizations' | 'communities' | 'projects' | 'connections'>('all')
  const [data, setData] = useState<{ organizations: any[]; communities: any[]; projects: any[]; connections: any[] }>({
    organizations: [], communities: [], projects: [], connections: [],
  })
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/invitations')
    const d = await res.json()
    setData({
      organizations: d.organizations || [],
      communities: d.communities || [],
      projects: d.projects || [],
      connections: d.connections || [],
    })
    setLoading(false)
  }

  const handle = async (type: string, id: string, action: 'accept' | 'decline') => {
    setProcessingIds(prev => new Set(prev).add(id))
    const res = await fetch('/api/invitations/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitation_type: type, invitation_id: id, action }),
    })
    if (res.ok) {
      toast.success(action === 'accept' ? 'Invitation accepted' : 'Invitation declined')
      // Remove from list
      setData(prev => ({
        ...prev,
        [type + 's']: prev[(type + 's') as keyof typeof prev].filter((i: any) => i.id !== id),
      }))
    } else {
      toast.error('Failed to respond')
    }
    setProcessingIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const total = data.organizations.length + data.communities.length + data.projects.length + data.connections.length

  const tabs = [
    { id: 'all', label: 'All', count: total },
    { id: 'organizations', label: 'Organizations', count: data.organizations.length, icon: Buildings },
    { id: 'communities', label: 'Communities', count: data.communities.length, icon: Users },
    { id: 'projects', label: 'Projects', count: data.projects.length, icon: FolderKanban },
    { id: 'connections', label: 'Connections', count: data.connections.length, icon: UserPlus },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Envelope className="w-5 h-5 text-blue-500" weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
            <p className="text-sm text-muted-foreground">
              {total === 0 ? 'You have no pending invitations' : `${total} pending invitation${total > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
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
              {t.count > 0 && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center',
                  isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />)}
        </div>
      ) : total === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center">
          <Envelope className="w-14 h-14 mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
          <h3 className="font-bold">All caught up</h3>
          <p className="text-sm text-muted-foreground mt-1">No pending invitations right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Organizations */}
          {(activeTab === 'all' || activeTab === 'organizations') && data.organizations.map((inv, i) => (
            <InvitationCard
              key={inv.id}
              type="organization"
              icon={Buildings}
              color="purple"
              title={inv.organizations?.name}
              subtitle="Organization invitation"
              logo={inv.organizations?.logo_url}
              logoName={inv.organizations?.name}
              description={inv.organizations?.description}
              inviter={inv.inviter}
              message={inv.message}
              role={inv.role}
              createdAt={inv.created_at}
              index={i}
              onAccept={() => handle('organization', inv.id, 'accept')}
              onDecline={() => handle('organization', inv.id, 'decline')}
              processing={processingIds.has(inv.id)}
              detailLink={inv.organizations?.slug ? `/organizations/${inv.organizations.slug}` : undefined}
            />
          ))}
          {/* Communities */}
          {(activeTab === 'all' || activeTab === 'communities') && data.communities.map((inv, i) => (
            <InvitationCard
              key={inv.id}
              type="community"
              icon={Users}
              color="blue"
              title={inv.communities?.name}
              subtitle={`${inv.communities?.member_count || 0} members`}
              logo={inv.communities?.cover_url}
              logoName={inv.communities?.name}
              description={inv.communities?.description}
              inviter={inv.inviter}
              message={inv.message}
              role={inv.role}
              createdAt={inv.created_at}
              index={i}
              onAccept={() => handle('community', inv.id, 'accept')}
              onDecline={() => handle('community', inv.id, 'decline')}
              processing={processingIds.has(inv.id)}
              detailLink={inv.communities?.slug ? `/community/${inv.communities.slug}` : undefined}
            />
          ))}
          {/* Projects */}
          {(activeTab === 'all' || activeTab === 'projects') && data.projects.map((inv, i) => (
            <InvitationCard
              key={inv.id}
              type="project"
              icon={FolderKanban}
              color="green"
              title={inv.projects?.name}
              subtitle={`Role: ${inv.role || 'Member'}`}
              logoName={inv.projects?.name}
              description={inv.projects?.description}
              inviter={inv.inviter}
              role={inv.role}
              createdAt={inv.created_at}
              index={i}
              onAccept={() => handle('project', inv.id, 'accept')}
              onDecline={() => handle('project', inv.id, 'decline')}
              processing={processingIds.has(inv.id)}
              detailLink={inv.projects?.slug ? `/projects/${inv.projects.slug}` : undefined}
            />
          ))}
          {/* Connections */}
          {(activeTab === 'all' || activeTab === 'connections') && data.connections.map((inv, i) => (
            <InvitationCard
              key={inv.id}
              type="connection"
              icon={UserPlus}
              color="pink"
              title={inv.requester?.full_name}
              subtitle={inv.requester?.tagline || 'Wants to connect'}
              logo={inv.requester?.avatar_url}
              logoName={inv.requester?.full_name}
              description={inv.message}
              createdAt={inv.created_at}
              index={i}
              onAccept={() => handle('connection', inv.id, 'accept')}
              onDecline={() => handle('connection', inv.id, 'decline')}
              processing={processingIds.has(inv.id)}
              detailLink={inv.requester?.username ? `/profile/${inv.requester.username}` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InvitationCard({
  type, icon: Icon, color, title, subtitle, logo, logoName, description,
  inviter, message, role, createdAt, index, onAccept, onDecline, processing, detailLink,
}: any) {
  const COLOR_MAP: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-500' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-500' },
  }
  const colors = COLOR_MAP[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border rounded-2xl p-4 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Logo */}
        {logo ? (
          <Avatar className="w-12 h-12">
            <AvatarImage src={logo} />
            <AvatarFallback className="text-sm">{logoName?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colors.bg)}>
            <Icon className={cn('w-6 h-6', colors.text)} weight="fill" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              {detailLink ? (
                <Link href={detailLink} className="text-sm font-bold hover:underline truncate block">{title}</Link>
              ) : (
                <p className="text-sm font-bold truncate">{title}</p>
              )}
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider', colors.bg, colors.text)}>
              {type}
            </span>
          </div>

          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">{description}</p>
          )}

          {(inviter || message) && (
            <div className="mt-3 pt-3 border-t border-dashed">
              {inviter && (
                <p className="text-[11px] text-muted-foreground mb-1">
                  Invited by <span className="font-semibold text-foreground">{inviter.full_name}</span>
                </p>
              )}
              {message && (
                <p className="text-xs italic text-muted-foreground">&quot;{message}&quot;</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(createdAt), { addSuffix: false })} ago
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onDecline} disabled={processing} className="h-7 text-xs">
                <X className="w-3 h-3 mr-1" weight="bold" /> Decline
              </Button>
              <Button size="sm" onClick={onAccept} disabled={processing} className="h-7 text-xs">
                <Check className="w-3 h-3 mr-1" weight="bold" /> {processing ? 'Processing...' : 'Accept'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}