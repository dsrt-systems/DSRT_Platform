'use client'

import Link from 'next/link'
import { Search, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
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
import { useState, useEffect, useRef } from 'react'

interface NavbarProps {
  user: any
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
      setSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const totalResults =
    (results?.users?.length || 0) +
    (results?.projects?.length || 0) +
    (results?.ventures?.length || 0) +
    (results?.communities?.length || 0)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="flex h-14 items-center px-4 gap-4">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">D</span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden md:block">
            DSRT
          </span>
        </Link>

        <div className="flex-1 max-w-2xl mx-auto relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search builders, projects, ventures, communities..."
              className="pl-9 h-9 bg-muted/40 border-border/40 focus-visible:ring-1"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {showResults && results && totalResults > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-border bg-popover shadow-lg max-h-96 overflow-y-auto z-50">
              {results.users?.length > 0 && (
                <div>
                  <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                    People
                  </p>
                  {results.users.map((u: any) => (
                    <Link
                      key={u.id}
                      href={`/profile/${u.username}`}
                      onClick={() => setShowResults(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {u.full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{u.username}
                          {u.tagline && ` · ${u.tagline}`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.projects?.length > 0 && (
                <div>
                  <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                    Projects
                  </p>
                  {results.projects.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.slug}`}
                      onClick={() => setShowResults(false)}
                      className="block px-3 py-2 hover:bg-muted/50"
                    >
                      <p className="text-sm font-medium">{p.title}</p>
                      {p.tagline && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {p.tagline}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {results.ventures?.length > 0 && (
                <div>
                  <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                    Ventures
                  </p>
                  {results.ventures.map((v: any) => (
                    <Link
                      key={v.id}
                      href={`/ventures/${v.slug}`}
                      onClick={() => setShowResults(false)}
                      className="block px-3 py-2 hover:bg-muted/50"
                    >
                      <p className="text-sm font-medium">{v.name}</p>
                      {v.tagline && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {v.tagline}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {results.communities?.length > 0 && (
                <div>
                  <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                    Communities
                  </p>
                  {results.communities.map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/community/${c.slug}`}
                      onClick={() => setShowResults(false)}
                      className="block px-3 py-2 hover:bg-muted/50"
                    >
                      <p className="text-sm font-medium">{c.name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {showResults && query.length >= 2 && results && totalResults === 0 && !searching && (
            <div className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-border bg-popover shadow-lg p-4 text-center text-sm text-muted-foreground z-50">
              No results for &quot;{query}&quot;
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Build</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>What are you starting?</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/projects/new">
                  <span className="mr-2">⚡</span>
                  New Project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ventures/new">
                  <span className="mr-2">🚀</span>
                  New Venture
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/feed?compose=true">
                  <span className="mr-2">📝</span>
                  Share Build Log
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-9 h-9 p-0 rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user.full_name}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    @{user.username}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user.username}`}>My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/projects">My Projects</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ventures">My Ventures</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/games">🎮 Games</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
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