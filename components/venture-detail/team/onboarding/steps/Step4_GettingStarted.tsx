'use client'

import Link from 'next/link'
import {
  BookOpen, Package, ChartLineUp, Newspaper,
  UsersThree, Question, ArrowRight
} from '@phosphor-icons/react'

interface Props {
  venture: any
  membership: any
}

export function Step4_GettingStarted({ venture, membership }: Props) {
  const permissions = Array.isArray(membership.permissions) ? membership.permissions : []

  const resources = [
    {
      id: 'overview',
      icon: Question,
      title: 'Venture Overview',
      description: 'Read the mission, vision, and current focus',
      href: `/ventures/${venture.slug}?tab=overview`,
      required: true
    },
    {
      id: 'documents',
      icon: BookOpen,
      title: 'Knowledge Base',
      description: 'Access team documents, guidelines, and references',
      href: `/ventures/${venture.slug}?tab=documents`,
      required: permissions.includes('manage_documents') || permissions.includes('view_venture')
    },
    {
      id: 'products',
      icon: Package,
      title: 'Products',
      description: 'Explore what the team is building',
      href: `/ventures/${venture.slug}?tab=products`,
      required: true
    },
    {
      id: 'updates',
      icon: Newspaper,
      title: 'Recent Updates',
      description: 'Catch up on team announcements and progress',
      href: `/ventures/${venture.slug}?tab=updates`,
      required: true
    },
    {
      id: 'team',
      icon: UsersThree,
      title: 'Team Graph',
      description: 'Explore the full organizational structure',
      href: `/ventures/${venture.slug}?tab=team&section=graph`,
      required: true
    },
    {
      id: 'growth',
      icon: ChartLineUp,
      title: 'Growth Metrics',
      description: 'See how the venture is performing',
      href: `/ventures/${venture.slug}?tab=growth`,
      required: true
    },
  ]

  const visible = resources.filter(r => r.required)

  return (
    <div className="space-y-6">

      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
          Get Oriented
        </p>
        <h2 className="text-[24px] font-bold text-white">Start Here</h2>
        <p className="text-[13px] text-zinc-400 mt-1">
          These are the most important places to explore first.
        </p>
      </div>

      <div className="space-y-2">
        {visible.map(r => {
          const Icon = r.icon
          return (
            <Link
              key={r.id}
              href={r.href}
              target="_blank"
              className="block bg-[#121215] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] rounded-xl p-4 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-zinc-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-white">{r.title}</p>
                  <p className="text-[11.5px] text-zinc-500 mt-0.5">{r.description}</p>
                </div>
                <ArrowRight size={14} className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center">
        <p className="text-[11.5px] text-zinc-500 leading-relaxed">
          You can come back to onboarding anytime. All venture sections are always accessible
          from your Team workspace.
        </p>
      </div>
    </div>
  )
}