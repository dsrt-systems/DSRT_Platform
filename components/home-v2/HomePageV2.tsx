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
  const tabParam = (searchParams.get('feed') as HomeTab) || 'for-you'
  const [activeTab, setActiveTab] = useState<HomeTab>(tabParam)

  const handleTabChange = useCallback((tab: HomeTab) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('feed', tab)
    router.replace(`/home?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 w-full">
      <div className="w-full px-4 md:px-5 lg:px-6 xl:px-8">
        <HomeHeader currentUser={currentUser} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-4 lg:gap-5 xl:gap-6 mt-4 lg:mt-5 items-start">
          
          <main className="min-w-0 w-full space-y-4">
            <HomeTabs active={activeTab} onChange={handleTabChange} />
            <HomeComposerBar currentUser={currentUser} />
            <HomeFeed tab={activeTab} currentUser={currentUser} />
          </main>

          <aside className="hidden lg:block w-[280px] xl:w-[300px] shrink-0 justify-self-end">
            {/* Increased top offset so it doesn't slide under the new taller header */}
            <div className="sticky top-[100px] w-full">
              <DsrtCocoBanner />
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  )
}