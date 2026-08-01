'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'global', label: 'Global' },
  { id: 'community', label: 'Community' },
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
    <div className="skeu-tab-bar flex items-center gap-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setTab(tab.id)}
          className={cn(
            'skeu-tab flex-1 text-center',
            active === tab.id && 'active'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}