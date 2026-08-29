'use client'

import React, { useState } from 'react'
import { CaretDown, CaretUp, X } from '@phosphor-icons/react'
import { ExploreFilterState } from '@/lib/venture-explore/types'

interface FilterSidebarProps {
  filters: ExploreFilterState
  onFilterChange: (newFilters: ExploreFilterState) => void
  onClearFilters: () => void
}

const DOMAINS_LIST = [
  'Artificial Intelligence', 'Robotics & Automation', 'Marine & Ocean',
  'Food & Culinary', 'Construction & Infrastructure', 'Healthcare & MedTech',
  'Aerospace & Defense', 'ClimateTech & Energy', 'AgriTech', 'FinTech',
  'E-Commerce & Retail', 'Developer Tools', 'Cybersecurity'
]

const STAGES_LIST = [
  { id: 'idea', label: 'Idea' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'mvp', label: 'MVP' },
  { id: 'early-traction', label: 'Early Traction' },
  { id: 'growth', label: 'Growth' },
  { id: 'scaling', label: 'Scaling' }
]

const TYPES_LIST = [
  'Startup', 'Company', 'Independent business', 'Student venture',
  'Research venture', 'Nonprofit', 'Social enterprise', 'Open-source'
]

export function FilterSidebar({ filters, onFilterChange, onClearFilters }: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    domain: true,
    stage: true,
    type: false,
    verification: true
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleDomainToggle = (domain: string) => {
    const current = filters.domains || []
    const updated = current.includes(domain)
      ? current.filter(d => d !== domain)
      : [...current, domain]
    onFilterChange({ ...filters, domains: updated })
  }

  const handleStageToggle = (stageId: string) => {
    const current = filters.stages || []
    const updated = current.includes(stageId)
      ? current.filter(s => s !== stageId)
      : [...current, stageId]
    onFilterChange({ ...filters, stages: updated })
  }

  const hasActiveFilters = (filters.domains?.length || 0) > 0 || (filters.stages?.length || 0) > 0 || filters.is_verified || filters.is_hiring

  return (
    <aside className="w-full lg:w-[260px] shrink-0 space-y-6 select-none">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <h3 className="text-[13px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-[11.5px] font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* DOMAIN FILTER */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('domain')}
          className="w-full flex items-center justify-between text-[13px] font-bold text-white py-1"
        >
          <span>Domain</span>
          {openSections.domain ? <CaretUp size={12} /> : <CaretDown size={12} />}
        </button>

        {openSections.domain && (
          <div className="space-y-1.5 pt-1">
            {DOMAINS_LIST.map((dom) => {
              const checked = (filters.domains || []).includes(dom)
              return (
                <label
                  key={dom}
                  className="flex items-center gap-2.5 text-[12.5px] text-zinc-400 hover:text-white cursor-pointer py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleDomainToggle(dom)}
                    className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="truncate">{dom}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* STAGE FILTER */}
      <div className="space-y-2 pt-2 border-t border-white/[0.04]">
        <button
          onClick={() => toggleSection('stage')}
          className="w-full flex items-center justify-between text-[13px] font-bold text-white py-1"
        >
          <span>Development Stage</span>
          {openSections.stage ? <CaretUp size={12} /> : <CaretDown size={12} />}
        </button>

        {openSections.stage && (
          <div className="space-y-1.5 pt-1">
            {STAGES_LIST.map((stg) => {
              const checked = (filters.stages || []).includes(stg.id)
              return (
                <label
                  key={stg.id}
                  className="flex items-center gap-2.5 text-[12.5px] text-zinc-400 hover:text-white cursor-pointer py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleStageToggle(stg.id)}
                    className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>{stg.label}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* VERIFICATION & HIRING FLAGS */}
      <div className="space-y-2 pt-2 border-t border-white/[0.04]">
        <button
          onClick={() => toggleSection('verification')}
          className="w-full flex items-center justify-between text-[13px] font-bold text-white py-1"
        >
          <span>Status & Flags</span>
          {openSections.verification ? <CaretUp size={12} /> : <CaretDown size={12} />}
        </button>

        {openSections.verification && (
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 text-[12.5px] text-zinc-400 hover:text-white cursor-pointer py-0.5">
              <input
                type="checkbox"
                checked={filters.is_verified || false}
                onChange={() => onFilterChange({ ...filters, is_verified: !filters.is_verified })}
                className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-white cursor-pointer"
              />
              <span>Verified ventures only</span>
            </label>
            <label className="flex items-center gap-2.5 text-[12.5px] text-zinc-400 hover:text-white cursor-pointer py-0.5">
              <input
                type="checkbox"
                checked={filters.is_hiring || false}
                onChange={() => onFilterChange({ ...filters, is_hiring: !filters.is_hiring })}
                className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-white cursor-pointer"
              />
              <span>Actively hiring</span>
            </label>
          </div>
        )}
      </div>
    </aside>
  )
}