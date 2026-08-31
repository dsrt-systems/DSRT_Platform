'use client'

import { MagnifyingGlass, Sparkle, Gear, List, Command } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { AccountSwitcher } from './AccountSwitcher'
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  onToggleSidebar: () => void
  searchQ: string
  onSearchChange: (q: string) => void
  onToggleCoco: () => void
  cocoOpen: boolean
}

export function MailTopbar({
  onToggleSidebar,
  searchQ,
  onSearchChange,
  onToggleCoco,
  cocoOpen,
}: Props) {
  return (
    <div
      className={cn(
        'h-[76px] flex items-center px-4 gap-4 flex-shrink-0 border-b border-white/[0.06]',
        'bg-gradient-to-b from-[#0d0d13] via-[#0b0b10] to-[#08080c]'
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-[240px]">
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center transition-colors"
          title="Toggle sidebar"
        >
          <List className="w-[19px] h-[19px]" weight="bold" />
        </button>

        <Link href="/inbox" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden">
            <Image
              src="/dsrt-mail-icon.png"
              alt="DSRT Mail"
              width={44}
              height={44}
              className="w-11 h-11 object-contain transition-transform group-hover:scale-[1.04]"
              priority
            />
          </div>
          <h1 className="text-[20px] font-bold text-white tracking-tight leading-none">
            DSRT <span className="text-white/50 font-medium">Mail</span>
          </h1>
        </Link>
      </div>

      {/* Center search */}
      <div className="flex-1 max-w-[580px] mx-auto">
        <div className="relative group">
          <MagnifyingGlass className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/70 transition-colors" />
          <input
            value={searchQ}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search mail, people, projects, ventures..."
            className={cn(
              'w-full h-10 pl-10 pr-14 rounded-lg',
              'bg-white/[0.04] border border-white/[0.06]',
              'text-[13px] text-white placeholder:text-white/40',
              'focus:outline-none focus:border-white/[0.18] focus:bg-white/[0.06]',
              'transition-all'
            )}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08]">
            <Command className="w-2.5 h-2.5 text-white/45" weight="bold" />
            <span className="text-[9px] font-bold text-white/45">K</span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 min-w-[200px] justify-end">
        <button
          onClick={onToggleCoco}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all border',
            cocoOpen
              ? 'bg-white/[0.08] border-white/[0.14] text-white'
              : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] text-white/60 hover:text-white'
          )}
          title="Ask COCO"
        >
          <Sparkle className="w-[18px] h-[18px]" weight={cocoOpen ? 'fill' : 'regular'} />
        </button>

        <Link
          href="/inbox/settings"
          className="w-10 h-10 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center transition-colors border border-transparent hover:border-white/[0.06]"
          title="Settings"
        >
          <Gear className="w-[18px] h-[18px]" />
        </Link>

        <div className="w-px h-6 bg-white/[0.08] mx-1" />

        <AccountSwitcher />
      </div>
    </div>
  )
}