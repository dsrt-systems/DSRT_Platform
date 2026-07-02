import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { MessagesPanel } from '@/components/messages/MessagesPanel'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_complete) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />
      <div className="flex">
        <Sidebar user={profile} />
        <main className="flex-1 min-h-[calc(100vh-3.5rem)] md:ml-72 lg:mr-80">
          {children}
        </main>
        <RightSidebar user={profile} />
      </div>
      <MessagesPanel user={profile} />
    </div>
  )
}