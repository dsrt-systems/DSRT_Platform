'use client'

import { MagnifyingGlass, Sparkle, Gear, List, Command } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { AccountSwitcher } from './AccountSwitcher'
import Link from 'next/link'

interface Props {
  onToggleSidebar: () => void
  searchQ: string
  onSearchChange: (q: string) => void
  onToggleCoco: () => void
  cocoOpen: boolean
}

export function MailTopbar({ 
  onToggleSidebar, searchQ, onSearchChange, onToggleCoco, cocoOpen 
}: Props) {
  return (
    <div className={cn(
      "h-14 flex items-center px-4 gap-4 flex-shrink-0 border-b border-white/[0.06]",
      "bg-gradient-to-b from-[#0d0d13] via-[#0b0b10] to-[#08080c]"
    )}>
      {/* Left */}
      <div className="flex items-center gap-2.5 min-w-[200px]">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center transition-colors"
          title="Toggle sidebar"
        >
          <List className="w-4 h-4" weight="bold" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-white to-zinc-400 flex items-center justify-center">
            <span className="text-black font-black text-[10px]">D</span>
          </div>
          <h1 className="text-[14px] font-bold text-white tracking-tight">
            DSRT <span className="text-white/50 font-medium">Mail</span>
          </h1>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-[560px] mx-auto">
        <div className="relative group">
          <MagnifyingGlass className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/70 transition-colors" />
          <input
            value={searchQ}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search mail, people, projects, ventures..."
            className={cn(
              "w-full h-9 pl-10 pr-14 rounded-lg",
              "bg-white/[0.04] border border-white/[0.06]",
              "text-[12.5px] text-white placeholder:text-white/40",
              "focus:outline-none focus:border-white/[0.18] focus:bg-white/[0.06]",
              "transition-all"
            )}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08]">
            <Command className="w-2.5 h-2.5 text-white/45" weight="bold" />
            <span className="text-[9px] font-bold text-white/45">K</span>
          </div>
        </div>
      </div>

      {/* Right: COCO + Settings + Account */}
      <div className="flex items-center gap-1.5 min-w-[200px] justify-end">
        <button
          onClick={onToggleCoco}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all border",
            cocoOpen 
              ? "bg-gradient-to-br from-violet-500/20 to-blue-500/20 border-violet-500/30 text-violet-300"
              : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] text-white/60 hover:text-white"
          )}
          title="Ask COCO"
        >
          <Sparkle className="w-4 h-4" weight={cocoOpen ? "fill" : "regular"} />
        </button>

        <Link
          href="/inbox/settings"
          className="w-9 h-9 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center transition-colors border border-transparent hover:border-white/[0.06]"
          title="Settings"
        >
          <Gear className="w-4 h-4" />
        </Link>

        <div className="w-px h-6 bg-white/[0.08] mx-1" />

        <AccountSwitcher />
      </div>
    </div>
  )
}