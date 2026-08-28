'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Globe, LinkedinLogo, TwitterLogo, GithubLogo, YoutubeLogo, InstagramLogo,
  FilePdf, PencilSimple, Plus, X, Check, MagnifyingGlass, Envelope,
  UserPlus, Eye, EyeSlash, MapPin
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { AssessmentProgressCard } from '@/components/venture-assessment/AssessmentProgressCard'

interface Props {
  venture: any
  founder: any
  team: any[]
  products: any[]
  roles: any[]
  isOwner: boolean
  onUpdate: (patch: any) => Promise<void>
}

const FUNDING_STAGES = [
  { value: '', label: 'Not specified' },
  { value: 'bootstrapped', label: 'Bootstrapped' },
  { value: 'friends-family', label: 'Friends & Family' },
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
  { value: 'series-c', label: 'Series C' },
  { value: 'series-d', label: 'Series D' },
  { value: 'series-e', label: 'Series E+' },
  { value: 'growth', label: 'Growth / Late Stage' },
  { value: 'mezzanine', label: 'Mezzanine / Bridge' },
  { value: 'pre-ipo', label: 'Pre-IPO' },
  { value: 'ipo', label: 'Public / IPO' },
  { value: 'acquired', label: 'Acquired' },
  { value: 'grant-funded', label: 'Grant Funded' },
  { value: 'crowdfunded', label: 'Crowdfunded' },
]

const BUSINESS_MODELS = [
  '',
  'B2B SaaS', 'B2C SaaS', 'B2B2C', 'Enterprise SaaS', 'PLG SaaS',
  'Marketplace', 'Two-sided Marketplace', 'Multi-sided Platform', 'Aggregator',
  'E-Commerce', 'D2C', 'Marketplace + D2C', 'Dropshipping', 'Wholesale',
  'Subscription', 'Membership', 'Freemium', 'Freemium-to-Paid', 'Usage-based',
  'Transactional', 'Commission-based', 'Pay-per-use', 'Ad-supported',
  'Content / Media', 'Creator Economy', 'Publishing', 'Advertising Network',
  'Hardware', 'IoT', 'Robotics', 'DeepTech', 'BioTech', 'Manufacturing',
  'FinTech', 'Lending', 'Payments', 'InsurTech', 'WealthTech', 'CryptoCurrency', 'DeFi',
  'Enterprise Software', 'Consulting', 'Managed Services', 'System Integrator',
  'Consumer App', 'Mobile-First', 'Social Network', 'Gaming', 'Dating',
  'API-first', 'Developer Tools', 'Infrastructure', 'Platform', 'PaaS', 'IaaS',
  'Open Source', 'Web3', 'AI / ML', 'AR / VR', 'Blockchain',
  'Marketplace-as-a-Service', 'Agency', 'Studio', 'Accelerator', 'Non-profit',
  'Other',
]

const INDUSTRIES = [
  '',
  'AI / Machine Learning', 'Robotics', 'DeepTech', 'BioTech', 'Quantum Computing',
  'Aerospace', 'Defense', 'Semiconductors',
  'FinTech', 'InsurTech', 'PropTech', 'WealthTech', 'CryptoCurrency', 'Web3', 'Blockchain',
  'HealthTech', 'MedTech', 'Digital Health', 'Pharma', 'Mental Health', 'Fitness & Wellness',
  'EdTech', 'HR Tech', 'Legal Tech', 'GovTech',
  'E-Commerce', 'Retail', 'D2C Brand', 'Fashion', 'Beauty', 'Food & Beverage',
  'CleanTech', 'ClimateTech', 'Sustainability', 'Renewable Energy', 'Electric Vehicles',
  'AgriTech', 'FoodTech', 'Supply Chain', 'Logistics',
  'SaaS', 'Enterprise Software', 'Developer Tools', 'DevOps', 'Cybersecurity', 'Data & Analytics',
  'Consumer', 'Consumer Apps', 'Social Media', 'Community', 'Dating',
  'Gaming', 'Esports', 'Media & Entertainment', 'Streaming', 'Music',
  'Marketing Tech', 'Sales Tech', 'AdTech', 'Creator Economy',
  'Real Estate', 'Construction', 'Manufacturing', 'Hardware', 'IoT',
  'Travel & Hospitality', 'Mobility', 'Automotive',
  'Sports', 'Kids & Parenting', 'Pets',
  'Non-profit', 'Impact', 'Other',
]

export function VentureSidebar({ venture, founder, team, products, roles, isOwner, onUpdate }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <div className="space-y-4">
      {isOwner && <AssessmentProgressCard venture={venture} />}
      <AtAGlance venture={venture} isOwner={isOwner} onUpdate={onUpdate} />
      <FinancialsCard venture={venture} isOwner={isOwner} onUpdate={onUpdate} />
      <SocialLinksCard venture={venture} isOwner={isOwner} onUpdate={onUpdate} />
      <TeamCard team={team} isOwner={isOwner} onInvite={() => setInviteOpen(true)} slug={venture.slug} />
      {inviteOpen && <InviteMemberModal slug={venture.slug} onClose={() => setInviteOpen(false)} />}
    </div>
  )
}

// ═════════════════════════════════════════════════════
// AT A GLANCE
// ═════════════════════════════════════════════════════
function AtAGlance({ venture, isOwner, onUpdate }: { venture: any; isOwner: boolean; onUpdate: (p: any) => Promise<void> }) {
  const rows = [
    { key: 'stage', label: 'STAGE', value: venture.stage, capitalize: true },
    { key: 'industry', label: 'INDUSTRY', value: venture.industry, options: INDUSTRIES },
    { key: 'headquarters', label: 'LOCATION', value: venture.headquarters || venture.location, type: 'location' },
    { key: 'business_model', label: 'BUSINESS MODEL', value: venture.business_model, options: BUSINESS_MODELS },
    { key: 'team_size', label: 'TEAM SIZE', value: venture.team_size, type: 'number' },
    { key: 'start_date', label: 'FOUNDED', value: venture.start_date, type: 'date', display: (v: any) => v ? new Date(v).getFullYear() : null },
  ]

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-[13px] font-bold text-white">At a Glance</h3>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {rows.map(row => (
          <EditableTile
            key={row.key}
            label={row.label}
            value={row.value}
            fieldKey={row.key}
            type={row.type}
            options={row.options}
            capitalize={row.capitalize}
            display={row.display}
            isOwner={isOwner}
            onSave={onUpdate}
          />
        ))}
      </div>

      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {venture.show_in_explore ? <Eye size={11} weight="regular" className="text-white/50" /> : <EyeSlash size={11} weight="regular" className="text-white/50" />}
          <span className="text-[10.5px] font-semibold text-white/50 uppercase tracking-wider">Visibility</span>
        </div>
        {isOwner ? (
          <button
            onClick={async () => { await onUpdate({ show_in_explore: !venture.show_in_explore }); toast.success(venture.show_in_explore ? 'Now private' : 'Now public in Explore') }}
            className="text-[11px] font-semibold px-2 py-1 rounded transition-colors text-white/70 hover:text-white hover:bg-white/[0.06]"
          >
            {venture.show_in_explore ? 'Public' : 'Private'} →
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-white/70">{venture.show_in_explore ? 'Public' : 'Private'}</span>
        )}
      </div>
    </div>
  )
}

function EditableTile({ label, value, fieldKey, type, options, capitalize, display, isOwner, onSave }: any) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [locationOpen, setLocationOpen] = useState(false)

  useEffect(() => setDraft(value || ''), [value])

  const displayValue = display ? display(value) : value
  const hasValue = !!displayValue

  const save = async (val?: string) => {
    const v = val !== undefined ? val : draft
    await onSave({ [fieldKey]: type === 'number' ? (v ? Number(v) : null) : (v || null) })
    setEditing(false)
    setLocationOpen(false)
  }

  return (
    <>
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5 min-h-[62px] flex flex-col justify-between">
        <p className="text-[9.5px] font-bold text-white/45 uppercase tracking-wider mb-1">{label}</p>
        {editing && isOwner ? (
          type === 'location' ? (
            <button onClick={() => { setLocationOpen(true); setEditing(false) }}
              className="text-[12px] font-semibold text-white/80 hover:text-white text-left">
              Choose location...
            </button>
          ) : (
            <div className="flex items-center gap-1">
              {options ? (
                <select
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 bg-white/[0.08] border border-white/[0.15] text-white text-[12px] rounded px-1.5 py-0.5 outline-none min-w-0"
                >
                  {options.map((opt: string) => <option key={opt} value={opt} className="bg-[#12121a]">{opt || '— None —'}</option>)}
                </select>
              ) : (
                <input
                  autoFocus
                  type={type || 'text'}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 bg-white/[0.08] border border-white/[0.15] text-white text-[12px] rounded px-1.5 py-0.5 outline-none min-w-0"
                />
              )}
              <button onClick={() => save()} className="w-5 h-5 rounded bg-white text-black flex items-center justify-center flex-shrink-0"><Check size={10} weight="bold" /></button>
              <button onClick={() => { setDraft(value || ''); setEditing(false) }} className="w-5 h-5 rounded text-white/50 hover:text-white flex items-center justify-center flex-shrink-0"><X size={10} /></button>
            </div>
          )
        ) : hasValue ? (
          <p
            onClick={() => isOwner && (type === 'location' ? setLocationOpen(true) : setEditing(true))}
            className={'text-[12.5px] font-semibold text-white truncate ' + (capitalize ? 'capitalize ' : '') + (isOwner ? 'cursor-pointer hover:text-white/80' : '')}
          >
            {displayValue}
          </p>
        ) : isOwner ? (
          <button onClick={() => type === 'location' ? setLocationOpen(true) : setEditing(true)}
            className="text-[11px] font-semibold text-white/60 hover:text-white flex items-center gap-0.5">
            <Plus size={10} weight="bold" /> Add
          </button>
        ) : (
          <p className="text-[11px] text-white/30">—</p>
        )}
      </div>

      {locationOpen && (
        <LocationPickerModal
          currentValue={value || ''}
          onClose={() => setLocationOpen(false)}
          onSelect={(loc) => save(loc)}
        />
      )}
    </>
  )
}

// ═════════════════════════════════════════════════════
// LOCATION PICKER MODAL - Global city search
// ═════════════════════════════════════════════════════
function LocationPickerModal({ currentValue, onClose, onSelect }: { currentValue: string; onClose: () => void; onSelect: (loc: string) => void }) {
  const [query, setQuery] = useState(currentValue)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const dsrtRes = await fetch('/api/locations/search?q=' + encodeURIComponent(query))
        const dsrtJson = await dsrtRes.json().catch(() => ({ locations: [] }))
        const dsrtLocations = (dsrtJson.locations || []).map((l: any) => ({
          display_name: l.display || (l.city + ', ' + l.country),
          isDsrt: true,
        }))

        const osmRes = await fetch(
          'https://nominatim.openstreetmap.org/search?format=json&limit=8&addressdetails=1&featuretype=city&q=' + encodeURIComponent(query),
          { headers: { 'Accept-Language': 'en' } }
        )
        const osmJson = await osmRes.json().catch(() => [])
        const osmLocations = (osmJson || []).slice(0, 8).map((l: any) => ({
          display_name: buildDisplay(l),
          isDsrt: false,
        }))

        const seen = new Set<string>()
        const combined = [...dsrtLocations, ...osmLocations].filter(l => {
          if (seen.has(l.display_name)) return false
          seen.add(l.display_name)
          return true
        }).slice(0, 12)

        setResults(combined)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-24 bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#0f0f18] border border-white/[0.1] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={15} weight="regular" className="text-white/70" />
            <h2 className="text-[15px] font-bold text-white">Choose location</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-4">
          <div className="relative">
            <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any city in the world..."
              className="w-full pl-9 pr-3 h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13.5px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.2]"
            />
          </div>

          <div className="mt-3 max-h-[360px] overflow-y-auto">
            {query.length < 2 ? (
              <p className="text-[12px] text-white/40 text-center py-6">Type at least 2 characters to search worldwide.</p>
            ) : loading ? (
              <p className="text-[12px] text-white/40 text-center py-6">Searching...</p>
            ) : results.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[12px] text-white/40 mb-3">No matches found.</p>
                <button onClick={() => onSelect(query)} className="text-[12px] font-semibold text-white/80 hover:text-white">
                  Use &ldquo;{query}&rdquo; anyway →
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(r.display_name)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.04] flex items-center gap-2.5 group transition-colors"
                  >
                    <MapPin size={12} weight="regular" className="text-white/40 group-hover:text-white/60 flex-shrink-0" />
                    <span className="text-[12.5px] text-white/85 group-hover:text-white truncate">{r.display_name}</span>
                    {r.isDsrt && <span className="ml-auto text-[9px] font-bold text-white/70 bg-white/[0.08] border border-white/[0.1] px-1.5 py-0.5 rounded uppercase tracking-wider">Popular</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function buildDisplay(item: any): string {
  const a = item.address || {}
  const parts = []
  if (a.city || a.town || a.village || a.municipality) {
    parts.push(a.city || a.town || a.village || a.municipality)
  } else if (item.name) {
    parts.push(item.name)
  }
  if (a.state) parts.push(a.state)
  if (a.country) parts.push(a.country)
  return parts.join(', ') || item.display_name
}

// ═════════════════════════════════════════════════════
// FINANCIALS
// ═════════════════════════════════════════════════════
function FinancialsCard({ venture, isOwner, onUpdate }: { venture: any; isOwner: boolean; onUpdate: (p: any) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    funding_stage: venture.funding_stage || '',
    funding_amount: venture.funding_amount || '',
    runway: venture.runway || '',
    revenue_range: venture.revenue_range || '',
    seeking_investment: venture.seeking_investment || false,
  })

  const stageLabel = FUNDING_STAGES.find(s => s.value === venture.funding_stage)?.label

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-white">Financials</h3>
        {isOwner && !editing && (
          <button onClick={() => setEditing(true)} className="text-[11px] text-white/50 hover:text-white">
            <PencilSimple size={11} />
          </button>
        )}
      </div>
      <div className="p-4">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Funding Stage</label>
              <select value={draft.funding_stage} onChange={(e) => setDraft({ ...draft, funding_stage: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-[12.5px] rounded-lg px-2.5 py-1.5 outline-none">
                {FUNDING_STAGES.map(s => <option key={s.value} value={s.value} className="bg-[#12121a]">{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Amount Raised / Raising</label>
              <input value={draft.funding_amount} onChange={(e) => setDraft({ ...draft, funding_amount: e.target.value })}
                placeholder="$500K, $2M, ₹1Cr, etc." className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-[12.5px] rounded-lg px-2.5 py-1.5 outline-none placeholder:text-white/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Revenue Range</label>
              <input value={draft.revenue_range} onChange={(e) => setDraft({ ...draft, revenue_range: e.target.value })}
                placeholder="$10K/mo, $1M ARR..." className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-[12.5px] rounded-lg px-2.5 py-1.5 outline-none placeholder:text-white/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Runway</label>
              <input value={draft.runway} onChange={(e) => setDraft({ ...draft, runway: e.target.value })}
                placeholder="18 months, 3 years..." className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-[12.5px] rounded-lg px-2.5 py-1.5 outline-none placeholder:text-white/30" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={draft.seeking_investment} onChange={(e) => setDraft({ ...draft, seeking_investment: e.target.checked })}
                className="rounded border-white/[0.15] bg-white/[0.04]" />
              <span className="text-[12px] text-white/80">Currently raising investment</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={async () => { await onUpdate(draft); toast.success('Financials updated'); setEditing(false) }}
                className="text-[12px] font-semibold text-black bg-white hover:bg-white/90 px-3 h-8 rounded-md">Save</button>
              <button onClick={() => setEditing(false)} className="text-[12px] text-white/60 hover:text-white px-2 h-8">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {stageLabel && <FinRow label="Stage" value={stageLabel} />}
            {venture.funding_amount && <FinRow label={venture.seeking_investment ? 'Raising' : 'Raised'} value={venture.funding_amount} />}
            {venture.revenue_range && <FinRow label="Revenue" value={venture.revenue_range} />}
            {venture.runway && <FinRow label="Runway" value={venture.runway} />}
            {venture.seeking_investment && (
              <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white/90" />
                </span>
                <span className="text-[11px] font-semibold text-white/90">Currently raising</span>
              </div>
            )}
            {!stageLabel && !venture.funding_amount && !venture.revenue_range && !venture.runway && (
              <p className="text-[12px] text-white/40 italic">No financial info yet.{isOwner && ' Click edit to add.'}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FinRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11.5px] text-white/50">{label}</span>
      <span className="text-[12.5px] font-bold text-white">{value}</span>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// SOCIAL LINKS
// ═════════════════════════════════════════════════════
const LINK_TYPES = [
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourvent.com' },
  { key: 'github', label: 'GitHub', icon: GithubLogo, placeholder: 'https://github.com/...' },
  { key: 'twitter', label: 'X / Twitter', icon: TwitterLogo, placeholder: 'https://x.com/...' },
  { key: 'linkedin', label: 'LinkedIn', icon: LinkedinLogo, placeholder: 'https://linkedin.com/company/...' },
  { key: 'youtube', label: 'YouTube', icon: YoutubeLogo, placeholder: 'https://youtube.com/@...' },
  { key: 'instagram', label: 'Instagram', icon: InstagramLogo, placeholder: 'https://instagram.com/...' },
  { key: 'pitch_deck_url', label: 'Pitch Deck', icon: FilePdf, placeholder: 'https://...pdf' },
]

function SocialLinksCard({ venture, isOwner, onUpdate }: { venture: any; isOwner: boolean; onUpdate: (p: any) => Promise<void> }) {
  const socialLinks = venture.social_links || {}
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const getVal = (key: string) => {
    if (key === 'website') return venture.website
    if (key === 'pitch_deck_url') return venture.pitch_deck_url
    return socialLinks[key]
  }

  const startEdit = (key: string) => {
    setEditing(key)
    setDraft(getVal(key) || '')
  }

  const save = async (key: string) => {
    if (key === 'website') {
      await onUpdate({ website: draft || null })
    } else if (key === 'pitch_deck_url') {
      await onUpdate({ pitch_deck_url: draft || null })
    } else {
      await onUpdate({ social_links: { ...socialLinks, [key]: draft || undefined } })
    }
    setEditing(null)
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-[13px] font-bold text-white">Social Links</h3>
      </div>
      <div className="p-3 grid grid-cols-4 gap-2">
        {LINK_TYPES.map(type => {
          const Icon = type.icon
          const value = getVal(type.key)
          const active = !!value

          if (editing === type.key) {
            return (
              <div key={type.key} className="col-span-4 flex items-center gap-1.5 p-2 bg-white/[0.04] rounded-lg">
                <Icon size={13} className="text-white/60 flex-shrink-0" />
                <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={type.placeholder}
                  className="flex-1 bg-white/[0.06] border border-white/[0.1] text-white text-[12px] rounded px-2 py-1 outline-none min-w-0" />
                <button onClick={() => save(type.key)} className="w-6 h-6 rounded bg-white text-black flex items-center justify-center flex-shrink-0"><Check size={11} weight="bold" /></button>
                <button onClick={() => setEditing(null)} className="w-6 h-6 rounded text-white/50 flex items-center justify-center flex-shrink-0"><X size={11} /></button>
              </div>
            )
          }

          return (
            <a
              key={type.key}
              href={active ? value : undefined}
              target={active ? '_blank' : undefined}
              rel="noopener noreferrer"
              onClick={(e) => { if (!active && isOwner) { e.preventDefault(); startEdit(type.key) } }}
              className={
                'relative aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all group ' +
                (active
                  ? 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]'
                  : 'bg-white/[0.01] border border-dashed border-white/[0.08] ' + (isOwner ? 'hover:border-white/[0.2] cursor-pointer' : 'cursor-default opacity-40'))
              }
            >
              <Icon size={14} weight={active ? 'fill' : 'regular'} className={active ? 'text-white' : 'text-white/40'} />
              <span className={'text-[8.5px] font-semibold text-center leading-tight ' + (active ? 'text-white/80' : 'text-white/40')}>{type.label}</span>
              {active && isOwner && (
                <button
                  onClick={(e) => { e.preventDefault(); startEdit(type.key) }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-white/50 hover:text-white"
                >
                  <PencilSimple size={9} />
                </button>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// TEAM CARD
// ═════════════════════════════════════════════════════
function TeamCard({ team, isOwner, onInvite, slug }: { team: any[]; isOwner: boolean; onInvite: () => void; slug: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-white">Team <span className="text-white/40 font-normal">· {team.length}</span></h3>
        {isOwner && (
          <button onClick={onInvite} className="text-[11px] font-semibold text-white/70 hover:text-white flex items-center gap-1">
            <UserPlus size={11} weight="regular" /> Invite
          </button>
        )}
      </div>
      <div className="p-3">
        {team.length === 0 ? (
          <div className="py-3 text-center">
            <p className="text-[12px] text-white/40">No members yet.</p>
            {isOwner && (
              <button onClick={onInvite} className="mt-2 text-[11.5px] font-semibold text-white/70 hover:text-white inline-flex items-center gap-1">
                <Plus size={10} weight="bold" /> Add member
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {team.slice(0, 5).map((m: any) => {
              const u = m.users
              const name = u?.full_name || m.name
              const avatar = u?.avatar_url || m.avatar_url
              return (
                <a
                  key={m.id}
                  href={u?.username ? '/profile/' + u.username : '#'}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
                >
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white/70">
                      {name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate group-hover:text-white">{name}</p>
                    <p className="text-[10.5px] text-white/45 truncate">{m.role}</p>
                  </div>
                  {m.is_founder && (
                    <span className="text-[8.5px] font-bold text-white/80 bg-white/[0.08] px-1.5 py-0.5 rounded uppercase tracking-wider">Founder</span>
                  )}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// INVITE MEMBER MODAL
// ═════════════════════════════════════════════════════
function InviteMemberModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [mode, setMode] = useState<'search' | 'email'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (mode !== 'search' || query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/users/search?q=' + encodeURIComponent(query))
        const j = await res.json()
        setResults(j.users || j.results || [])
      } catch { setResults([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [query, mode])

  const inviteUser = async (userId: string) => {
    setInviting(true)
    try {
      const res = await fetch('/api/ventures/' + slug + '/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Invitation sent')
      onClose()
    } catch { toast.error('Failed to invite') }
    finally { setInviting(false) }
  }

  const inviteEmail = async () => {
    if (!email.trim() || !email.includes('@')) return toast.error('Enter a valid email')
    setInviting(true)
    try {
      const res = await fetch('/api/ventures/' + slug + '/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Invitation email sent')
      onClose()
    } catch { toast.error('Failed to send') }
    finally { setInviting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#0f0f18] border border-white/[0.1] rounded-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-white">Invite team member</h2>
            <p className="text-[11.5px] text-white/45 mt-0.5">Add builders by DSRT username or email</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-1 border-b border-white/[0.06]">
            <button onClick={() => setMode('search')}
              className={'px-3 py-2 text-[12.5px] font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 ' + (mode === 'search' ? 'text-white border-white' : 'text-white/45 border-transparent hover:text-white/80')}>
              <MagnifyingGlass size={12} /> Search DSRT users
            </button>
            <button onClick={() => setMode('email')}
              className={'px-3 py-2 text-[12.5px] font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 ' + (mode === 'email' ? 'text-white border-white' : 'text-white/45 border-transparent hover:text-white/80')}>
              <Envelope size={12} /> Invite by email
            </button>
          </div>
        </div>

        <div className="p-6 min-h-[280px]">
          {mode === 'search' ? (
            <>
              <input
                autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.2] mb-3"
              />
              {query.length < 2 ? (
                <p className="text-[12px] text-white/40 text-center py-8">Type at least 2 characters to search.</p>
              ) : results.length === 0 ? (
                <p className="text-[12px] text-white/40 text-center py-8">No matching builders found.</p>
              ) : (
                <div className="space-y-1 max-h-[220px] overflow-y-auto">
                  {results.map((u: any) => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03]">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[11px] font-bold text-white/70">{u.full_name?.charAt(0)}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{u.full_name}</p>
                        <p className="text-[11px] text-white/45 truncate">@{u.username}</p>
                      </div>
                      <button onClick={() => inviteUser(u.id)} disabled={inviting} className="text-[11.5px] font-semibold text-black bg-white hover:bg-white/90 px-3 h-7 rounded-md">
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.2]"
                />
              </div>
              <p className="text-[11px] text-white/45 leading-relaxed">
                We&apos;ll send an invitation email with a link to join your venture on DSRT.
              </p>
              <button onClick={inviteEmail} disabled={inviting}
                className="w-full text-[12.5px] font-semibold text-black bg-white hover:bg-white/90 disabled:opacity-50 h-9 rounded-lg flex items-center justify-center gap-1.5">
                <Envelope size={12} weight="regular" /> {inviting ? 'Sending...' : 'Send invitation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}