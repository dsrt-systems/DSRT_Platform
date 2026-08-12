'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, ArrowRight, ArrowLeft, Check, Rocket, Buildings, Sparkle,
  Globe, EyeSlash, Eye, MagnifyingGlass
} from '@phosphor-icons/react'

const STAGES = [
  { id: 'idea',         label: 'Idea',          desc: 'Just an idea I want to explore' },
  { id: 'validation',   label: 'Validation',    desc: 'Testing the idea with potential users' },
  { id: 'pre_seed',     label: 'Pre-Seed',      desc: 'Building MVP, early traction' },
  { id: 'seed',         label: 'Seed',          desc: 'Product-market fit, raising or raised' },
  { id: 'early_growth', label: 'Early Growth',  desc: 'Scaling revenue and team' },
  { id: 'growth',       label: 'Growth',        desc: 'Established growth engine' },
  { id: 'scale',        label: 'Scale',         desc: 'Rapidly expanding operations' },
  { id: 'public',       label: 'Public',        desc: 'IPO or acquired' },
]

interface Props {
  onClose: () => void
}

export function CreateVentureWizard({ onClose }: Props) {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [creating, setCreating] = useState(false)

  // Step 1
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')

  // Step 2
  const [industryQuery, setIndustryQuery] = useState('')
  const [industryResults, setIndustryResults] = useState<any[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [stage, setStage] = useState('idea')
  const [location, setLocation] = useState('')

  // Step 3
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public')
  const [showInExplore, setShowInExplore] = useState(true)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (step !== 2 || industryQuery.length < 1) { setIndustryResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/sectors/search?q=' + encodeURIComponent(industryQuery))
        const json = await res.json()
        setIndustryResults(json.sectors || [])
      } catch { setIndustryResults([]) }
    }, 200)
    return () => clearTimeout(t)
  }, [industryQuery, step])

  const canProceed1 = name.trim().length >= 3
  const canProceed2 = !!selectedIndustry && !!stage

  const submit = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/ventures/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          tagline: tagline.trim() || null,
          description: description.trim() || null,
          industry: selectedIndustry,
          stage,
          location: location.trim() || null,
          is_building_public: visibility === 'public',
          show_in_explore: visibility === 'public' && showInExplore,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      router.push('/ventures/' + json.venture.slug)
      onClose()
    } catch (e: any) {
      alert(e?.message || 'Failed to create venture')
    } finally { setCreating(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f0f18] border border-white/[0.1] rounded-2xl w-full max-w-[560px] max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <Buildings size={16} weight="fill" className="text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-white">Create a venture</h3>
              <p className="text-[11px] text-white/45">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-3 pb-1">
          <div className="flex gap-1.5">
            {[1, 2, 3].map(s => (
              <div key={s} className={'h-1 flex-1 rounded-full transition-colors ' + (s <= step ? 'bg-white' : 'bg-white/10')} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <>
              <h2 className="text-[20px] font-bold text-white mb-1">Tell us about the company</h2>
              <p className="text-[13px] text-white/55 mb-5">Start with the essentials. You can flesh out details later.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                    Venture name *
                  </label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 120))}
                    placeholder="e.g. Nova Robotics"
                    className="w-full h-11 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3.5 text-[15px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                    Tagline
                  </label>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value.slice(0, 200))}
                    placeholder="One-line description of what you do"
                    className="w-full h-11 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3.5 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
                  />
                  <p className="text-[11px] text-white/35 mt-1">{tagline.length}/200</p>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                    What are you building?
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="What problem are you solving?"
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg p-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30 resize-y"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-[20px] font-bold text-white mb-1">Industry & stage</h2>
              <p className="text-[13px] text-white/55 mb-5">Help DSRT match you with the right people.</p>

              <div className="space-y-5">
                <div>
                  <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">Industry *</label>
                  {selectedIndustry ? (
                    <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.2] rounded-lg px-3 py-1.5 mb-2">
                      <Check size={12} weight="bold" className="text-white" />
                      <span className="text-[13px] text-white">{selectedIndustry}</span>
                      <button onClick={() => setSelectedIndustry('')} className="text-white/50 hover:text-white ml-1">
                        <X size={12} />
                      </button>
                    </div>
                  ) : null}
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={13} />
                    <input
                      value={industryQuery}
                      onChange={(e) => setIndustryQuery(e.target.value)}
                      placeholder="Type to search: AI, Healthcare, FinTech..."
                      className="w-full pl-9 h-10 bg-white/[0.04] border border-white/[0.1] rounded-lg text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
                    />
                  </div>
                  {industryResults.length > 0 && (
                    <div className="mt-1.5 max-h-[180px] overflow-y-auto bg-white/[0.03] border border-white/[0.08] rounded-lg py-1">
                      {industryResults.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedIndustry(s.name); setIndustryQuery('') }}
                          className="w-full text-left px-3 py-2 text-[13px] text-white/85 hover:bg-white/[0.05]"
                        >
                          {s.name}
                          {s.popular && <span className="ml-2 text-[10px] text-white/40 font-semibold">POPULAR</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-2 block">Stage *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STAGES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setStage(s.id)}
                        className={
                          'text-left px-3 py-2.5 rounded-lg border transition-colors ' +
                          (stage === s.id
                            ? 'bg-white/[0.06] border-white/[0.25]'
                            : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]')
                        }
                      >
                        <p className={'text-[13px] font-semibold ' + (stage === s.id ? 'text-white' : 'text-white/85')}>{s.label}</p>
                        <p className="text-[11px] text-white/45 mt-0.5 leading-snug">{s.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">Location (optional)</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value.slice(0, 120))}
                    placeholder="e.g. Bangalore, India · Remote"
                    className="w-full h-10 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3.5 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-[20px] font-bold text-white mb-1">Visibility</h2>
              <p className="text-[13px] text-white/55 mb-5">You can change this any time.</p>

              <div className="space-y-2">
                {[
                  { id: 'public', label: 'Public', desc: 'Anyone on DSRT can discover this venture', icon: Globe },
                  { id: 'unlisted', label: 'Unlisted', desc: 'Only people with the link can view', icon: Eye },
                ].map(opt => {
                  const Icon = opt.icon
                  const active = visibility === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setVisibility(opt.id as any)}
                      className={
                        'w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ' +
                        (active
                          ? 'bg-white/[0.06] border-white/[0.25]'
                          : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]')
                      }
                    >
                      <div className={
                        'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ' +
                        (active ? 'border-white bg-white' : 'border-white/25')
                      }>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                      <Icon size={16} className={active ? 'text-white' : 'text-white/50'} />
                      <div className="min-w-0 flex-1">
                        <p className={'text-[14px] font-semibold ' + (active ? 'text-white' : 'text-white/80')}>{opt.label}</p>
                        <p className="text-[12px] text-white/55 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {visibility === 'public' && (
                <div className="mt-4 p-4 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInExplore}
                      onChange={(e) => setShowInExplore(e.target.checked)}
                      className="w-4 h-4 accent-white mt-0.5"
                    />
                    <div>
                      <p className="text-[14px] font-semibold text-white">Show in Explore Ventures</p>
                      <p className="text-[12px] text-white/55 mt-0.5">
                        Let DSRT recommend your venture to matching users, builders, and investors.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="mt-6 p-4 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                <p className="text-[12px] text-white/55 flex items-start gap-2">
                  <Sparkle size={13} weight="fill" className="text-purple-300 flex-shrink-0 mt-0.5" />
                  <span>
                    After creating, you'll be taken to your venture page where you can add a logo, team members, business model, metrics, funding info, and open opportunities.
                  </span>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
          <button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            disabled={creating}
            className="flex items-center gap-1.5 px-4 h-9 text-[13px] text-white/70 hover:text-white border border-white/[0.1] rounded-md hover:bg-white/[0.04] disabled:opacity-50"
          >
            <ArrowLeft size={13} /> {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canProceed1) || (step === 2 && !canProceed2)}
              className="flex items-center gap-1.5 px-5 h-9 text-[13px] font-semibold bg-white text-black hover:bg-white/90 rounded-md disabled:opacity-40"
            >
              Continue <ArrowRight size={13} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={creating}
              className="flex items-center gap-1.5 px-5 h-9 text-[13px] font-semibold bg-white text-black hover:bg-white/90 rounded-md disabled:opacity-50"
            >
              {creating ? (
                <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> Creating</>
              ) : (
                <><Rocket size={13} weight="fill" /> Create venture</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
