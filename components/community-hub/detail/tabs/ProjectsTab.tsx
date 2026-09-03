'use client'

import Link from 'next/link'
import { FolderKanban, ArrowUpRight } from 'lucide-react'
import { SectionHeader, EmptyState, LoadingState } from '@/components/kernel-ui'
import type { CommunityDetail } from '@/hooks/useCommunityDetail'
import { useCommunityProjectsRef } from '@/hooks/useCommunityDetail'

const REL_LABEL: Record<string, string> = {
  FEATURED: 'Featured',
  CREATED_BY_MEMBER: 'Built by a member',
  BUILT_WITHIN: 'Built within community',
  CONTEST_ENTRY: 'Contest entry',
  PARTNER: 'Partner',
  SUPPORTED: 'Supported',
}

export function ProjectsTab({ detail }: { detail: CommunityDetail }) {
  const { items, loading } = useCommunityProjectsRef(detail.community.slug)

  if (loading) return <LoadingState label="Loading projects…" />

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <EmptyState
          icon={FolderKanban}
          title="No projects linked yet"
          description="Members can share their projects here so the whole community sees what's being built."
        />
      </div>
    )
  }

  return (
    <section>
      <SectionHeader title="Projects" variant="mono" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it: any) => (
          <Link
            key={it.project.id}
            href={`/projects/${it.project.slug}`}
            className="group rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] hover:border-white/[0.12] transition-colors p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">
                {REL_LABEL[it.relationship_type] || it.relationship_type}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" strokeWidth={1.75} />
            </div>
            <p className="mt-2 text-[14px] font-semibold text-white truncate">{it.project.name || 'Untitled project'}</p>
            {it.project.tagline && (
              <p className="mt-1 text-[12.5px] text-white/60 line-clamp-2 leading-relaxed">
                {it.project.tagline}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}