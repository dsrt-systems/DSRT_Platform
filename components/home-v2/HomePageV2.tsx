'use client'

import { useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { HomeHeader } from './HomeHeader'
import { HomeTabs, type HomeTab } from './HomeTabs'
import { HomeComposerBar } from './HomeComposerBar'
import { HomeFeed } from './HomeFeed'
import { DsrtCocoBanner } from './DsrtCocoBanner'
import { HomeRightSidebar } from './HomeRightSidebar'
import { DsrtLayoutWithRail } from '@/components/dsrt'

interface Props {
  currentUser: any
}

export function HomePageV2({ currentUser }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = (searchParams.get('feed') as HomeTab) || 'for-you'
  const [activeTab, setActiveTab] = useState<HomeTab>(tabParam)

  const handleTabChange = useCallback((tab: HomeTab) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('feed', tab)
    router.replace(`/home?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  return (
    <div className="w-full px-4 md:px-6 pb-12">
      <HomeHeader currentUser={currentUser} />

      <DsrtLayoutWithRail
        railBreakpoint="lg"
        className="mt-4"
        rail={
          <div className="space-y-4">
            <DsrtCocoBanner />
            <HomeRightSidebar />
          </div>
        }
      >
        <div className="space-y-4">
          <HomeComposerBar currentUser={currentUser} />
          <div className="sticky top-[116px] z-20 bg-[#05070D]/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            <HomeTabs active={activeTab} onChange={handleTabChange} />
          </div>
          <HomeFeed tab={activeTab} currentUser={currentUser} />
        </div>
      </DsrtLayoutWithRail>
    </div>
  )
}