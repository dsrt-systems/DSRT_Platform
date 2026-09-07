'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { useNavBadges } from '@/hooks/useNavBadges'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CocoProvider } from '@/lib/coco/sdk'
import { CocoPageAutoWire } from '@/components/coco/CocoPageAutoWire'

// Desktop is 1 row (64px). Mobile is 2 rows (64px + 48px search = 112px).
const NAV_DESKTOP = 64
const NAV_MOBILE = 112 

export function AppShell({ user, children }: { user: any; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const badges = useNavBadges(user?.id)
  const supabase = createClient()

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  // Mail route hides the mobile search bar, so it stays 64px everywhere.
  const isMailRoute = pathname?.startsWith('/inbox')

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const handleMenuToggle = () => {
    if (window.innerWidth < 1024) setIsMobileOpen(true)
    else setIsDesktopCollapsed(!isDesktopCollapsed)
  }

  return (
    <CocoProvider>
      <CocoPageAutoWire />

      {/* Responsive CSS Variable for sticky elements like the Sidebar */}
      <style jsx global>{`
        :root {
          --dsrt-nav-h: ${isMailRoute ? NAV_DESKTOP : NAV_MOBILE}px;
        }
        @media (min-width: 768px) {
          :root {
            --dsrt-nav-h: ${NAV_DESKTOP}px;
          }
        }
      `}</style>

      <div className="flex flex-col min-h-screen bg-[#05070D]">
        <Navbar user={user} onMenuClick={handleMenuToggle} handleLogout={handleLogout} />

        {/* Responsive top padding so content never hides under the navbar */}
        <div 
          className={cn(
            "flex flex-1", 
            isMailRoute ? "pt-[64px]" : "pt-[112px] md:pt-[64px]"
          )}
        >
          <Sidebar
            user={user}
            badges={badges}
            isCollapsed={isDesktopCollapsed}
            isMobileOpen={isMobileOpen}
            onCloseMobile={() => setIsMobileOpen(false)}
            onLogout={handleLogout}
          />

          <main className="flex-1 flex flex-col min-w-0 bg-[#05070D] relative">
            <div
              className={cn(
                'flex-1 w-full min-w-0 overflow-x-clip',
                isMailRoute ? 'pb-0' : 'pb-12'
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </CocoProvider>
  )
}