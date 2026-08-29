'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Plus, ArrowRight, CircleNotch, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  slug: string
  isOwner: boolean
}

export function OpenRoleEmptyState({ slug, isOwner }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/open-roles/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Draft created')
      router.push(data.studio_url || `/looking-for/create-v2/${data.draft_id}`)
    } catch (e: any) {
      toast.error(e.message || 'Could not create')
      setCreating(false)
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-gradient-to-br from-[#0d0d10] to-[#09090b] p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
        <Briefcase size={22} className="text-zinc-500" />
      </div>

      <h3 className="text-[16px] font-bold text-white mb-2">
        {isOwner ? 'No open roles yet' : 'No open positions right now'}
      </h3>

      <p className="text-[12.5px] text-zinc-500 max-w-md mx-auto leading-relaxed mb-6">
        {isOwner
          ? 'Post roles to attract talent — engineers, designers, co-founders, and more. Every role becomes discoverable via DSRT Looking For.'
          : 'This venture is not actively recruiting. Follow to get notified when positions open.'}
      </p>

      {isOwner ? (
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-white text-black text-[13px] font-bold hover:bg-zinc-200 disabled:opacity-40 transition-colors shadow-sm"
        >
          {creating ? (
            <><CircleNotch size={14} className="animate-spin" /> Creating draft…</>
          ) : (
            <><Plus size={13} weight="bold" /> Post First Open Role</>
          )}
        </button>
      ) : (
        <p className="text-[11px] text-zinc-600">
          <Sparkle size={11} weight="fill" className="inline text-zinc-500 mr-1" />
          Check back later
        </p>
      )}
    </div>
  )
}