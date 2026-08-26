'use client'

import { Plus, Briefcase } from '@phosphor-icons/react'
import Link from 'next/link'

interface Props {
  onCreate: () => void
}

export function LookingForHeader({ onCreate }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight text-white leading-tight">
          Looking For
        </h1>
        <p className="text-[13.5px] text-zinc-400 mt-1">
          Find people to build, work, and grow with.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/looking-for/my-opportunities"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 text-[13px] text-zinc-300 hover:text-white font-semibold transition-colors"
        >
          <Briefcase size={14} weight="fill" />
          Dashboard
        </Link>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 text-[13px] font-semibold transition-colors shadow-[0_2px_12px_rgba(255,255,255,0.1)]"
        >
          <Plus size={13} weight="bold" />
          Create Opportunity
        </button>
      </div>
    </div>
  )
}