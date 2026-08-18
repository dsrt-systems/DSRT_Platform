'use client'

import { useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { HomeHeader } from './HomeHeader'
import { HomeTabs, type HomeTab } from './HomeTabs'
import { HomeComposerBar } from './HomeComposerBar'
import { HomeFeed } from './HomeFeed'
import { DsrtCocoBanner } from './DsrtCocoBanner'

interface Props {
  currentUser: any
}

export function HomePageV2({ currentUser }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = (searchParams.get('tab') as HomeTab) || 'for-you'
  const [activeTab, setActiveTab] = useState<HomeTab>(tabParam)

  const handleTabChange = useCallback((tab: HomeTab) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/home?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
        <HomeHeader currentUser={currentUser} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 mt-5">
          <main className="min-w-0 space-y-5">
            <HomeTabs active={activeTab} onChange={handleTabChange} />
            <HomeComposerBar currentUser={currentUser} />
            <HomeFeed tab={activeTab} currentUser={currentUser} />
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-[84px]">
              <DsrtCocoBanner />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}