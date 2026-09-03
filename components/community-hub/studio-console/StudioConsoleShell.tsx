'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StudioShell, LoadingState, ForbiddenState } from '@/components/kernel-ui'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Mail,
  Shield,
  ScrollText,
  Settings,
  History,
  MessageSquare,
} from 'lucide-react'
import { useCommunityDetail } from '@/hooks/useCommunityDetail'

interface Props {
  slug: string
  activeKey:
    | 'overview'
    | 'members'
    | 'applications'
    | 'invitations'
    | 'roles'
    | 'rules'
    | 'settings'
    | 'audit'
    | 'moderation'
    | 'appeals'
  children: React.ReactNode
}

export function StudioConsoleShell({ slug, activeKey, children }: Props) {
  const router = useRouter()
  const { data, loading, error } = useCommunityDetail(slug)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [invitationCount, setInvitationCount] = useState<number>(0)

  useEffect(() => {
    if (!data) return
    // Prefetch counts for the sidebar badges
    fetch(`/api/v1/community/${slug}/studio/overview`)
      .then((r) => r.json())
      .then((j) => {
        setPendingCount(j?.data?.counts?.pending_applications ?? 0)
        setInvitationCount(j?.data?.counts?.pending_invitations ?? 0)
      })
      .catch(() => {})
  }, [slug, data])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 text-white flex items-center justify-center">
        <LoadingState label="Loading Studio…" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-0 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <ForbiddenState
            title="Studio unavailable"
            description="We could not load Studio for this community."
            actionLabel="Back to community"
            actionHref={`/community/${slug}`}
          />
        </div>
      </div>
    )
  }

  const caps = data.capabilities
  if (!caps.is_admin && !caps.is_owner && !caps.is_moderator) {
    return (
      <div className="min-h-screen bg-surface-0 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <ForbiddenState
            title="You do not have access to Studio"
            description="Only admins, moderators, and owners can open the Community Studio."
            actionLabel="Back to community"
            actionHref={`/community/${slug}`}
          />
        </div>
      </div>
    )
  }

  const base = `/community/${slug}/studio`

  const navGroups = [
    {
      label: 'Command Center',
      items: [
        { label: 'Overview', href: base, icon: LayoutDashboard },
      ],
    },
    {
      label: 'People',
      items: [
        { label: 'Members', href: `${base}/members`, icon: Users },
        { label: 'Applications', href: `${base}/applications`, icon: UserCheck, badge: pendingCount || undefined },
        { label: 'Invitations', href: `${base}/invitations`, icon: Mail, badge: invitationCount || undefined },
        { label: 'Roles & Permissions', href: `${base}/roles`, icon: Shield },
      ],
    },
    {
      label: 'Governance',
      items: [
        { label: 'Rules', href: `${base}/rules`, icon: ScrollText },
        { label: 'Moderation', href: `${base}/moderation`, icon: Shield },
        { label: 'Appeals', href: `${base}/moderation/appeals`, icon: MessageSquare },
        { label: 'Audit log', href: `${base}/audit`, icon: History },
      ],
    },
    {
      label: 'Configuration',
      items: [
        { label: 'Settings', href: `${base}/settings`, icon: Settings },
      ],
    },
  ]

  return (
    <StudioShell
      title={data.community.name}
      subtitle="Community Studio"
      exitHref={`/community/${slug}`}
      exitLabel="Back to community"
      navGroups={navGroups}
    >
      {children}
    </StudioShell>
  )
}