'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import {
  MagnifyingGlass, X, Plus, Play, Pause,
  Pencil, FolderSimple, Compass, Heart, Briefcase,
  Rocket, Lightning, UsersThree, ArrowRight, Sparkle
} from '@phosphor-icons/react'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Venture {
  id: string
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  logo_url?: string | null
  cover_url?: string | null
  stage?: string
  status?: string
  industry?: string | null
  sector?: string | null
  venture_type?: string | null
  venture_number?: string | null
  follower_count: number
  view_count: number
  is_verified: boolean
  is_hiring: boolean
  seeking_investment: boolean
  seeking_cofounder: boolean
  last_activity_at: string
  updated_at: string
  created_at: string
  team_count?: number
  open_roles_count?: number
}

interface DomainChip {
  name: string
  slug: string
  category: string
  aliases?: string[]
}

interface Community {
  id: string
  name: string
  slug: string
  member_count: number
}

interface VentureType {
  key: string
  label: string
}

const TABS = [
  { id: 'my-ventures', label: 'My Ventures', icon: FolderSimple },
  { id: 'explore',     label: 'Explore',     icon: Compass },
  { id: 'following',   label: 'Following',   icon: Heart },
  { id: 'applications', label: 'Applications', icon: Briefcase },
]

type TabId = 'my-ventures' | 'explore' | 'following' | 'applications'

const SORT_OPTIONS = [
  { key: 'recommended', label: 'For you' },
  { key: 'newest', label: 'Newest' },
  { key: 'most_viewed', label: 'Most viewed' },
  { key: 'trending', label: 'Trending' },
]

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea', mvp: 'MVP', beta: 'Beta', launched: 'Launched',
  scaling: 'Scaling', active: 'Active', building: 'Building',
}

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (s < 1) return 'now'
  if (s < 60) return s + 'm'
  const h = Math.floor(s / 60)
  if (h < 24) return h + 'h'
  const days = Math.floor(h / 24)
  if (days < 7) return days + 'd'
  return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

// ═══════════════════════════════════════════════════════════════
// FEATURED BANNER SLIDER — wider, full-length
// ═══════════════════════════════════════════════════════════════

interface Banner {
  id: string
  title: string
  subtitle: string
  imageUrl?: string
  gradient?: string
  ctaHref?: string
  ctaLabel?: string
}

function FeaturedBanner({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const DURATION = 6000

  const advance = useCallback(() => {
    setIndex(i => (i + 1) % banners.length)
  }, [banners.length])

  useEffect(() => {
    if (paused || banners.length <= 1) return
    intervalRef.current = setTimeout(advance, DURATION)
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current) }
  }, [index, paused, advance, banners.length])

  if (banners.length === 0) return null

  const current = banners[index]

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/[0.08] group w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[240px] md:h-[280px] overflow-hidden w-full">
        {current.imageUrl ? (
          <img
            src={current.imageUrl}
            alt={current.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : null}

        <div
          className="absolute inset-0"
          style={{
            background: current.gradient || 'linear-gradient(135deg, #2d1b4e 0%, #1a1030 50%, #0d0b1f 100%)',
            zIndex: current.imageUrl ? -1 : 0,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <Sparkle size={22} weight="fill" className="text-white/90 mb-3" />
          <h3 className="text-[18px] md:text-[22px] font-bold text-white tracking-tight mb-1.5 drop-shadow-lg">
            {current.title}
          </h3>
          <p className="text-[12.5px] md:text-[13px] text-white/85 max-w-md drop-shadow">
            {current.subtitle}
          </p>
          {current.ctaHref && current.ctaLabel && (
            <Link
              href={current.ctaHref}
              className="mt-4 inline-flex items-center h-9 px-5 rounded-md bg-white text-black text-[13px] font-bold hover:bg-white/90 shadow-lg"
            >
              {current.ctaLabel}
            </Link>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={
                'h-1 rounded-full transition-all ' +
                (i === index ? 'w-6 bg-white' : 'w-1 bg-white/40 hover:bg-white/60')
              }
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setPaused(p => !p)}
        className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center text-white opacity-70 hover:opacity-100 transition-opacity"
      >
        {paused ? <Play size={9} weight="fill" /> : <Pause size={9} weight="fill" />}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VENTURE CARD
// ═══════════════════════════════════════════════════════════════

function VentureCard({ venture, onClick }: { venture: Venture; onClick: () => void }) {
  const stage = STAGE_LABELS[venture.stage || 'idea'] || venture.stage || 'Idea'

  const handleClick = () => {
    fetch('/api/explore/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'click',
        entity_type: 'venture',
        entity_id: venture.id,
      }),
    }).catch(() => {})
    onClick()
  }

  return (
    <div
      onClick={handleClick}
      className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="relative h-[180px] bg-zinc-900 overflow-hidden">
        {venture.cover_url || venture.logo_url ? (
          <img
            src={venture.cover_url || venture.logo_url || ''}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <span className="text-6xl font-bold text-white/20">{venture.name?.charAt(0)}</span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 backdrop-blur border border-white/10 text-yellow-300">
            <span className="w-1 h-1 rounded-full bg-yellow-400" /> {stage.toUpperCase()}
          </span>
        </div>
        {venture.is_verified && (
          <span className="absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/70 backdrop-blur border border-white/10 text-white/85">
            Verified
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="text-[15px] font-bold text-white leading-tight">{venture.name}</h3>
          {venture.venture_number && (
            <p className="text-[10.5px] text-white/40 font-mono mt-0.5">{venture.venture_number}</p>
          )}
        </div>

        <p className="text-[13px] text-white/60 line-clamp-2 mb-3 leading-relaxed flex-1">
          {venture.tagline || venture.description || 'No description yet.'}
        </p>

        <div className="flex items-center gap-4 text-[11.5px] text-white/50 pt-2 border-t border-white/[0.05]">
          <span className="inline-flex items-center gap-1">
            <UsersThree size={11} weight="regular" /> {venture.team_count || 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart size={11} weight="regular" /> {venture.follower_count || 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <Lightning size={11} weight="regular" /> {venture.open_roles_count || 0}
          </span>
          <span className="flex-1" />
          <span className="text-white/35">Updated {timeAgo(venture.last_activity_at || venture.updated_at)}</span>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/[0.05] flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {venture.is_hiring && (
            <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-white/70">Hiring</span>
          )}
          {venture.seeking_investment && (
            <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-white/70">Raising</span>
          )}
        </div>
        <button className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-white bg-white/[0.08] border border-white/[0.1] hover:bg-white/[0.15] px-2.5 h-7 rounded-md transition-colors">
          Open <ArrowRight size={10} weight="bold" />
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// START NEW VENTURE CARD
// ═══════════════════════════════════════════════════════════════

function StartNewVentureCard() {
  return (
    <Link
      href="/ventures/new"
      className="group rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.01] hover:border-white/[0.25] hover:bg-white/[0.03] transition-all overflow-hidden flex flex-col items-center justify-center min-h-[380px] p-6 text-center"
    >
      <div className="w-14 h-14 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mb-4 group-hover:bg-white/[0.1] transition-colors">
        <Plus size={22} weight="bold" className="text-white/80" />
      </div>
      <h3 className="text-[15px] font-bold text-white mb-1">Start a new venture</h3>
      <p className="text-[12px] text-white/45">Turn your next idea into reality</p>
    </Link>
  )
}

// ═══════════════════════════════════════════════════════════════
// EDITABLE PREFERENCES CHIP LIST — with proper truncation
// ═══════════════════════════════════════════════════════════════

function EditablePreferences({
  items,
  editing,
  onRemove,
  onAdd,
  placeholder,
  suggestionSource,
  emptyText,
}: {
  items: string[]
  editing: boolean
  onRemove: (item: string) => void
  onAdd: (item: string | any) => void  // accepts string or full community object
  placeholder: string
  suggestionSource: 'domains' | 'communities'
  emptyText: string
}) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])

  useEffect(() => {
    if (!input || input.length < 1) { setSuggestions([]); return }
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const url = suggestionSource === 'domains'
          ? '/api/ventures/domains?q=' + encodeURIComponent(input) + '&limit=10'
          : '/api/community/search?q=' + encodeURIComponent(input) + '&limit=10'
        const res = await fetch(url)
        const data = await res.json()
        if (!cancelled) {
          const list = suggestionSource === 'domains' ? (data.domains || []) : (data.communities || [])
          setSuggestions(list)
        }
      } catch {}
    }, 150)
    return () => { cancelled = true; clearTimeout(t) }
  }, [input, suggestionSource])

  if (items.length === 0 && !editing) {
    return <p className="text-[12px] text-white/40 text-center py-4 leading-relaxed">{emptyText}</p>
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5 w-full">
        {items.map(c => (
          <span
            key={c}
            title={c}
            className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded bg-white/[0.06] border border-white/[0.1] text-[11.5px] text-white/85 font-medium max-w-full min-w-0 overflow-hidden"
          >
            <span className="truncate min-w-0" style={{ maxWidth: '200px' }}>{c}</span>
            {editing && (
              <button
                onClick={() => onRemove(c)}
                className="w-4 h-4 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] flex-shrink-0"
              >
                <X size={8} weight="bold" />
              </button>
            )}
          </span>
        ))}
      </div>
      {editing && (
        <div className="relative mt-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && input.trim()) {
                onAdd(input.trim())
                setInput('')
                setSuggestions([])
              }
            }}
            placeholder={placeholder}
            className="w-full h-8 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.1] text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.2]"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border border-white/[0.1] bg-[#0f0f18] shadow-xl z-20">
              {suggestions.map((s: any) => (
                <button
                  key={s.slug || s.id}
                  onClick={() => {
                    // For communities, pass full object; for domains, pass name only
                    onAdd(suggestionSource === 'communities' ? s : s.name)
                    setInput('')
                    setSuggestions([])
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-[12px] text-white/85 hover:bg-white/[0.04]"
                >
                  <span>{s.name}</span>
                  {s.member_count !== undefined && suggestionSource === 'communities' && (
                    <span className="text-[10px] text-white/40 ml-2">{s.member_count} members</span>
                  )}
                  {s.category && suggestionSource === 'domains' && (
                    <span className="text-[10px] text-white/40 ml-2">{s.category}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// VENTURE TYPES SIDEBAR SECTION
// ═══════════════════════════════════════════════════════════════

function VentureTypesSection({
  types,
  activeType,
  onSelect,
}: {
  types: VentureType[]
  activeType: string
  onSelect: (key: string) => void
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-white">Venture Type</h3>
        {activeType !== 'all' && (
          <button
            onClick={() => onSelect('all')}
            className="text-[10.5px] font-semibold text-white/50 hover:text-white inline-flex items-center gap-0.5"
          >
            <X size={9} weight="bold" /> Clear
          </button>
        )}
      </div>
      <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
        Filter recommendations by entity type.
      </p>

      {types.length === 0 ? (
        <p className="text-[12px] text-white/35 text-center py-3">Loading types...</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSelect('all')}
            className={
              'text-[11px] font-semibold h-6 px-2 rounded transition-colors ' +
              (activeType === 'all'
                ? 'bg-white text-black'
                : 'bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white hover:border-white/[0.15]')
            }
          >
            All
          </button>
          {types.map(t => (
            <button
              key={t.key}
              onClick={() => onSelect(t.key)}
              className={
                'text-[11px] font-semibold h-6 px-2 rounded transition-colors ' +
                (activeType === t.key
                  ? 'bg-white text-black'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white hover:border-white/[0.15]')
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// "HAVE AN IDEA" CARD — with animated abstract background
// ═══════════════════════════════════════════════════════════════

function HaveAnIdeaCard() {
  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <AbstractBackground />

      <div className="relative p-5 z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-white/[0.1] backdrop-blur border border-white/[0.15] flex items-center justify-center">
            <Sparkle size={11} weight="fill" className="text-white" />
          </div>
          <h3 className="text-[14px] font-bold text-white">Have an idea?</h3>
        </div>
        <p className="text-[12px] text-white/70 leading-relaxed mb-4">
          Create your venture, find the right co-founders and turn your idea into real-world impact.
        </p>
        <Link
          href="/ventures/new"
          className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white text-black hover:bg-zinc-100 text-[13px] font-bold shadow-lg"
        >
          <Plus size={12} weight="bold" /> Create Venture
        </Link>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ABSTRACT ANIMATED BACKGROUND — SVG mesh with slow drift
// ═══════════════════════════════════════════════════════════════

function AbstractBackground() {
  return (
    <>
      <style>{`
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -15px) scale(1.1); }
          66% { transform: translate(-15px, 10px) scale(0.95); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 20px) scale(1.15); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(15px, 15px) scale(1.05); }
          80% { transform: translate(-10px, -10px) scale(0.9); }
        }
        .abstract-blob-1 { animation: drift1 18s ease-in-out infinite; }
        .abstract-blob-2 { animation: drift2 22s ease-in-out infinite; }
        .abstract-blob-3 { animation: drift3 25s ease-in-out infinite; }
      `}</style>

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a0b3d 0%, #0d1030 40%, #0a0b1f 100%)',
          }}
        />

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="blob3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="80" cy="80" r="120" fill="url(#blob1)" className="abstract-blob-1" />
          <circle cx="320" cy="200" r="140" fill="url(#blob2)" className="abstract-blob-2" />
          <circle cx="200" cy="150" r="100" fill="url(#blob3)" className="abstract-blob-3" />
        </svg>

        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

export function VenturesDashboard() {
  const router = useRouter()
  const supabase = createClient()

  // Session ID for no-repeat tracking
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return ''
    const existing = sessionStorage.getItem('dsrt_ventures_session')
    if (existing) return existing
    const fresh = 'ven_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
    sessionStorage.setItem('dsrt_ventures_session', fresh)
    return fresh
  })

  const [activeTab, setActiveTab] = useState<TabId>('my-ventures')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [myVentures, setMyVentures] = useState<Venture[]>([])
  const [followingVentures, setFollowingVentures] = useState<Venture[]>([])
  const [loading, setLoading] = useState(true)

  // Explore state
  const [exploreVentures, setExploreVentures] = useState<Venture[]>([])
  const [exploreOffset, setExploreOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [exploreLoading, setExploreLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeDomain, setActiveDomain] = useState('all')
  const [activeType, setActiveType] = useState('all')
  const [sort, setSort] = useState('recommended')
  const [domains, setDomains] = useState<DomainChip[]>([])
  const [userCategories, setUserCategories] = useState<string[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [userCommunityPrefs, setUserCommunityPrefs] = useState<string[]>([])
  const [ventureTypes, setVentureTypes] = useState<VentureType[]>([])

  const [editingCategories, setEditingCategories] = useState(false)
  const [editingCommunities, setEditingCommunities] = useState(false)

  // ─── Community preferences (stored as IDs, displayed as names) ───
  // Track the full community objects so we can display names + persist IDs
  const [preferredCommunities, setPreferredCommunities] = useState<Community[]>([])

  const banners: Banner[] = [
    {
      id: 'b1',
      title: 'Featured ventures coming soon',
      subtitle: 'Admin can set banners via the featured_banners_config',
      gradient: 'linear-gradient(135deg, #2d1b4e 0%, #1a1030 50%, #0d0b1f 100%)',
    },
    {
      id: 'b2',
      title: 'Launch your venture on DSRT',
      subtitle: 'Create your company page, attract co-founders, raise capital.',
      gradient: 'linear-gradient(135deg, #1a2a4e 0%, #0d1530 50%, #0a0b1f 100%)',
      ctaHref: '/ventures/new',
      ctaLabel: 'Create venture',
    },
    {
      id: 'b3',
      title: 'Explore what founders are building',
      subtitle: 'From AI to Climate to Fintech — see the next generation.',
      gradient: 'linear-gradient(135deg, #2d0e2a 0%, #1a0b3d 50%, #0a1628 100%)',
    },
  ]

  // Load user + my ventures
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, avatar_url, username, tagline')
          .eq('id', user.id)
          .maybeSingle()
        setCurrentUser(profile)
      }
      try {
        const res = await fetch('/api/ventures/my')
        const json = await res.json()
        setMyVentures(json.ventures || [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [supabase])

  const loadExplore = useCallback(async (append = false) => {
    if (!append) setExploreLoading(true); else setLoadingMore(true)
    try {
      const currentOffset = append ? exploreOffset : 0
      const params = new URLSearchParams({ sort, limit: '24', offset: currentOffset.toString() })
      if (activeDomain !== 'all') params.set('domain', activeDomain)
      if (activeType !== 'all') params.set('type', activeType)
      if (sessionId) params.set('session_id', sessionId)

      const res = await fetch('/api/ventures/explore?' + params)
      const data = await res.json()

      if (append) {
        setExploreVentures(prev => [...prev, ...(data.ventures || [])])
      } else {
        setExploreVentures(data.ventures || [])
      }
      setHasMore(data.hasMore || false)
      setExploreOffset((data.offset || 0) + (data.ventures || []).length)
    } catch (e) {
      console.error(e)
    } finally {
      setExploreLoading(false)
      setLoadingMore(false)
    }
  }, [sort, activeDomain, activeType, exploreOffset, sessionId])

  useEffect(() => {
    if (activeTab !== 'explore') return
    const loadMeta = async () => {
      try {
        const [domainsRes, prefsRes, commRes, typesRes] = await Promise.all([
          fetch('/api/ventures/domains?limit=50'),
          fetch('/api/explore/preferences'),
          fetch('/api/explore/communities'),
          fetch('/api/ventures/types'),
        ])
        const dData = await domainsRes.json()
        const pData = await prefsRes.json()
        const cData = await commRes.json()
        const tData = await typesRes.json()

        setDomains(dData.domains || [])
        setUserCategories(dData.userCategories || pData.preferred_categories || [])
        setCommunities(cData.communities || [])

        // Initialize preferred communities from server response
        const communitiesFromServer = (cData.communities || []) as any[]
        const preferredIds = new Set(pData.preferred_community_ids || [])
        const initialPreferred = communitiesFromServer.filter(c => preferredIds.has(c.id))
        setPreferredCommunities(initialPreferred)
        setUserCommunityPrefs(initialPreferred.map(c => c.name))

        setVentureTypes(tData.types || [])
      } catch (e) { console.error(e) }
    }
    loadMeta()
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'explore') loadExplore(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sort, activeDomain, activeType])

  useEffect(() => {
    if (activeTab === 'following') {
      fetch('/api/ventures/following').then(r => r.json()).then(d => setFollowingVentures(d.ventures || [])).catch(() => {})
    }
  }, [activeTab])

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !exploreLoading) loadExplore(true)
  }, [hasMore, loadingMore, exploreLoading, loadExplore])

  useEffect(() => {
    if (activeTab !== 'explore') return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore() },
      { threshold: 0.1 }
    )
    const target = observerRef.current
    if (target) observer.observe(target)
    return () => { if (target) observer.unobserve(target) }
  }, [activeTab, hasMore, loadingMore, loadMore])

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) return
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/ventures/search?q=' + encodeURIComponent(searchQuery) + '&limit=30')
        const json = await res.json()
        setExploreVentures(json.ventures || [])
        setHasMore(false)
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const addCategory = async (name: string) => {
    if (userCategories.some(c => c.toLowerCase() === name.toLowerCase())) return
    const next = [...userCategories, name]
    setUserCategories(next)
    try {
      await fetch('/api/explore/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_categories: next }),
      })
    } catch {}
  }

  const removeCategory = async (name: string) => {
    const next = userCategories.filter(c => c !== name)
    setUserCategories(next)
    try {
      await fetch('/api/explore/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_categories: next }),
      })
    } catch {}
  }

  const addCommunityPref = async (nameOrCommunity: string | Community) => {
    // If user typed a name in the input (fallback), search for it
    let community: Community | null = null

    if (typeof nameOrCommunity === 'object' && nameOrCommunity.id) {
      community = nameOrCommunity
    } else {
      // Search for it (in case user typed name manually)
      try {
        const res = await fetch('/api/community/search?q=' + encodeURIComponent(nameOrCommunity as string) + '&limit=1')
        const json = await res.json()
        if (json.communities && json.communities.length > 0) {
          community = json.communities[0]
        }
      } catch {}
    }

    if (!community) return

    // Check duplicate
    if (preferredCommunities.some(c => c.id === community!.id)) return

    const nextCommunities = [...preferredCommunities, community]
    setPreferredCommunities(nextCommunities)
    setUserCommunityPrefs(nextCommunities.map(c => c.name))

    // Save community IDs to backend
    try {
      await fetch('/api/explore/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_community_ids: nextCommunities.map(c => c.id) }),
      })
    } catch {}
  }

  const removeCommunityPref = async (name: string) => {
    const nextCommunities = preferredCommunities.filter(c => c.name !== name)
    setPreferredCommunities(nextCommunities)
    setUserCommunityPrefs(nextCommunities.map(c => c.name))

    try {
      await fetch('/api/explore/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_community_ids: nextCommunities.map(c => c.id) }),
      })
    } catch {}
  }

  const domainChips = (() => {
    const userDomains = domains.filter(d => userCategories.some(c => c.toLowerCase() === d.name.toLowerCase()))
    const otherDomains = domains.filter(d => !userCategories.some(c => c.toLowerCase() === d.name.toLowerCase()))
    return [...userDomains, ...otherDomains]
  })()

  const myStats = {
    ventures: myVentures.length,
    active: myVentures.filter(v => v.status === 'active').length,
    team: myVentures.reduce((s, v) => s + (v.team_count || 0), 0),
    followers: myVentures.reduce((s, v) => s + (v.follower_count || 0), 0),
  }

  const showRightSidebar = activeTab === 'explore'
  const firstName = currentUser?.full_name?.split(' ')[0] || 'Founder'

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#0a0a0f] text-white">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">
          <div className="h-10 w-72 bg-white/5 rounded mb-6 animate-pulse" />
          <div className="h-[240px] bg-white/5 rounded-2xl mb-6 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0,1,2].map(i => <div key={i} className="h-[380px] bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0f] text-white pb-16">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">

        {/* Hero header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight leading-tight">
              {greeting()},{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #e5c9ff 0%, #d9b3ff 50%, #c9a3ff 100%)',
                }}
              >
                {firstName}
              </span>
            </h1>
            <p className="text-[13.5px] text-white/55 mt-1.5">
              Here is what is happening across your ventures.
            </p>
          </div>
          <Link
            href="/ventures/new"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13.5px] font-bold shrink-0 self-start sm:self-auto shadow-lg"
          >
            <Plus size={13} weight="bold" /> New venture
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/[0.06] mb-5">
          <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {TABS.map(t => {
              const Icon = t.icon
              const active = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as TabId)}
                  className={
                    'inline-flex items-center gap-2 px-4 py-3 text-[13.5px] font-semibold border-b-2 whitespace-nowrap transition-colors ' +
                    (active
                      ? 'text-white border-white'
                      : 'text-white/50 border-transparent hover:text-white/80')
                  }
                >
                  <Icon size={14} weight={active ? 'fill' : 'regular'} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className={showRightSidebar ? 'grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6' : ''}>

          {/* LEFT: Main content */}
          <div className="min-w-0">

            {/* MY VENTURES TAB */}
            {activeTab === 'my-ventures' && (
              <div>
                <div className="flex items-center gap-3 text-[13px] text-white/60 mb-5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <FolderSimple size={12} className="text-white/50" />
                    {myStats.ventures} venture{myStats.ventures !== 1 ? 's' : ''}
                  </span>
                  <span className="text-white/25">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Lightning size={12} weight="fill" className="text-emerald-400" />
                    {myStats.active} active
                  </span>
                  <span className="text-white/25">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <UsersThree size={12} className="text-white/50" />
                    {myStats.team} team
                  </span>
                  <span className="text-white/25">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Heart size={12} className="text-white/50" />
                    {myStats.followers} followers
                  </span>
                </div>

                {myVentures.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h2 className="text-[18px] font-bold text-white">Continue building</h2>
                      <span className="text-[12px] text-white/40">· {myVentures.length}</span>
                    </div>
                    <p className="text-[12.5px] text-white/45 mb-4">Pick up where you left off</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myVentures.slice(0, 5).map(v => (
                        <VentureCard
                          key={v.id}
                          venture={v}
                          onClick={() => router.push('/ventures/' + v.slug)}
                        />
                      ))}
                      <StartNewVentureCard />
                    </div>
                  </div>
                )}

                {myVentures.length === 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StartNewVentureCard />
                    <div className="lg:col-span-2 flex items-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] p-8">
                      <div>
                        <h3 className="text-[15px] font-bold text-white mb-1">No ventures yet</h3>
                        <p className="text-[13px] text-white/55 leading-relaxed">
                          Launch your first venture. Attract co-founders, share progress, raise capital — all in one place.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EXPLORE TAB */}
            {activeTab === 'explore' && (
              <div>
                {/* Search */}
                <div className="relative mb-4">
                  <MagnifyingGlass size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ventures, industries, founders, domains..."
                    className="w-full h-11 pl-10 pr-16 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[13.5px] text-white placeholder:text-white/35 focus:outline-none focus:border-white/[0.18]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/40 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded">
                    ⌘K
                  </span>
                </div>

                {/* Domain chips */}
                <div className="flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setActiveDomain('all')}
                    className={
                      'text-[12.5px] font-semibold whitespace-nowrap px-3.5 h-8 rounded-md transition-colors shrink-0 ' +
                      (activeDomain === 'all'
                        ? 'bg-white text-black'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white')
                    }
                  >
                    All
                  </button>
                  {domainChips.slice(0, 15).map(d => {
                    const isUserPref = userCategories.some(c => c.toLowerCase() === d.name.toLowerCase())
                    return (
                      <button
                        key={d.slug}
                        onClick={() => setActiveDomain(d.name)}
                        className={
                          'text-[12.5px] font-semibold whitespace-nowrap px-3.5 h-8 rounded-md transition-colors shrink-0 ' +
                          (activeDomain === d.name
                            ? 'bg-white text-black'
                            : isUserPref
                            ? 'bg-white/[0.06] border border-white/[0.14] text-white/85 hover:text-white'
                            : 'bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white/85')
                        }
                      >
                        {d.name}
                      </button>
                    )
                  })}
                </div>

                {/* Featured banner */}
                <div className="mb-6 w-full">
                  <FeaturedBanner banners={banners} />
                </div>

                {/* Active-type filter indicator */}
                {activeType !== 'all' && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-[12px] text-white/50">Showing:</span>
                    <span className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-md bg-white/[0.08] border border-white/[0.14] text-[12px] font-semibold text-white">
                      {ventureTypes.find(t => t.key === activeType)?.label || activeType}
                      <button
                        onClick={() => setActiveType('all')}
                        className="w-4 h-4 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.1]"
                      >
                        <X size={9} weight="bold" />
                      </button>
                    </span>
                  </div>
                )}

                {/* Recommended header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-bold text-white">
                    {activeType !== 'all'
                      ? (ventureTypes.find(t => t.key === activeType)?.label || 'Filtered') + ' ventures'
                      : 'Recommended for you'}
                  </h2>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="h-8 pl-3 pr-8 rounded-md border border-white/[0.08] bg-white/[0.04] text-white/80 text-[12px] font-semibold cursor-pointer focus:outline-none appearance-none"
                    style={{
                      backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 8px center',
                    }}
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.key} value={o.key}>Sort: {o.label}</option>
                    ))}
                  </select>
                </div>

                {exploreLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[0,1,2,3].map(i => <div key={i} className="h-[380px] bg-white/[0.03] rounded-2xl animate-pulse" />)}
                  </div>
                ) : exploreVentures.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/[0.1] p-12 text-center">
                    <Compass size={28} className="mx-auto mb-3 text-white/30" />
                    <p className="text-[14px] font-bold text-white mb-1">No ventures found</p>
                    <p className="text-[12.5px] text-white/45">Try a different domain, type, or reset filters.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {exploreVentures.map(v => (
                        <VentureCard
                          key={v.id}
                          venture={v}
                          onClick={() => router.push('/ventures/' + v.slug)}
                        />
                      ))}
                    </div>
                    <div ref={observerRef} className="flex justify-center py-8">
                      {loadingMore && (
                        <div className="flex items-center gap-2 text-[13px] text-white/50">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                          Loading more...
                        </div>
                      )}
                    </div>
                    {!hasMore && exploreVentures.length > 0 && (
                      <p className="text-center pb-8 text-[13px] text-white/40 font-medium">
                        You&apos;ve seen all ventures{activeDomain !== 'all' ? ' in ' + activeDomain : ''}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* FOLLOWING TAB */}
            {activeTab === 'following' && (
              <div>
                {followingVentures.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/[0.1] p-12 text-center">
                    <Heart size={28} className="mx-auto mb-3 text-white/30" />
                    <p className="text-[14px] font-bold text-white mb-1">Not following any ventures</p>
                    <p className="text-[12.5px] text-white/45 mb-4">Follow ventures to see their updates here.</p>
                    <button
                      onClick={() => setActiveTab('explore')}
                      className="inline-flex items-center h-9 px-4 rounded-md bg-white text-black hover:bg-zinc-200 text-[13px] font-bold"
                    >
                      Explore ventures
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {followingVentures.map((v: any) => (
                      <VentureCard
                        key={v.id}
                        venture={v}
                        onClick={() => router.push('/ventures/' + v.slug)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === 'applications' && (
              <div className="rounded-2xl border border-dashed border-white/[0.1] p-12 text-center">
                <Briefcase size={28} className="mx-auto mb-3 text-white/30" />
                <p className="text-[14px] font-bold text-white mb-1">Applications will appear here</p>
                <p className="text-[12.5px] text-white/45">
                  Track applications to venture roles you&apos;ve submitted or received.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR (Explore only) */}
          {showRightSidebar && (
            <aside className="space-y-4 min-w-0">
              {/* My Categories */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-bold text-white">My Categories</h3>
                  <button
                    onClick={() => setEditingCategories(!editingCategories)}
                    className="text-white/50 hover:text-white flex-shrink-0"
                  >
                    <Pencil size={11} />
                  </button>
                </div>
                <EditablePreferences
                  items={userCategories}
                  editing={editingCategories}
                  onAdd={addCategory}
                  onRemove={removeCategory}
                  placeholder="Add a category..."
                  suggestionSource="domains"
                  emptyText="No categories selected. Add some to personalize your feed."
                />
              </div>

              {/* My Communities */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-bold text-white">My Communities</h3>
                  <button
                    onClick={() => setEditingCommunities(!editingCommunities)}
                    className="text-white/50 hover:text-white flex-shrink-0"
                  >
                    <Pencil size={11} />
                  </button>
                </div>
                <EditablePreferences
                  items={userCommunityPrefs}
                  editing={editingCommunities}
                  onAdd={addCommunityPref}
                  onRemove={removeCommunityPref}
                  placeholder="Add a community..."
                  suggestionSource="communities"
                  emptyText="No communities selected."
                />
              </div>

              {/* Venture Type */}
              <VentureTypesSection
                types={ventureTypes}
                activeType={activeType}
                onSelect={setActiveType}
              />

              {/* Have an idea */}
              <HaveAnIdeaCard />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}