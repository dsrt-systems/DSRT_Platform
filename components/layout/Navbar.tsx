'use client'

import Link from 'next/link'
import { Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { DsrtConnectLogo } from '@/components/ui/DsrtConnectLogo'

interface NavbarProps {
  user: any
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <header
      className={
        'sticky top-0 z-40 w-full ' +
        'border-b border-zinc-800/70 ' +
        'bg-gradient-to-b from-[#121214] via-[#0c0c0e] to-[#0a0a0b] ' +
        'backdrop-blur-xl ' +
        'shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]'
      }
    >
      {/* Taller bar with increased vertical padding (76px) */}
      <div className="flex h-[76px] items-center px-4 md:px-6 gap-5">
        
        {/* LEFT: Logo & Brand (No subtitle) */}
        <Link
          href="/home"
          className="flex items-center gap-3 shrink-0 group"
        >
          <DsrtConnectLogo
            size={40}
            className="transition-transform duration-200 group-hover:scale-[1.03]"
          />
          <span className="font-bold text-[18px] tracking-tight text-white whitespace-nowrap">
            DSRT Connect
          </span>
        </Link>

        {/* CENTER-LEFT: Search Bar (Pushed left, closer to logo) */}
        <div className="flex-1 max-w-2xl mr-auto ml-2">
          <GlobalSearch />
        </div>

        {/* RIGHT: Actions (Pushed entirely to the right) */}
        <div className="flex items-center gap-4 shrink-0 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className={
                  'h-10 gap-1.5 px-4 rounded-xl font-semibold ' +
                  'bg-gradient-to-b from-white to-zinc-200 text-black ' +
                  'hover:from-white hover:to-white ' +
                  'border border-white/20 ' +
                  'shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7)]'
                }
              >
                <Plus className="w-4 h-4" />
                New
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 bg-[#0f0f11] border-zinc-800 text-white rounded-xl shadow-2xl"
            >
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-zinc-900">
                <Link href="/projects/new">New Project</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-zinc-900">
                <Link href="/ventures/new">New Venture</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-zinc-900">
                <Link href="/home">New Post</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-zinc-900">
                <Link href="/looking-for/create">New Opportunity</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationsDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={
                  'flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl ' +
                  'border border-transparent hover:border-zinc-800 ' +
                  'bg-transparent hover:bg-zinc-900/60 transition-all'
                }
              >
                <Avatar className="w-10 h-10 border border-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="text-xs bg-zinc-900 text-zinc-400">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left min-w-0">
                  <p className="text-[14px] font-semibold leading-tight text-white truncate max-w-[130px]">
                    {user?.full_name}
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-tight capitalize mt-0.5 truncate max-w-[130px]">
                    {user?.brings?.[0] || 'Builder'}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#0f0f11] border-zinc-800 text-white rounded-xl shadow-2xl"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium text-white">{user?.full_name}</span>
                  <span className="text-xs text-zinc-500 font-normal">
                    @{user?.username}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-zinc-900">
                <Link href={`/profile/${user?.username}`}>View Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-zinc-900">
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 focus:text-red-400 focus:bg-zinc-900 cursor-pointer"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}