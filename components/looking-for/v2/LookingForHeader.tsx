'use client'

import { Plus } from '@phosphor-icons/react'

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

      <button
        onClick={onCreate}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-white text-black hover:bg-zinc-200 text-[13.5px] font-semibold transition-colors shrink-0"
      >
        <Plus size={13} weight="bold" />
        Create Opportunity
      </button>
    </div>
  )
}