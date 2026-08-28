'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, CircleNotch, ArrowRight, Sparkle, FileText } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
}

type Mode = 'menu' | 'assessment' | 'basic'

export function CreateVentureLandingModal({ open, onClose }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('menu')
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [creating, setCreating] = useState(false)

  if (!open) return null

  const reset = () => {
    setMode('menu')
    setName('')
    setTagline('')
  }

  const handleClose = () => {
    if (creating) return
    reset()
    onClose()
  }

  const create = async (targetMode: 'assessment' | 'basic') => {
    if (!name.trim()) {
      toast.error('Please enter a venture name')
      return
    }
    setCreating(true)
    const idempotencyKey = `create-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    try {
      const res = await fetch('/api/ventures/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          name: name.trim(),
          tagline: tagline.trim() || undefined,
          mode: targetMode,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')

      toast.success(targetMode === 'assessment' ? 'Assessment started' : 'Draft created')
      router.push(json.next_url)
    } catch (e: any) {
      toast.error(e.message || 'Could not create venture')
      setCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0d0d10] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          disabled={creating}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors disabled:opacity-50 z-10"
        >
          <X size={14} />
        </button>

        {mode === 'menu' && (
          <div className="p-8">
            <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mb-2">
              Create a Venture
            </p>
            <h2 className="text-[22px] font-bold text-white tracking-tight leading-tight">
              Turn your idea into something real.
            </h2>
            <p className="text-[13.5px] text-zinc-400 mt-2 leading-relaxed max-w-md">
              Every venture on DSRT starts with structured thinking. Choose how
              you want to begin — you can always change your mind later.
            </p>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setMode('assessment')}
                className="group w-full text-left rounded-xl border border-zinc-800 hover:border-zinc-600 bg-[#121215] hover:bg-[#161619] p-5 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Sparkle size={14} weight="fill" className="text-zinc-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14.5px] font-bold text-white">
                        Start the Venture Assessment
                      </h3>
                      <ArrowRight
                        size={13}
                        weight="bold"
                        className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                    <p className="text-[12.5px] text-zinc-400 mt-1 leading-relaxed">
                      A 10-step structured onboarding. Takes 15–25 minutes.
                      Unlocks investor visibility, higher Explore ranking, and
                      the Verified Assessment badge.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('basic')}
                className="group w-full text-left rounded-xl border border-zinc-800/60 hover:border-zinc-700 bg-transparent hover:bg-[#0f0f12] p-5 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-transparent border border-zinc-800 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14.5px] font-bold text-zinc-200">
                        Create a basic draft
                      </h3>
                      <ArrowRight
                        size={13}
                        weight="bold"
                        className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                    <p className="text-[12.5px] text-zinc-500 mt-1 leading-relaxed">
                      Just name and description. Finish the assessment later.
                      Your venture stays private until you complete it or publish.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {(mode === 'assessment' || mode === 'basic') && (
          <div className="p-8">
            <button
              onClick={() => setMode('menu')}
              disabled={creating}
              className="text-[11.5px] text-zinc-500 hover:text-white mb-4 disabled:opacity-50"
            >
              ← Back
            </button>

            <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mb-2">
              {mode === 'assessment' ? 'Venture Assessment' : 'Basic Draft'}
            </p>
            <h2 className="text-[20px] font-bold text-white tracking-tight leading-tight">
              {mode === 'assessment' ? 'What are you building?' : 'Name your venture'}
            </h2>
            <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed">
              {mode === 'assessment'
                ? 'We start with the basics. You will refine everything in the 10 steps.'
                : 'Just the essentials. You can complete everything else later.'}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-white mb-1.5">
                  Venture name <span className="text-zinc-500">*</span>
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Rovonic Robotics"
                  className="w-full h-10 px-3 rounded-lg bg-[#121215] border border-zinc-800 focus:border-zinc-600 text-[13.5px] text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-white mb-1.5">
                  One-line description
                </label>
                <input
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  maxLength={200}
                  placeholder="What are you building, in one sentence?"
                  className="w-full h-10 px-3 rounded-lg bg-[#121215] border border-zinc-800 focus:border-zinc-600 text-[13.5px] text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
                <p className="text-[10.5px] text-zinc-600 mt-1 text-right tabular-nums">
                  {tagline.length}/200
                </p>
              </div>
            </div>

            <button
              onClick={() => create(mode)}
              disabled={creating || !name.trim()}
              className={
                'w-full mt-5 inline-flex items-center justify-center gap-1.5 h-10 rounded-lg text-[13.5px] font-semibold transition-colors ' +
                (creating || !name.trim()
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-zinc-100')
              }
            >
              {creating ? (
                <><CircleNotch size={13} className="animate-spin" /> Creating…</>
              ) : (
                <>
                  {mode === 'assessment' ? 'Start assessment' : 'Create draft'}
                  <ArrowRight size={13} weight="bold" />
                </>
              )}
            </button>

            <p className="text-[10.5px] text-zinc-600 mt-3 text-center">
              You can change everything later. Nothing is publicly visible until you publish.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}