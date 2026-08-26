'use client'

import Link from 'next/link'
import { Plus, EnvelopeSimple } from '@phosphor-icons/react'
import { NotificationsDropdown } from './notifications/NotificationsDropdown'

interface Props {
  currentUser: any
}

export function HomeHeader({ currentUser }: Props) {
  const openComposer = () => document.getElementById('home-composer-bar')?.click()

  return (
    <header className="sticky top-[76px] z-30 -mx-4 md:-mx-5 lg:-mx-6 xl:-mx-8 px-4 md:px-5 lg:px-6 xl:px-8 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="h-[64px] flex items-center justify-between gap-6">
        
        {/* Left: Title */}
        <div className="shrink-0">
          <h1 className="text-[22px] font-bold text-white leading-none tracking-tight">Home</h1>
          <p className="text-[11.5px] text-zinc-500 mt-1.5 leading-none">
            What's happening across DSRT
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openComposer}
            aria-label="Create post"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          >
            <Plus size={16} weight="bold" />
          </button>

          <NotificationsDropdown currentUser={currentUser} />
          <HeaderIconLink href="/inbox" Icon={EnvelopeSimple} label="Messages" />

          <Link
            href={`/profile/${currentUser?.username || ''}`}
            aria-label="Your profile"
            className="ml-1 w-9 h-9 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 flex items-center justify-center transition-all"
          >
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[12px] font-bold text-zinc-400">
                {(currentUser?.full_name || currentUser?.username || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeaderIconLink({ href, Icon, label }: { href: string; Icon: any; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
    >
      <Icon size={18} weight="regular" />
    </Link>
  )
}