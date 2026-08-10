'use client'

import { useState, useEffect } from 'react'
import { X, MagnifyingGlass, Check, Globe, EyeSlash, Eye } from '@phosphor-icons/react'

interface Props {
  field: string
  currentValue: any
  onClose: () => void
  onSave: (patch: Record<string, any>) => Promise<void>
}

export function GlanceEditModal({ field, currentValue, onClose, onSave }: Props) {
  const [saving, setSaving] = useState(false)

  const [industryQuery, setIndustryQuery] = useState('')
  const [industryResults, setIndustryResults] = useState<any[]>([])
  const [industrySelected, setIndustrySelected] = useState<string>(currentValue || '')

  const [dateValue, setDateValue] = useState<string>(currentValue || '')
  const [openRoles, setOpenRoles] = useState<number>(currentValue || 0)

  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>(
    currentValue === 'public' ? 'public' : currentValue === 'unlisted' ? 'unlisted' : 'private'
  )
  const [showInExplore, setShowInExplore] = useState<boolean>(true)

  const [stage, setStage] = useState<string>(currentValue || 'idea')

  useEffect(() => {
    if (field !== 'industry') return
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/sectors/search?q=' + encodeURIComponent(industryQuery))
        const json = await res.json()
        setIndustryResults(json.sectors || [])
      } catch { setIndustryResults([]) }
    }, 200)
    return () => clearTimeout(t)
  }, [industryQuery, field])

  const submit = async () => {
    setSaving(true)
    try {
      let patch: Record<string, any> = {}
      switch (field) {
        case 'industry': patch.industry = industrySelected; break
        case 'founded_date': patch.founded_date = dateValue || null; break
        case 'open_roles': patch.open_roles = Math.max(0, openRoles); break
        case 'visibility':
          patch.visibility = visibility
          patch.is_public = visibility === 'public'
          patch.show_in_explore = visibility === 'public' && showInExplore
          break
        case 'stage': patch.stage = stage; break
      }
      await onSave(patch)
      onClose()
    } finally { setSaving(false) }
  }

  const titles: Record<string, string> = {
    industry: 'Select industry',
    founded_date: 'Founded date',
    open_roles: 'Open roles',
    visibility: 'Project visibility',
    stage: 'Project stage',
  }

  const STAGES = ['idea','research','planning','prototype','mvp','beta','production','scaling','completed','on-hold']
  const STAGE_LABELS: Record<string, string> = {
    idea:'Idea', research:'Research', planning:'Planning', prototype:'Prototype',
    mvp:'MVP', beta:'Beta', production:'Production', scaling:'Scaling',
    completed:'Completed', 'on-hold':'On Hold'
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f0f18] border border-white/[0.08] rounded-2xl w-full max-w-[440px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">{titles[field] || 'Edit'}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {field === 'industry' && (
            <>
              {industrySelected && (
                <div className="mb-3 flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2">
                  <Check size={12} weight="bold" className="text-purple-400" />
                  <span className="text-sm text-white">{industrySelected}</span>
                  <button onClick={() => setIndustrySelected('')} className="ml-auto text-zinc-500 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
                <input
                  autoFocus
                  value={industryQuery}
                  onChange={(e) => setIndustryQuery(e.target.value)}
                  placeholder="Type to search sectors..."
                  className="w-full pl-9 h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-purple-500"
                />
              </div>
              {industryResults.length > 0 && (
                <div className="mt-2 max-h-[240px] overflow-y-auto space-y-0.5">
                  {industryResults.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setIndustrySelected(s.name)}
                      className={
                        'w-full text-left px-3 py-2 rounded-md text-sm ' +
                        (industrySelected === s.name
                          ? 'bg-purple-500/15 text-purple-300'
                          : 'text-zinc-300 hover:bg-white/[0.04]')
                      }
                    >
                      {s.name}
                      {s.popular && <span className="ml-2 text-[9px] text-purple-400 font-semibold">POPULAR</span>}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {field === 'founded_date' && (
            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">Date founded</label>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white outline-none focus:border-purple-500"
              />
            </div>
          )}

          {field === 'open_roles' && (
            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">How many open roles?</label>
              <input
                type="number"
                min="0"
                max="99"
                value={openRoles}
                onChange={(e) => setOpenRoles(parseInt(e.target.value) || 0)}
                className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white outline-none focus:border-purple-500"
              />
            </div>
          )}

          {field === 'stage' && (
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  className={
                    'px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ' +
                    (stage === s
                      ? 'bg-purple-500/15 border border-purple-500/40 text-purple-300'
                      : 'bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:text-white')
                  }
                >
                  {STAGE_LABELS[s]}
                </button>
              ))}
            </div>
          )}

          {field === 'visibility' && (
            <div className="space-y-2">
              {[
                { id: 'public', label: 'Public', desc: 'Anyone on DSRT can discover this project.', icon: Globe },
                { id: 'unlisted', label: 'Unlisted', desc: 'Anyone with the link can view.', icon: Eye },
                { id: 'private', label: 'Private', desc: 'Only invited members can view.', icon: EyeSlash },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setVisibility(opt.id as any)}
                  className={
                    'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ' +
                    (visibility === opt.id
                      ? 'bg-purple-500/10 border-purple-500/40'
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]')
                  }
                >
                  <opt.icon size={16} className={visibility === opt.id ? 'text-purple-300' : 'text-zinc-400'} />
                  <div>
                    <p className={'text-sm font-semibold ' + (visibility === opt.id ? 'text-white' : 'text-zinc-300')}>{opt.label}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
              {visibility === 'public' && (
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInExplore}
                    onChange={(e) => setShowInExplore(e.target.checked)}
                    className="accent-purple-500"
                  />
                  <span className="text-xs text-zinc-300">Show in Explore Projects</span>
                </label>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 h-9 text-xs text-zinc-300 hover:text-white border border-white/[0.08] rounded-lg hover:bg-white/[0.04] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-5 h-9 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? 'Saving...' : (<><Check size={12} weight="bold" /> Save</>)}
          </button>
        </div>
      </div>
    </div>
  )
}
