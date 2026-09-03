'use client'

import Link from 'next/link'
import { SectionHeader, SkeletonRows, EmptyState } from '@/components/kernel-ui'
import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/utils'

interface Category {
  category: string
  count: number
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  technology: 'Technology',
  research: 'Research',
  design: 'Design',
  entrepreneurship: 'Entrepreneurship',
  engineering: 'Engineering',
  academic: 'Academic',
  creative: 'Creative',
  community: 'Community',
  robotics: 'Robotics',
  ai: 'AI & Machine Learning',
  hardware: 'Hardware',
  software: 'Software',
  'open-source': 'Open Source',
}

function label(cat: string) {
  return CATEGORY_LABELS[cat] ||
    cat.split(/[-_]/).map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ')
}

export function CategoriesGrid() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/community/discover/categories')
      .then((r) => r.json())
      .then((json) => setItems(json?.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section>
        <SectionHeader title="Categories" variant="mono" />
        <SkeletonRows count={2} />
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section>
        <SectionHeader title="Categories" variant="mono" />
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <EmptyState variant="compact" title="No categories yet" />
        </div>
      </section>
    )
  }

  return (
    <section>
      <SectionHeader title="Categories" variant="mono" />
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {items.map((c) => (
          <Link
            key={c.category}
            href={`/community?category=${encodeURIComponent(c.category)}`}
            className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-colors p-3.5 flex flex-col gap-1"
          >
            <p className="text-[13px] text-white font-medium truncate">
              {label(c.category)}
            </p>
            <p className="text-[11px] font-mono uppercase tracking-wider text-white/40">
              {formatNumber(c.count)} {c.count === 1 ? 'community' : 'communities'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}