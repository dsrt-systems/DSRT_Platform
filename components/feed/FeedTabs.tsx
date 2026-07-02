'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'global', label: 'Global', desc: 'Everything happening on DSRT' },
  { id: 'community', label: 'My Community', desc: 'From your institutions' },
  { id: 'following', label: 'Following', desc: 'Builders and projects you follow' },
]

export function FeedTabs() {
  const [active, setActive] = useState('global')

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-1.5">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
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