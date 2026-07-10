'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Shield, LogOut, Trophy, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminNavProps {
  profile: any
}

export function AdminNav({ profile }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const isSuper = profile?.admin_role === 'dsrt_super_admin'

  const navItems = [
    { name: 'Hackathons', href: '/admin/hackathons', icon: Trophy },
    ...(isSuper
      ? [
          { name: 'Community Admins', href: '/admin/community-admins', icon: Users },
          { name: 'Settings', href: '/admin/settings', icon: Settings },
        ]
      : []),
  ]

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/admin/hackathons" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">DSRT Admin</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              {profile?.admin_role?.replace(/_/g, ' ')}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.name}
              </Link>
            )
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white/60 hover:text-white ml-2"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}