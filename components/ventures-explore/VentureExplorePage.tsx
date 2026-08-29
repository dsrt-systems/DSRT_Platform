'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlass, Sparkle, CircleNotch, Compass } from '@phosphor-icons/react'
import { FeaturedCarousel } from './FeaturedCarousel'
import { FilterSidebar } from './FilterSidebar'
import { VentureCard } from './VentureCard'
import { ExploreFeedModule, ExploreFilterState } from '@/lib/venture-explore/types'

export function VentureExplorePage() {
  const [banners, setBanners] = useState<any[]>([])
  const [modules, setModules] = useState<ExploreFeedModule[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'recommended' | 'all' | 'rising' | 'new' | 'following'>('recommended')

  // Search & Filter State
  const [filterState, setFilterState] = useState<ExploreFilterState>({
    search: '',
    domains: [],
    stages: [],
    is_verified: false,
    is_hiring: false
  })

  // Load Banners
  useEffect(() => {
    fetch('/api/ventures/explore/banners')
      .then(r => r.json())
      .then(d => setBanners(d.banners || []))
      .catch(() => {})
  }, [])

  // Load Feed Modules
  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterState.search) params.set('search', filterState.search)
      if (filterState.domains?.length) params.set('domains', filterState.domains.join(','))
      if (filterState.stages?.length) params.set('stages', filterState.stages.join(','))
      if (filterState.is_verified) params.set('is_verified', 'true')
      if (filterState.is_hiring) params.set('is_hiring', 'true')

      const res = await fetch(`/api/ventures/explore/feed?${params.toString()}`)
      const data = await res.json()
      setModules(data.modules || [])
    } catch (e) {
      console.error('Failed to load explore feed:', e)
    } finally {
      setLoading(false)
    }
  }, [filterState])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleClearFilters = () => {
    setFilterState({
      search: '',
      domains: [],
      stages: [],
      is_verified: false,
      is_hiring: false
    })
  }

  const handleCardDismiss = (ventureId: string) => {
    setModules(prev =>
      prev.map(mod => ({
        ...mod,
        items: mod.items.filter(item => item.id !== ventureId)
      }))
    )
  }

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* 1. Header Subline */}
      <div>
        <h2 className="text-[22px] font-bold text-white tracking-tight">Explore ventures</h2>
        <p className="text-[13.5px] text-zinc-400 mt-1">
          Discover companies, products, builders and ideas across every industry.
        </p>
      </div>

      {/* 2. Intelligent Search Bar */}
      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={filterState.search || ''}
          onChange={(e) => setFilterState({ ...filterState, search: e.target.value })}
          placeholder="Search ventures, founders, robotics, marine automation, biotech, food startups..."
          className="w-full h-11 pl-11 pr-16 rounded-xl bg-[#121215] border border-white/[0.08] text-[13.5px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors shadow-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono text-zinc-400">
          ⌘ K
        </div>
      </div>

      {/* 3. Discovery Mode Bar */}
      <div className="flex items-center gap-6 border-b border-white/[0.08] pb-3 overflow-x-auto scrollbar-hide">
        {[
          { id: 'recommended', label: 'Recommended' },
          { id: 'all', label: 'All Ventures' },
          { id: 'rising', label: 'Rising' },
          { id: 'new', label: 'New' },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveTab(mode.id as any)}
            className={`text-[13.5px] font-semibold whitespace-nowrap transition-colors relative ${
              activeTab === mode.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {mode.label}
            {activeTab === mode.id && (
              <span className="absolute left-0 right-0 -bottom-3 h-0.5 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 4. Rotating 5-Banner Carousel */}
      <FeaturedCarousel banners={banners} />

      {/* 5. Discovery Workspace (Filter Rail + Feed) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start pt-4">
        
        {/* Left: Filter Sidebar */}
        <FilterSidebar
          filters={filterState}
          onFilterChange={setFilterState}
          onClearFilters={handleClearFilters}
        />

        {/* Right: Venture Discovery Feed */}
        <div className="flex-1 w-full min-w-0 space-y-10">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500 space-y-3">
              <CircleNotch size={24} className="animate-spin" />
              <p className="text-[12.5px] font-mono">Curating global venture feed...</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="p-12 border border-white/[0.06] rounded-2xl bg-[#121215]/50 text-center space-y-3">
              <Compass size={32} className="text-zinc-600 mx-auto" />
              <h3 className="text-[15px] font-bold text-white">No matching ventures found</h3>
              <p className="text-[13px] text-zinc-500 max-w-sm mx-auto">
                Try adjusting your search criteria or domain filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white rounded-lg text-[12.5px] font-semibold transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            modules.map((mod) => (
              <div key={mod.id} className="space-y-4">
                <div>
                  <h3 className="text-[16px] font-bold text-white tracking-tight">{mod.title}</h3>
                  {mod.subtitle && <p className="text-[12.5px] text-zinc-500 mt-0.5">{mod.subtitle}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {mod.items.map((venture) => (
                    <VentureCard
                      key={venture.id}
                      venture={venture}
                      onNotInterested={handleCardDismiss}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}