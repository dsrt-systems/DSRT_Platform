'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LookingForHeader } from './LookingForHeader'
import { SearchBar } from './SearchBar'
import { LookingForTabs, type TabId } from './LookingForTabs'
import { FiltersPanel, type FilterState } from './FiltersPanel'
import { OpportunityFeed } from './OpportunityFeed'
import { SortDropdown } from './SortDropdown'
import { MyCategoriesPanel } from './MyCategoriesPanel'
import { RecommendedChips } from './RecommendedChips'
import { MyOpportunitiesTab } from './tabs/MyOpportunitiesTab'
import { ApplicationsTab } from './tabs/ApplicationsTab'
import { SavedTab } from './tabs/SavedTab'
import { SuggestedTab } from './tabs/SuggestedTab'
import { PeopleTab } from './tabs/PeopleTab'
import { CategoriesTab } from './tabs/CategoriesTab'

export function LookingForPageV2() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = (searchParams.get('tab') as TabId) || 'explore'

  const [activeTab, setActiveTab] = useState<TabId>(tabParam)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recommended')
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    subcategory: null,
    type: null,
    experience: null,
    compensation: null,
    work_mode: null,
    location: null,
    time_commitment: null,
    project_length: null,
    post_age: null,
    skills: [],
    min_budget: null,
    max_budget: null,
  })

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/looking-for?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const goCreate = useCallback(() => router.push('/looking-for/create'), [router])

  const isExplore = activeTab === 'explore'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-5 md:py-6">

        {/* Header */}
        <LookingForHeader onCreate={goCreate} />

        {/* Search */}
        <div className="mt-5">
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {/* Tabs */}
        <div className="mt-5">
          <LookingForTabs active={activeTab} onChange={handleTabChange} />
        </div>

        {/* Main layout */}
        {isExplore ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_280px] gap-6">
            {/* Left: Filters */}
            <aside className="lg:sticky lg:top-6 h-fit order-2 lg:order-1">
              <FiltersPanel filters={filters} onChange={setFilters} />
            </aside>

            {/* Center: Feed */}
            <main className="min-w-0 order-1 lg:order-2">
              {/* Feed header */}
              <div className="flex items-center justify-between mb-4">
                <FeedCount filters={filters} query={query} />
                <SortDropdown value={sort} onChange={setSort} />
              </div>

              <OpportunityFeed
                query={query}
                filters={filters}
                sort={sort}
                tab={activeTab}
              />
            </main>

            {/* Right: My Categories + Recommended */}
            <aside className="lg:sticky lg:top-6 h-fit order-3 space-y-4">
              <MyCategoriesPanel
                onCategorySelect={(catSlug) => setFilters(f => ({ ...f, category: catSlug }))}
              />
              <RecommendedChips
                onChipSelect={(skill) => setFilters(f => ({
                  ...f,
                  skills: f.skills.includes(skill) ? f.skills : [...f.skills, skill]
                }))}
              />
            </aside>
          </div>
        ) : (
          <div className="mt-6">
            {activeTab === 'my-opportunities' && <MyOpportunitiesTab onCreate={goCreate} />}
            {activeTab === 'applications' && <ApplicationsTab />}
            {activeTab === 'saved' && <SavedTab />}
            {activeTab === 'suggested' && <SuggestedTab />}
            {activeTab === 'people' && <PeopleTab />}
            {activeTab === 'categories' && <CategoriesTab onCategoryPick={(slug) => {
              setActiveTab('explore')
              setFilters(f => ({ ...f, category: slug }))
            }} />}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Feed count header ───
function FeedCount({ filters, query }: { filters: FilterState; query: string }) {
  const [total, setTotal] = useState<number | null>(null)

  // The OpportunityFeed component will re-fetch and update this via callback
  // For now, show a subtle placeholder
  return (
    <div className="text-[13px] text-zinc-400 font-medium">
      {total !== null
        ? `${total.toLocaleString()} ${total === 1 ? 'opportunity' : 'opportunities'} found`
        : 'Loading opportunities...'}
    </div>
  )
}