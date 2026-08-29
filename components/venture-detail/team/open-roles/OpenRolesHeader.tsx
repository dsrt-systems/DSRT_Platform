'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Briefcase, Users, TrendUp, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  slug: string
  isOwner: boolean
  totalActive: number
  totalApplications: number
  totalNewApplications: number
}

export function OpenRolesHeader({
  slug, isOwner, totalActive, totalApplications, totalNewApplications
}: Props) {
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
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      toast.success('Draft created · Opening Studio')
      router.push(data.studio_url || `/looking-for/create-v2/${data.draft_id}`)
    } catch (e: any) {
      toast.error(e.message || 'Could not create draft')
      setCreating(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#141419] via-[#101014] to-[#0a0a0d] p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Briefcase size={14} className="text-zinc-300" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-white">Open Roles</h3>
              <p className="text-[11.5px] text-zinc-500">
                Canonical opportunities published to DSRT Looking For
              </p>
            </div>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white text-black text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-40 transition-colors shadow-sm"
          >
            {creating ? (
              <><CircleNotch size={13} className="animate-spin" /> Creating…</>
            ) : (
              <><Plus size={13} weight="bold" /> Post Open Role</>
            )}
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/[0.04]">
        <StatBlock
          icon={Briefcase}
          label="Active"
          value={totalActive}
          color="emerald"
        />
        <StatBlock
          icon={Users}
          label="Applications"
          value={totalApplications}
          color="blue"
        />
        <StatBlock
          icon={TrendUp}
          label="New This Week"
          value={totalNewApplications}
          color="amber"
          highlight={totalNewApplications > 0}
        />
      </div>
    </div>
  )
}

function StatBlock({
  icon: Icon, label, value, color, highlight
}: {
  icon: any
  label: string
  value: number
  color: 'emerald' | 'blue' | 'amber'
  highlight?: boolean
}) {
  const iconColor = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
  }[color]

  return (
    <div className={
      'p-3 rounded-lg border transition-colors ' +
      (highlight
        ? 'border-amber-500/20 bg-amber-500/[0.03]'
        : 'border-white/[0.04] bg-white/[0.01]')
    }>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} className={iconColor} weight="fill" />
        <p className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
          {label}
        </p>
      </div>
      <p className="text-[20px] font-bold text-white leading-none">
        {value}
      </p>
    </div>
  )
}