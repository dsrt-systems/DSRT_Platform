'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LookingForHeader } from './LookingForHeader'
import { SearchBar } from './SearchBar'
import { LookingForTabs, type TabId } from './LookingForTabs'
import { FiltersPanel, type FilterState } from './FiltersPanel'
import { OpportunityFeed } from './OpportunityFeed'
import { SortDropdown } from './SortDropdown'
import { CompactBanners } from './CompactBanners'
import { ApplicationsTab } from './tabs/ApplicationsTab'
import { SavedTab } from './tabs/SavedTab'
import { SuggestedTab } from './tabs/SuggestedTab'
import { PeopleTab } from './tabs/PeopleTab'
import { CategoriesTab } from './tabs/CategoriesTab'

export function LookingForPageV2() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Default to explore if the URL had 'my-opportunities' left over from old links
  const initialTab = searchParams.get('tab') as TabId
  const validTab = ['explore', 'applications', 'saved', 'suggested', 'people', 'categories'].includes(initialTab) ? initialTab : 'explore'
  
  const [activeTab, setActiveTab] = useState<TabId>(validTab)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recommended')
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [feedLoading, setFeedLoading] = useState(true)

  const [filters, setFilters] = useState<FilterState>({
    category: null, subcategory: null, type: null, experience: null,
    compensation: null, work_mode: null, location: null, time_commitment: null,
    project_length: null, post_age: null, skills: [], min_budget: null, max_budget: null,
  })

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/looking-for?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const goCreate = useCallback(() => router.push('/looking-for/create'), [router])
  const handleCountChange = useCallback((count: number, isLoading: boolean) => {
    setTotalCount(count); setFeedLoading(isLoading)
  }, [])

  const isExplore = activeTab === 'explore'

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-5 md:py-6">
        <LookingForHeader onCreate={goCreate} />

        <div className="mt-5"><CompactBanners /></div>
        <div className="mt-4"><SearchBar value={query} onChange={setQuery} /></div>
        
        <div className="mt-5">
          <LookingForTabs active={activeTab} onChange={handleTabChange} />
        </div>

        {isExplore ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
            <aside className="lg:sticky lg:top-6 h-fit">
              <FiltersPanel filters={filters} onChange={setFilters} />
            </aside>
            <main className="min-w-0 w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[13px] text-zinc-400 font-medium">
                  {feedLoading ? 'Loading opportunities...' : totalCount !== null ? `${totalCount.toLocaleString()} ${totalCount === 1 ? 'opportunity' : 'opportunities'} found` : 'Opportunities'}
                </div>
                <SortDropdown value={sort} onChange={setSort} />
              </div>
              <OpportunityFeed query={query} filters={filters} sort={sort} tab={activeTab} onCountChange={handleCountChange} />
            </main>
          </div>
        ) : (
          <div className="mt-6">
            {activeTab === 'applications' && <ApplicationsTab />}
            {activeTab === 'saved' && <SavedTab />}
            {activeTab === 'suggested' && <SuggestedTab />}
            {activeTab === 'people' && <PeopleTab />}
            {activeTab === 'categories' && (
              <CategoriesTab onCategoryPick={(slug: string) => {
                setActiveTab('explore')
                setFilters(f => ({ ...f, category: slug }))
              }} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}