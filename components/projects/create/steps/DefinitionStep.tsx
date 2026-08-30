'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlass, X, Plus } from '@phosphor-icons/react'
import { useProjectCreationStore } from '@/stores/projectCreationStore'

export function DefinitionStep() {
  const { data, updateData } = useProjectCreationStore()

  const [domainSearch, setDomainSearch] = useState('')
  const [domainResults, setDomainResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Domain search against the 550+ domain taxonomy
  useEffect(() => {
    if (domainSearch.trim().length < 2) {
      setDomainResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/projects/domains-tree?q=${encodeURIComponent(domainSearch)}&limit=10`)
        const json = await res.json()
        setDomainResults(json.domains || [])
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [domainSearch])

  const toggleDomain = (domainName: string) => {
    const current = data.domains || []
    if (current.includes(domainName)) {
      updateData({
        domains: current.filter(d => d !== domainName),
        primary_domain: data.primary_domain === domainName ? '' : data.primary_domain,
      })
    } else {
      if (current.length >= 3) return
      updateData({
        domains: [...current, domainName],
        primary_domain: current.length === 0 ? domainName : data.primary_domain,
      })
    }
    setDomainSearch('')
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Description */}
      <div className="space-y-2">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block">
          About this project *
        </label>
        <textarea
          autoFocus
          value={data.description || ''}
          onChange={e => updateData({ description: e.target.value })}
          placeholder="Tell people what this project is, why you are building it, and what you hope it will achieve."
          rows={4}
          className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] focus:border-white/30 focus:bg-white/[0.05] text-[14px] text-white placeholder:text-white/20 outline-none resize-none transition-all leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Problem */}
        <div className="space-y-2">
          <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block">
            Problem Statement
          </label>
          <textarea
            value={data.problem_statement || ''}
            onChange={e => updateData({ problem_statement: e.target.value })}
            placeholder="What problem are you trying to solve?"
            rows={3}
            className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] focus:border-white/30 text-[13px] text-white placeholder:text-white/20 outline-none resize-none transition-all leading-relaxed"
          />
        </div>

        {/* Goals */}
        <div className="space-y-2">
          <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block">
            Project Goals
          </label>
          <textarea
            value={data.goals || ''}
            onChange={e => updateData({ goals: e.target.value })}
            placeholder="What are you trying to build or achieve?"
            rows={3}
            className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] focus:border-white/30 text-[13px] text-white placeholder:text-white/20 outline-none resize-none transition-all leading-relaxed"
          />
        </div>
      </div>

      {/* Domain Selection */}
      <div className="pt-4 border-t border-white/[0.06] space-y-4">
        <div>
          <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block mb-1">
            Project Domains * (up to 3)
          </label>
          <p className="text-[12.5px] text-zinc-500 mb-4">
            Select the technical or creative disciplines that classify this project.
          </p>

          {/* Selected Domains */}
          {(data.domains || []).length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {(data.domains || []).map(d => {
                const isPrimary = data.primary_domain === d
                return (
                  <div
                    key={d}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isPrimary
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-white/[0.03] border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[14px] font-bold ${isPrimary ? 'text-blue-100' : 'text-white'}`}>
                        {d}
                      </span>
                      {isPrimary && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                          Primary Domain
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isPrimary && (
                        <button
                          onClick={() => updateData({ primary_domain: d })}
                          className="text-[11.5px] font-semibold text-zinc-400 hover:text-white transition-colors px-2"
                        >
                          Set primary
                        </button>
                      )}
                      <button
                        onClick={() => toggleDomain(d)}
                        className="p-1 text-zinc-500 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-md transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Domain Search */}
          {(data.domains || []).length < 3 && (
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={domainSearch}
                onChange={e => setDomainSearch(e.target.value)}
                placeholder="Search domains (e.g. Electrical Engineering, Computer Vision...)"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#09090b] border border-white/[0.1] text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all shadow-inner"
              />

              {domainSearch.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#121215] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-20 max-h-[240px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-[12px] text-zinc-500">Searching taxonomy...</div>
                  ) : domainResults.length === 0 ? (
                    <div className="p-4 text-center text-[12px] text-zinc-500">No matching domains found.</div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {domainResults.map(res => (
                        <button
                          key={res.id}
                          onClick={() => toggleDomain(res.name)}
                          className="w-full flex items-center justify-between p-3 hover:bg-white/[0.04] transition-colors text-left"
                        >
                          <div>
                            <p className="text-[13px] font-semibold text-white">{res.name}</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{res.category}</p>
                          </div>
                          <Plus size={14} className="text-zinc-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}