'use client'

import { Info } from '@phosphor-icons/react'

export function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-flex items-center justify-center ml-1.5 align-middle">
      <Info size={14} weight="fill" className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl text-[11.5px] text-zinc-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center font-normal normal-case tracking-normal leading-relaxed pointer-events-none">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-700" />
      </div>
    </div>
  )
}