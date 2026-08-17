'use client'

import { useState, useEffect } from 'react'
import { CaretDown, CaretUp, X } from '@phosphor-icons/react'

export interface FilterState {
  category: string | null
  subcategory: string | null
  type: string | null
  experience: string | null
  compensation: string | null
  work_mode: string | null
  location: string | null
  time_commitment: string | null
  project_length: string | null
  post_age: string | null
  skills: string[]
  min_budget: number | null
  max_budget: number | null
}

interface Props {
  filters: FilterState
  onChange: (f: FilterState) => void
}

interface Category {
  id: string
  name: string
  slug: string
  subcategories?: Category[]
}

const OPPORTUNITY_TYPES = [
  { value: 'hire', label: 'Hire' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'project-collaboration', label: 'Project Collaboration' },
  { value: 'team-up', label: 'Team Up' },
  { value: 'cofounder', label: 'Co-founder' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'research', label: 'Research' },
  { value: 'open-source', label: 'Open Source' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'consulting', label: 'Consulting' },
]

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
  { value: 'student', label: 'Student' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'professional', label: 'Professional' },
]

const COMPENSATION_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'fixed-price', label: 'Fixed Price' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
  { value: 'equity', label: 'Equity' },
  { value: 'equity-plus-cash', label: 'Equity + Cash' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'volunteer', label: 'Volunteer' },
]

const WORK_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-site' },
  { value: 'flexible', label: 'Flexible' },
]

const TIME_COMMITMENTS = [
  { value: 'less-than-5', label: 'Less than 5 hrs/wk' },
  { value: '5-10', label: '5–10 hrs/wk' },
  { value: '10-20', label: '10–20 hrs/wk' },
  { value: '20-30', label: '20–30 hrs/wk' },
  { value: '30-plus', label: '30+ hrs/wk' },
  { value: 'flexible', label: 'Flexible' },
]

const PROJECT_LENGTHS = [
  { value: 'one-off', label: 'One-off' },
  { value: 'less-than-1-month', label: 'Less than 1 month' },
  { value: '1-3-months', label: '1–3 months' },
  { value: '3-6-months', label: '3–6 months' },
  { value: '6-12-months', label: '6–12 months' },
  { value: 'long-term', label: 'Long-term' },
  { value: 'ongoing', label: 'Ongoing' },
]

const POST_AGES = [
  { value: 'today', label: 'Today' },
  { value: 'last-3-days', label: 'Last 3 days' },
  { value: 'last-week', label: 'Last week' },
  { value: 'last-month', label: 'Last month' },
]

export function FiltersPanel({ filters, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/opportunities/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  const activeCount = [
    filters.category, filters.type, filters.experience, filters.compensation,
    filters.work_mode, filters.location, filters.time_commitment,
    filters.project_length, filters.post_age,
  ].filter(Boolean).length + (filters.skills.length > 0 ? 1 : 0)

  const clearAll = () => onChange({
    category: null, subcategory: null, type: null, experience: null,
    compensation: null, work_mode: null, location: null,
    time_commitment: null, project_length: null, post_age: null,
    skills: [], min_budget: null, max_budget: null,
  })

  const update = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="text-[13px] font-bold text-white">
          Filters
          {activeCount > 0 && (
            <span className="ml-1.5 text-zinc-500 font-medium">({activeCount})</span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-[11.5px] text-zinc-400 hover:text-zinc-200 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="divide-y divide-zinc-800">
        <FilterSection title="Category" defaultOpen>
          <SelectField
            value={filters.category || ''}
            onChange={(v) => update('category', v || null)}
            placeholder="Select category"
            options={[
              { value: '', label: 'All categories' },
              ...categories.map(c => ({ value: c.slug, label: c.name })),
            ]}
          />
        </FilterSection>

        <FilterSection title="Opportunity type" defaultOpen>
          <CheckboxList
            value={filters.type}
            options={OPPORTUNITY_TYPES}
            onChange={(v) => update('type', v)}
          />
        </FilterSection>

        <FilterSection title="Experience level" defaultOpen>
          <CheckboxList
            value={filters.experience}
            options={EXPERIENCE_LEVELS}
            onChange={(v) => update('experience', v)}
          />
        </FilterSection>

        <FilterSection title="Compensation">
          <CheckboxList
            value={filters.compensation}
            options={COMPENSATION_TYPES}
            onChange={(v) => update('compensation', v)}
          />
        </FilterSection>

        <FilterSection title="Work mode">
          <CheckboxList
            value={filters.work_mode}
            options={WORK_MODES}
            onChange={(v) => update('work_mode', v)}
          />
        </FilterSection>

        <FilterSection title="Time commitment">
          <SelectField
            value={filters.time_commitment || ''}
            onChange={(v) => update('time_commitment', v || null)}
            placeholder="Any"
            options={[
              { value: '', label: 'Any' },
              ...TIME_COMMITMENTS,
            ]}
          />
        </FilterSection>

        <FilterSection title="Project length">
          <SelectField
            value={filters.project_length || ''}
            onChange={(v) => update('project_length', v || null)}
            placeholder="Any"
            options={[
              { value: '', label: 'Any' },
              ...PROJECT_LENGTHS,
            ]}
          />
        </FilterSection>

        <FilterSection title="Location">
          <input
            type="text"
            value={filters.location || ''}
            onChange={(e) => update('location', e.target.value || null)}
            placeholder="City, country, or remote"
            className="w-full h-9 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-[12.5px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </FilterSection>

        <FilterSection title="Post age">
          <CheckboxList
            value={filters.post_age}
            options={POST_AGES}
            onChange={(v) => update('post_age', v)}
          />
        </FilterSection>
      </div>
    </div>
  )
}

// ─── Sub-components ───

function FilterSection({
  title, defaultOpen = false, children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="px-4 py-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left mb-2"
      >
        <span className="text-[12px] font-semibold text-zinc-300 uppercase tracking-wider">
          {title}
        </span>
        {open
          ? <CaretUp size={11} className="text-zinc-500" weight="bold" />
          : <CaretDown size={11} className="text-zinc-500" weight="bold" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

function SelectField({
  value, onChange, placeholder, options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 pl-3 pr-9 rounded-md bg-zinc-950 border border-zinc-800 text-[12.5px] text-zinc-200 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-zinc-950">
            {o.label}
          </option>
        ))}
      </select>
      <CaretDown
        size={10}
        weight="bold"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
      />
    </div>
  )
}

function CheckboxList({
  value, options, onChange,
}: {
  value: string | null
  options: { value: string; label: string }[]
  onChange: (v: string | null) => void
}) {
  return (
    <div className="space-y-1.5">
      {options.slice(0, 6).map(o => {
        const isActive = value === o.value
        return (
          <label
            key={o.value}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => onChange(isActive ? null : o.value)}
              className="w-3.5 h-3.5 rounded border border-zinc-700 bg-zinc-950 checked:bg-white checked:border-white cursor-pointer accent-white"
            />
            <span className={
              'text-[12.5px] ' +
              (isActive ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-200')
            }>
              {o.label}
            </span>
          </label>
        )
      })}
      {options.length > 6 && (
        <button className="text-[11.5px] text-zinc-500 hover:text-zinc-300 font-medium mt-1">
          Show more
        </button>
      )}
    </div>
  )
}