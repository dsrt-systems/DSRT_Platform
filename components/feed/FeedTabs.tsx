'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'global', label: 'Global' },
  { id: 'community', label: 'My Community' },
  { id: 'following', label: 'Following' },
]

export function FeedTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('tab') || 'global'

  const setTab = (id: string) => {
    if (id === 'global') {
      router.push('/feed')
    } else {
      router.push(`/feed?tab=${id}`)
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-1.5">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              'flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              active === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}