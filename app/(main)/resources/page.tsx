'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  MagnifyingGlass, X, ArrowSquareOut, Sparkle, CircleNotch,
  BookOpen, ChartLineUp, CurrencyDollar, Compass, Brain,
  Wrench, Newspaper, Books
} from '@phosphor-icons/react'

interface Resource {
  id: string
  title: string
  provider: string
  category: string
  url: string
  description?: string
  is_hidden_gem?: boolean
  display_order?: number
}

const CATEGORY_ICONS: Record<string, any> = {
  'Articles & Guides': BookOpen,
  'Product & Growth': ChartLineUp,
  'Investor & Fundraising': CurrencyDollar,
  'Operator Playbooks': Compass,
  'Founder Mindset': Brain,
  'Strategy & Thinking': Books,
  'Engineering & Craft': Wrench,
  'Living Resources': Newspaper,
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <CircleNotch size={24} className="animate-spin text-zinc-500" />
      </div>
    }>
      <ResourcesContent />
    </Suspense>
  )
}

function ResourcesContent() {
  const supabase = createClient()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showHiddenGemsOnly, setShowHiddenGemsOnly] = useState(false)

  useEffect(() => {
    const loadResources = async () => {
      const { data } = await supabase
        .from('founder_resources')
        .select('*')
        .order('display_order', { ascending: true })
      if (data) setResources(data)
      setLoading(false)
    }
    loadResources()
  }, [supabase])

  // Group by category
  const categories = useMemo(() => {
    const map = new Map<string, Resource[]>()
    resources.forEach(r => {
      if (!map.has(r.category)) map.set(r.category, [])
      map.get(r.category)!.push(r)
    })
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }))
  }, [resources])

  const hiddenGemCount = resources.filter(r => r.is_hidden_gem).length

  // Filter based on search + category + hidden gem toggle
  const filteredCategories = useMemo(() => {
    let filtered = categories

    if (selectedCategory) {
      filtered = filtered.filter(c => c.name === selectedCategory)
    }

    if (search.trim() || showHiddenGemsOnly) {
      const q = search.toLowerCase().trim()
      filtered = filtered.map(cat => ({
        name: cat.name,
        items: cat.items.filter(item => {
          const matchesSearch = !q || (
            item.title.toLowerCase().includes(q) ||
            item.provider.toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q)
          )
          const matchesGem = !showHiddenGemsOnly || item.is_hidden_gem
          return matchesSearch && matchesGem
        })
      })).filter(cat => cat.items.length > 0)
    }

    return filtered
  }, [categories, selectedCategory, search, showHiddenGemsOnly])

  const totalFiltered = filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0)

  return (
    <div className="flex-1 min-h-screen bg-[#09090b] text-white pb-24 font-sans">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-8">

        {/* Breadcrumb */}
        <div className="mb-6 text-[12px] text-zinc-500">
          <Link href="/ventures" className="hover:text-white transition-colors">Ventures</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">Resource Library</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Sparkle size={22} weight="fill" className="text-zinc-300" />
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-white tracking-tight leading-snug">Resource Library</h1>
              <p className="text-[14px] text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                A curated collection of essays, playbooks, books, and hidden gems from operators, investors, and thinkers.
                Read what actually moves the needle.
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-8 flex items-center gap-6 pb-6 border-b border-white/[0.08]">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">Total</p>
              <p className="text-[20px] font-bold text-white tabular-nums">{resources.length}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">Categories</p>
              <p className="text-[20px] font-bold text-white tabular-nums">{categories.length}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold mb-1 flex items-center gap-1">
                <Sparkle size={9} weight="fill" /> Hidden Gems
              </p>
              <p className="text-[20px] font-bold text-white tabular-nums">{hiddenGemCount}</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or topic..."
              className="w-full h-12 pl-11 pr-11 rounded-xl bg-[#121215] border border-white/[0.08] text-[13.5px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`h-8 px-3 rounded-lg text-[12px] font-semibold transition-all ${
                selectedCategory === null
                  ? 'bg-white text-black'
                  : 'bg-[#121215] text-zinc-400 border border-white/[0.08] hover:border-white/[0.16] hover:text-white'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.name] || BookOpen
              const isActive = selectedCategory === cat.name
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(isActive ? null : cat.name)}
                  className={`h-8 px-3 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-[#121215] text-zinc-400 border border-white/[0.08] hover:border-white/[0.16] hover:text-white'
                  }`}
                >
                  <Icon size={11} weight={isActive ? 'fill' : 'regular'} />
                  {cat.name}
                  <span className={`text-[10px] font-mono ${isActive ? 'text-black/60' : 'text-zinc-600'}`}>
                    {cat.items.length}
                  </span>
                </button>
              )
            })}
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button
              onClick={() => setShowHiddenGemsOnly(!showHiddenGemsOnly)}
              className={`h-8 px-3 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                showHiddenGemsOnly
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#121215] text-zinc-400 border border-white/[0.08] hover:border-amber-500/30 hover:text-amber-400'
              }`}
            >
              <Sparkle size={11} weight="fill" />
              Hidden Gems Only
            </button>
          </div>

          {(search || selectedCategory || showHiddenGemsOnly) && (
            <p className="text-[12px] text-zinc-500 font-mono">
              Showing <span className="text-white font-semibold">{totalFiltered}</span> resource{totalFiltered !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <CircleNotch size={20} className="animate-spin text-zinc-500 mr-2" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Loading library...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-16 border border-white/[0.06] rounded-2xl bg-[#121215]/50 text-center space-y-3">
            <BookOpen size={32} className="text-zinc-600 mx-auto" />
            <h3 className="text-[15px] font-bold text-white">No resources match your filters</h3>
            <p className="text-[13px] text-zinc-500 max-w-sm mx-auto">Try clearing the search or category filter.</p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory(null); setShowHiddenGemsOnly(false); }}
              className="mt-2 px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white rounded-lg text-[12.5px] font-semibold transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredCategories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.name] || BookOpen
              return (
                <section key={cat.name}>
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <Icon size={14} weight="fill" className="text-zinc-300" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[15px] font-bold text-white tracking-tight">{cat.name}</h2>
                      <p className="text-[11.5px] text-zinc-500 mt-0.5">
                        {cat.items.length} resource{cat.items.length !== 1 ? 's' : ''}
                        {cat.items.filter(i => i.is_hidden_gem).length > 0 && (
                          <span className="text-amber-500 ml-2">
                            · {cat.items.filter(i => i.is_hidden_gem).length} hidden gem{cat.items.filter(i => i.is_hidden_gem).length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.items.map((item) => (
                      <FullResourceCard key={item.id} resource={item} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-20 pt-10 border-t border-white/[0.08] text-center space-y-3">
          <p className="text-[13px] text-zinc-500">
            Know a hidden gem we're missing?
          </p>
          <Link
            href="/inbox?compose=suggest-resource"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-semibold text-[12.5px] transition-colors"
          >
            Suggest a resource
          </Link>
        </div>
      </div>
    </div>
  )
}

function FullResourceCard({ resource }: { resource: Resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-5 bg-[#121215] border border-white/[0.06] hover:border-white/[0.16] rounded-xl transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[13.5px] font-bold text-white group-hover:text-zinc-200 transition-colors leading-snug mb-1.5">
            {resource.title}
          </h3>
          <p className="text-[11.5px] text-zinc-400 font-semibold">{resource.provider}</p>
        </div>
        {resource.is_hidden_gem && (
          <span className="text-[8.5px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 shrink-0">
            <Sparkle size={8} weight="fill" />
            Gem
          </span>
        )}
      </div>

      {resource.description && (
        <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-3 mb-4">
          {resource.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 font-bold">
          Read →
        </span>
        <ArrowSquareOut size={12} className="text-zinc-600 group-hover:text-white transition-colors" />
      </div>
    </a>
  )
}