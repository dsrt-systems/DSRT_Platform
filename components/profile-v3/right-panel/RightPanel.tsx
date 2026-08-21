'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { OverviewTab } from './tabs/OverviewTab'
import { MyWorkTab } from './my-work/MyWorkTab'
import { FoundersProfileTab } from './founder/FoundersProfileTab'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'my-work', label: 'My Work' },
  { id: 'founder', label: "Founder's Profile" },
] as const

type TabId = typeof TABS[number]['id']

interface RightPanelProps {
  profile: any
  isOwner: boolean
  currentUserId: string | null
  onProfileUpdate: (updates: Partial<any>) => void
}

export function RightPanel({
  profile,
  isOwner,
  currentUserId,
  onProfileUpdate,
}: RightPanelProps) {
  const searchParams = useSearchParams()

  const readTabFromUrl = (): TabId => {
    const t = searchParams.get('tab')
    if (t && TABS.some((tab) => tab.id === t)) return t as TabId
    return 'overview'
  }

  const [activeTab, setActiveTab] = useState<TabId>(readTabFromUrl())

  useEffect(() => {
    const t = readTabFromUrl()
    if (t !== activeTab) setActiveTab(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    if (tab === 'overview') url.searchParams.delete('tab')
    else url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }, [])

  return (
    <div className="space-y-4">
      <div className="border-b border-zinc-800/60 -mb-px">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative px-5 py-3 text-[13px] font-semibold transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-white border-white'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300',
              )}
              style={
                activeTab === tab.id
                  ? { boxShadow: '0 1px 8px rgba(255,255,255,0.15)' }
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              profile={profile}
              isOwner={isOwner}
              currentUserId={currentUserId}
              onProfileUpdate={onProfileUpdate}
            />
          )}
          {activeTab === 'my-work' && (
            <MyWorkTab userId={profile.id} isOwner={isOwner} />
          )}
          {activeTab === 'founder' && (
            <FoundersProfileTab
              userId={profile.id}
              isOwner={isOwner}
              profile={profile}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}