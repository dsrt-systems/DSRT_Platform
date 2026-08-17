import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { MainClientProviders } from '@/components/layout/MainClientProviders'

// Required: this layout uses auth cookies which are dynamic by nature.
// Prevents Next.js from attempting static prerender which crashes on useContext.
export const dynamic = 'force-dynamic'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_complete) redirect('/onboarding')

  return (
    <MainClientProviders>
      <div className="min-h-screen bg-background">
        <Navbar user={profile} />
        <Sidebar user={profile} />
        <main className="md:ml-56 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </MainClientProviders>
  )
}
