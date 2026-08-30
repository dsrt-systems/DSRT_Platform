'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlass, X, Plus, GithubLogo, Globe, Eye, EyeSlash } from '@phosphor-icons/react'
import { useProjectCreationStore } from '@/stores/projectCreationStore'

interface TechOption {
  id: string
  name: string
  category: string
}

const STAGES = [
  { id: 'idea', label: 'Idea', desc: 'Just starting out' },
  { id: 'research', label: 'Research', desc: 'Gathering data or exploring feasibility' },
  { id: 'planning', label: 'Planning', desc: 'Designing architecture or roadmap' },
  { id: 'prototype', label: 'Prototype', desc: 'Building a proof of concept' },
  { id: 'development', label: 'Development', desc: 'Actively building the core system' },
  { id: 'testing', label: 'Testing', desc: 'Validating functionality or QA' },
  { id: 'mvp', label: 'MVP', desc: 'Minimum viable product ready' },
  { id: 'launched', label: 'Launched', desc: 'Live and publicly available' },
]

export function BuildStep() {
  const { data, updateData } = useProjectCreationStore()
  
  const [techSearch, setTechSearch] = useState('')
  const [techResults, setTechResults] = useState<TechOption[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Fetch technologies matching query
  useEffect(() => {
    if (techSearch.trim().length < 2) {
      setTechResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/projects/technologies?q=${encodeURIComponent(techSearch)}&limit=10`)
        const json = await res.json()
        setTechResults(json.technologies || [])
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [techSearch])

  const addTech = (techName: string) => {
    const current = data.technologies || []
    if (current.includes(techName)) return
    if (current.length >= 10) return // Max 10 technologies
    
    updateData({ technologies: [...current, techName] })
    setTechSearch('')
    setTechResults([])
  }

  const removeTech = (techName: string) => {
    const current = data.technologies || []
    updateData({ technologies: current.filter(t => t !== techName) })
  }

  const addCustomTech = () => {
    const v = techSearch.trim()
    if (!v) return
    addTech(v)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── STAGE ── */}
      <div className="space-y-3">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block">
          Current Stage
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STAGES.map(s => {
            const active = data.stage === s.id
            return (
              <button
                key={s.id}
                onClick={() => updateData({ stage: s.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  active 
                    ? 'bg-white/[0.06] border-white/[0.25] shadow-sm' 
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <p className={`text-[13px] font-bold ${active ? 'text-white' : 'text-zinc-300'}`}>{s.label}</p>
                <p className="text-[10.5px] text-zinc-500 mt-0.5 leading-snug">{s.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── TECHNOLOGIES ── */}
      <div className="pt-4 border-t border-white/[0.06] space-y-4">
        <div>
          <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block mb-1">
            Technologies & Tools (up to 10)
          </label>
          <p className="text-[12.5px] text-white/45 mb-4">What languages, frameworks, or hardware are you using?</p>
          
          {/* Selected Tech Chips */}
          {(data.technologies || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {(data.technologies || []).map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] border border-white/10 rounded-lg text-[13px] font-medium text-white shadow-sm">
                  {t}
                  <button onClick={() => removeTech(t)} className="text-white/40 hover:text-white">
                    <X size={12} weight="bold" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tech Search Input */}
          {(data.technologies || []).length < 10 && (
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={techSearch}
                onChange={e => setTechSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomTech()}
                placeholder="Search technologies (e.g. React, Python, ROS...)"
                className="w-full h-12 pl-11 pr-24 rounded-xl bg-[#09090b] border border-white/[0.1] text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all shadow-inner"
              />
              {techSearch.trim().length > 0 && (
                <button 
                  onClick={addCustomTech}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.15] text-white text-[11px] font-bold rounded-lg transition-colors"
                >
                  Add custom
                </button>
              )}
              
              {/* Dropdown Results */}
              {techSearch.trim().length >= 2 && techResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#121215] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-20 max-h-[240px] overflow-y-auto py-1">
                  {techResults.map(res => (
                    <button
                      key={res.id}
                      onClick={() => addTech(res.name)}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/[0.04] transition-colors text-left group"
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-white">{res.name}</p>
                        <p className="text-[10px] font-mono text-white/40 mt-0.5">{res.category}</p>
                      </div>
                      <Plus size={14} className="text-white/20 group-hover:text-white/50" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── REPOSITORY & OPEN SOURCE ── */}
      <div className="pt-4 border-t border-white/[0.06] space-y-5">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block">
          Source Code
        </label>
        
        <div className="relative">
          <GithubLogo size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={data.repository_url || ''}
            onChange={e => updateData({ repository_url: e.target.value })}
            placeholder="Repository URL (e.g. https://github.com/...)"
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] focus:border-white/30 focus:bg-white/[0.05] text-[14px] text-white placeholder:text-white/20 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={data.is_open_source || false}
              onChange={e => updateData({ is_open_source: e.target.checked })}
              className="w-4 h-4 rounded bg-[#09090b] border-white/20 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[13.5px] font-semibold text-white group-hover:text-zinc-200">This is an open source project</span>
          </label>
        </div>

        {data.is_open_source && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <select
              value={data.license || ''}
              onChange={e => updateData({ license: e.target.value })}
              className="w-full sm:w-[240px] h-10 px-3 bg-[#09090b] border border-white/[0.1] rounded-lg text-[13px] text-white outline-none focus:border-white/30"
            >
              <option value="">Select a license...</option>
              <option value="MIT">MIT License</option>
              <option value="Apache-2.0">Apache 2.0</option>
              <option value="GPL-3.0">GNU GPL v3</option>
              <option value="BSD-3-Clause">BSD 3-Clause</option>
              <option value="Unlicense">The Unlicense</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}
      </div>

      {/* ── VISIBILITY ── */}
      <div className="pt-4 border-t border-white/[0.06] space-y-4">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block mb-1">
          Initial Visibility
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'public', label: 'Public', desc: 'Visible to everyone on DSRT', icon: Globe },
            { id: 'unlisted', label: 'Unlisted', desc: 'Anyone with the link can view', icon: Eye },
            { id: 'private', label: 'Private', desc: 'Only you and team members', icon: EyeSlash }
          ].map(opt => {
            const active = data.visibility === opt.id
            const Icon = opt.icon
            return (
              <div 
                key={opt.id}
                onClick={() => updateData({ visibility: opt.id as any })}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  active 
                    ? 'bg-white/[0.06] border-white/[0.25] shadow-sm' 
                    : 'bg-[#09090b] border-white/[0.08] hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={14} className={active ? 'text-white' : 'text-zinc-500'} />
                  <p className={`text-[13.5px] font-bold ${active ? 'text-white' : 'text-zinc-300'}`}>{opt.label}</p>
                </div>
                <p className="text-[11px] text-zinc-500 leading-snug">{opt.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}