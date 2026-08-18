'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { MagnifyingGlass, Plus, EnvelopeSimple } from '@phosphor-icons/react'
import { NotificationsDropdown } from './notifications/NotificationsDropdown'

interface Props {
  currentUser: any
}

export function HomeHeader({ currentUser }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('home-search-input')?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const openComposer = () => document.getElementById('home-composer-bar')?.click()

  return (
    <header className="sticky top-0 z-30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="max-w-[1400px] mx-auto h-[64px] flex items-center justify-between gap-6">
        {/* Left: Title */}
        <div className="shrink-0">
          <h1 className="text-[22px] font-bold text-white leading-none tracking-tight">Home</h1>
          <p className="text-[11.5px] text-zinc-500 mt-1 leading-none">
            What&apos;s happening across DSRT
          </p>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <MagnifyingGlass
              size={15}
              weight="regular"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors pointer-events-none"
            />
            <input
              id="home-search-input"
              type="text"
              placeholder="Search DSRT — people, ventures, posts"
              className={
                'w-full h-10 pl-10 pr-16 rounded-lg text-[13.5px] text-zinc-100 placeholder:text-zinc-500 ' +
                'bg-zinc-900/70 border border-zinc-800/80 ' +
                'focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.03)] ' +
                'transition-all'
              }
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-zinc-500 bg-zinc-950 border border-zinc-800 px-1.5 h-5 rounded flex items-center gap-0.5">
              <span>⌘</span><span>K</span>
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={openComposer}
            aria-label="Create post"
            className={
              'inline-flex items-center justify-center w-10 h-10 rounded-lg ' +
              'bg-white text-black hover:bg-zinc-100 ' +
              'transition-all ' +
              'shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]'
            }
          >
            <Plus size={15} weight="bold" />
          </button>

          <NotificationsDropdown currentUser={currentUser} />
          <HeaderIconLink href="/inbox" Icon={EnvelopeSimple} label="Messages" />

          <Link
            href={`/profile/${currentUser?.username || ''}`}
            aria-label="Your profile"
            className="ml-1 w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 flex items-center justify-center transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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
      className={
        'relative w-10 h-10 rounded-lg flex items-center justify-center ' +
        'text-zinc-400 hover:text-white ' +
        'bg-transparent hover:bg-zinc-900 ' +
        'border border-transparent hover:border-zinc-800 ' +
        'transition-all'
      }
    >
      <Icon size={16} weight="regular" />
    </Link>
  )
}