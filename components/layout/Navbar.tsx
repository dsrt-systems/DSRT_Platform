'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, List, CaretDown, SignOut } from '@phosphor-icons/react'
import { DsrtConnectLogo } from '@/components/ui/DsrtConnectLogo'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown'
import { MailIconButton } from './MailIconButton'
import { DsrtButton, DsrtAvatar } from '@/components/dsrt'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavbarProps {
  user: any
  onMenuClick: () => void
  handleLogout: () => void
}

export function Navbar({ user, onMenuClick, handleLogout }: NavbarProps) {
  const pathname = usePathname()
  const isMailRoute = pathname?.startsWith('/inbox')

  return (
    <header className="fixed top-0 inset-x-0 z-[60] bg-[#05070D]/95 backdrop-blur-md border-b border-white/[0.06] flex flex-col shadow-sm">
      <div className="h-[64px] flex items-center justify-between px-3 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onMenuClick}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Toggle sidebar"
          >
            <List size={20} weight="bold" />
          </button>

          {/* UPDATED LOGO & BRANDING BLOCK */}
          <Link href="/home" className="flex items-center gap-2 sm:gap-3 group pt-1">
            <DsrtConnectLogo size={28} className="transition-transform duration-200 group-hover:scale-105 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-[16px] tracking-tight text-white leading-none">
                DSRT Connect
              </span>
              <span className="font-cursive text-[14px] sm:text-[17px] text-white/90 leading-none mt-1 whitespace-nowrap hidden xs:block sm:block">
                Banaya Connections jo kaam aaya !!
              </span>
            </div>
          </Link>
        </div>

        {/* Global search — hidden entirely inside DSRT Mail */}
        {!isMailRoute && (
          <div className="hidden md:flex flex-1 max-w-xl mx-auto px-4">
            <GlobalSearch />
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="hidden sm:block">
            <NewDropdown />
          </div>

          <MailIconButton userId={user?.id} />
          <NotificationsDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full hover:bg-white/[0.06] transition-colors outline-none ml-1">
                <DsrtAvatar src={user?.avatar_url} name={user?.full_name} size="sm" />
                <CaretDown size={12} weight="bold" className="text-white/40 hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0a0f1a] border-white/[0.08] text-white rounded-xl shadow-2xl mt-1 py-1">
              <div className="px-4 py-3 border-b border-white/[0.06] mb-1">
                <p className="text-[13px] font-bold text-white truncate">{user?.full_name}</p>
                <p className="text-[11px] font-mono text-white/40 truncate mt-0.5">@{user?.username}</p>
              </div>
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/[0.06] text-[13px] py-2 px-4 mx-1 rounded-lg">
                <Link href={`/profile/${user?.username}`}>View Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/[0.06] text-[13px] py-2 px-4 mx-1 rounded-lg">
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer focus:bg-red-500/10 text-red-400 focus:text-red-300 text-[13px] py-2 px-4 mx-1 rounded-lg flex items-center gap-2">
                <SignOut size={14} weight="bold" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile global search row — also hidden on Mail */}
      {!isMailRoute && (
        <div className="md:hidden px-3 pb-3 w-full">
          <GlobalSearch />
        </div>
      )}
    </header>
  )
}

function NewDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <DsrtButton size="xs" variant="white" className="h-8 px-3 gap-1.5">
          <Plus size={12} weight="bold" />
          <span>New</span>
        </DsrtButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-[#0a0f1a] border-white/[0.08] text-white rounded-xl shadow-2xl mt-1 py-1">
        <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/[0.06] text-[13px] py-2 px-3 mx-1 rounded-lg">
          <Link href="/projects/new">New Project</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/[0.06] text-[13px] py-2 px-3 mx-1 rounded-lg">
          <Link href="/ventures/new">New Venture</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/[0.06] text-[13px] py-2 px-3 mx-1 rounded-lg">
          <Link href="/home">New Post</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/[0.06] text-[13px] py-2 px-3 mx-1 rounded-lg">
          <Link href="/looking-for/create">New Opportunity</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}