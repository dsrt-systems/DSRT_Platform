'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  MagnifyingGlass, X, ArrowSquareOut, Star, CircleNotch,
  BookOpen, ChartLineUp, CurrencyDollar, Compass, Brain,
  Wrench, Newspaper, Books, BookmarkSimple, FolderSimple,
  Rocket, GithubLogo, Globe, FileText, Database, VideoCamera,
  PaintBrush, Link as LinkIcon, Buildings, ArrowRight
} from '@phosphor-icons/react'

interface UnifiedResource {
  id: string
  title: string
  description?: string | null
  provider: string
  category: string
  url: string
  source_type: 'founder' | 'project' | 'venture'
  source_name?: string | null
  source_slug?: string | null
  is_featured?: boolean
  is_saved?: boolean
  created_at: string
  type?: string
}

interface HubResponse {
  resources: UnifiedResource[]
  total: number
  categoryCounts: Record<string, number>
  sourceCounts: { all: number; founder: number; project: number; venture: number }
  savedCount: number
  featuredCount: number
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
  repository: GithubLogo,
  demo: Globe,
  documentation: FileText,
  paper: FileText,
  dataset: Database,
  video: VideoCamera,
  design: PaintBrush,
  website: Globe,
  other: LinkIcon,
}

const SOURCE_META: Record<string, { label: string; icon: any; description: string }> = {
  all: { label: 'All Sources', icon: Books, description: 'Everything across DSRT' },
  founder: { label: 'DSRT Library', icon: BookOpen, description: 'Curated founder resources' },
  project: { label: 'My Projects', icon: FolderSimple, description: 'Technical project resources' },
  venture: { label: 'My Ventures', icon: Rocket, description: 'Venture strategic docs' },
}

type ViewTab = 'all' | 'saved' | 'featured'

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
  const [data, setData] = useState<HubResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<'all' | 'founder' | 'project' | 'venture'>('all')
  const [viewTab, setViewTab] = useState<ViewTab>('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedSource !== 'all') params.set('source', selectedSource)
      if (search.trim()) params.set('q', search.trim())
      if (viewTab === 'saved') params.set('saved', '1')
      if (viewTab === 'featured') params.set('featured', '1')

      const res = await fetch(`/api/resources/hub?${params.toString()}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource, viewTab])

  useEffect(() => {
    const timer = setTimeout(fetchData, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleToggleSave = async (resource: UnifiedResource) => {
    const wasSaved = resource.is_saved

    // Optimistic update
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        resources: prev.resources.map(r =>
          r.id === resource.id && r.source_type === resource.source_type
            ? { ...r, is_saved: !wasSaved }
            : r
        ),
        savedCount: wasSaved ? prev.savedCount - 1 : prev.savedCount + 1,
      }
    })

    try {
      await fetch('/api/resources/save', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resource_id: resource.id,
          source_type: resource.source_type 
        })
      })
      toast.success(wasSaved ? 'Removed from library' : 'Saved to library')
    } catch {
      // Revert
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          resources: prev.resources.map(r =>
            r.id === resource.id && r.source_type === resource.source_type
              ? { ...r, is_saved: wasSaved }
              : r
          ),
          savedCount: wasSaved ? prev.savedCount + 1 : prev.savedCount - 1,
        }
      })
      toast.error('Could not update saved status')
    }
  }

  // Group resources by category
  const grouped = useMemo(() => {
    if (!data?.resources) return []
    const map = new Map<string, UnifiedResource[]>()
    
    let filtered = data.resources
    if (selectedCategory) {
      filtered = filtered.filter(r => r.category === selectedCategory)
    }

    filtered.forEach(r => {
      if (!map.has(r.category)) map.set(r.category, [])
      map.get(r.category)!.push(r)
    })

    return Array.from(map.entries())
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [data, selectedCategory])

  const totalFiltered = grouped.reduce((sum, cat) => sum + cat.items.length, 0)

  return (
    <div className="flex-1 min-h-screen bg-[#09090b] text-white pb-24 font-sans">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-8">

        {/* Breadcrumb */}
        <div className="mb-6 text-[12px] text-zinc-500">
          <Link href="/home" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">Resources</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#121215] border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src="/dsrt-resources-icon.png"
                alt="DSRT Resources Hub"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-white tracking-tight leading-snug">Resources Hub</h1>
              <p className="text-[14px] text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                A unified library of DSRT founder essays, your project technical resources, and venture strategic documents — all in one place.
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-8 flex items-center gap-6 pb-6 border-b border-white/[0.08] flex-wrap">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">Total</p>
              <p className="text-[20px] font-bold text-white tabular-nums">{data?.total || 0}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">DSRT Library</p>
              <p className="text-[20px] font-bold text-white tabular-nums">{data?.sourceCounts.founder || 0}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">Projects</p>
              <p className="text-[20px] font-bold text-white tabular-nums">{data?.sourceCounts.project || 0}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">Ventures</p>
              <p className="text-[20px] font-bold text-white tabular-nums">{data?.sourceCounts.venture || 0}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1 flex items-center gap-1">
                <BookmarkSimple size={9} weight="fill" /> Saved
              </p>
              <p className="text-[20px] font-bold text-white tabular-nums">{data?.savedCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Source Selector */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['all', 'founder', 'project', 'venture'] as const).map(src => {
            const meta = SOURCE_META[src]
            const Icon = meta.icon
            const count = data?.sourceCounts[src] || 0
            const active = selectedSource === src
            return (
              <button
                key={src}
                onClick={() => { setSelectedSource(src); setSelectedCategory(null) }}
                className={`p-4 rounded-xl border transition-all text-left ${
                  active
                    ? 'bg-white/[0.06] border-white/[0.2]'
                    : 'bg-[#121215] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon size={16} weight={active ? 'fill' : 'regular'} className={active ? 'text-white' : 'text-zinc-500'} />
                  <span className={`text-[11px] font-mono ${active ? 'text-white' : 'text-zinc-600'}`}>{count}</span>
                </div>
                <p className={`text-[13px] font-bold ${active ? 'text-white' : 'text-zinc-300'}`}>{meta.label}</p>
                <p className="text-[10.5px] text-zinc-500 mt-0.5 leading-tight">{meta.description}</p>
              </button>
            )
          })}
        </div>

        {/* View Tabs */}
        <div className="mb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setViewTab('all')}
              className={`pb-3 text-[13px] font-semibold transition-colors border-b-2 -mb-px ${
                viewTab === 'all'
                  ? 'text-white border-white'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              All
              <span className="ml-2 text-[10.5px] font-mono text-zinc-600">{data?.total || 0}</span>
            </button>
            <button
              onClick={() => setViewTab('saved')}
              className={`pb-3 text-[13px] font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                viewTab === 'saved'
                  ? 'text-white border-white'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <BookmarkSimple size={12} weight={viewTab === 'saved' ? 'fill' : 'regular'} />
              Saved
              <span className="text-[10.5px] font-mono text-zinc-600">{data?.savedCount || 0}</span>
            </button>
            <button
              onClick={() => setViewTab('featured')}
              className={`pb-3 text-[13px] font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                viewTab === 'featured'
                  ? 'text-white border-white'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <Star size={12} weight={viewTab === 'featured' ? 'fill' : 'regular'} />
              Featured
              <span className="text-[10.5px] font-mono text-zinc-600">{data?.featuredCount || 0}</span>
            </button>
          </div>
        </div>

        {/* Search + Category Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across all sources — titles, authors, topics..."
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
          {data?.categoryCounts && Object.keys(data.categoryCounts).length > 0 && (
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
              {Object.entries(data.categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const Icon = CATEGORY_ICONS[cat] || BookOpen
                  const isActive = selectedCategory === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(isActive ? null : cat)}
                      className={`h-8 px-3 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-white text-black'
                          : 'bg-[#121215] text-zinc-400 border border-white/[0.08] hover:border-white/[0.16] hover:text-white'
                      }`}
                    >
                      <Icon size={11} weight={isActive ? 'fill' : 'regular'} />
                      {cat}
                      <span className={`text-[10px] font-mono ${isActive ? 'text-black/60' : 'text-zinc-600'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
            </div>
          )}

          {(search || selectedCategory) && (
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
        ) : grouped.length === 0 ? (
          <EmptyState viewTab={viewTab} onReset={() => { setSearch(''); setSelectedCategory(null); setViewTab('all') }} />
        ) : (
          <div className="space-y-12">
            {grouped.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.name] || BookOpen
              const featuredInCat = cat.items.filter(i => i.is_featured).length
              return (
                <section key={cat.name}>
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <Icon size={14} weight="fill" className="text-zinc-300" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[15px] font-bold text-white tracking-tight capitalize">{cat.name}</h2>
                      <p className="text-[11.5px] text-zinc-500 mt-0.5">
                        {cat.items.length} resource{cat.items.length !== 1 ? 's' : ''}
                        {featuredInCat > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 text-zinc-400">
                            <Star size={9} weight="fill" />
                            {featuredInCat} featured
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.items.map((item) => (
                      <UnifiedResourceCard
                        key={`${item.source_type}-${item.id}`}
                        resource={item}
                        onToggleSave={() => handleToggleSave(item)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-20 pt-10 border-t border-white/[0.08] text-center space-y-3">
          <p className="text-[13px] text-zinc-500">
            Add resources directly from your project or venture workspaces.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-semibold text-[12.5px] transition-colors"
            >
              <FolderSimple size={12} />
              My Projects
            </Link>
            <Link
              href="/ventures"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-semibold text-[12.5px] transition-colors"
            >
              <Rocket size={12} />
              My Ventures
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function UnifiedResourceCard({
  resource,
  onToggleSave,
}: {
  resource: UnifiedResource
  onToggleSave: () => void
}) {
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleSave()
  }

  const sourceBadge = {
    founder: { label: 'DSRT', icon: BookOpen, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
    project: { label: 'PROJECT', icon: FolderSimple, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
    venture: { label: 'VENTURE', icon: Rocket, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  }[resource.source_type]

  const SourceIcon = sourceBadge.icon

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-5 bg-[#121215] border border-white/[0.06] hover:border-white/[0.16] rounded-xl transition-all relative"
    >
      {/* Save button */}
      <button
        onClick={handleSaveClick}
        className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
          resource.is_saved
            ? 'bg-white/[0.08] text-white'
            : 'bg-transparent text-zinc-600 hover:bg-white/[0.06] hover:text-white'
        }`}
        aria-label={resource.is_saved ? 'Remove from saved' : 'Save to library'}
      >
        <BookmarkSimple size={13} weight={resource.is_saved ? 'fill' : 'regular'} />
      </button>

      {/* Source badge */}
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider mb-3 ${sourceBadge.color}`}>
        <SourceIcon size={9} weight="fill" />
        {sourceBadge.label}
      </div>

      <div className="pr-8 mb-3">
        <div className="flex items-start gap-1.5 mb-1.5">
          <h3 className="text-[13.5px] font-bold text-white group-hover:text-zinc-200 transition-colors leading-snug">
            {resource.title}
          </h3>
          {resource.is_featured && (
            <Star size={11} weight="fill" className="text-zinc-400 shrink-0 mt-0.5" />
          )}
        </div>
        <p className="text-[11.5px] text-zinc-400 font-semibold">
          {resource.source_type !== 'founder' && resource.source_slug ? (
            <Link
              href={`/${resource.source_type === 'project' ? 'projects' : 'ventures'}/${resource.source_slug}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-white transition-colors"
            >
              {resource.provider}
            </Link>
          ) : (
            resource.provider
          )}
        </p>
      </div>

      {resource.description && (
        <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-3 mb-4">
          {resource.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 font-bold">
          Open →
        </span>
        <ArrowSquareOut size={12} className="text-zinc-600 group-hover:text-white transition-colors" />
      </div>
    </a>
  )
}

function EmptyState({ viewTab, onReset }: { viewTab: ViewTab; onReset: () => void }) {
  return (
    <div className="p-16 border border-white/[0.06] rounded-2xl bg-[#121215]/50 text-center space-y-3">
      {viewTab === 'saved' ? (
        <>
          <BookmarkSimple size={32} className="text-zinc-600 mx-auto" />
          <h3 className="text-[15px] font-bold text-white">Nothing saved yet</h3>
          <p className="text-[13px] text-zinc-500 max-w-sm mx-auto">
            Bookmark resources by clicking the save icon on any card. They'll appear here for quick access.
          </p>
        </>
      ) : (
        <>
          <BookOpen size={32} className="text-zinc-600 mx-auto" />
          <h3 className="text-[15px] font-bold text-white">No resources found</h3>
          <p className="text-[13px] text-zinc-500 max-w-sm mx-auto">
            Try clearing your filters or switching to a different source.
          </p>
        </>
      )}
      <button
        onClick={onReset}
        className="mt-2 px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white rounded-lg text-[12.5px] font-semibold transition-colors"
      >
        Reset filters
      </button>
    </div>
  )
}