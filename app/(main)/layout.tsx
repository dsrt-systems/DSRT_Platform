import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { MainClientProviders } from '@/components/layout/MainClientProviders'

// Import global mail infrastructure
import { MailIdentityProvider } from '@/components/mail/hooks/useMailIdentity'
import { ComposerProvider } from '@/components/mail/composer/ComposerContext'
import { ComposerModal } from '@/components/mail/composer/ComposerModal'

export const dynamic = 'force-dynamic'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Auto-provision profile row if user exists in Auth but missing in public.users
  if (!profile) {
    const email = user.email || ''
    const usernameBase = (email.split('@')[0] || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      usernameBase

    const { data: newProfile } = await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email,
          full_name: fullName,
          username: usernameBase,
          onboarding_complete: true,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single()

    profile = newProfile || {
      id: user.id,
      email,
      full_name: fullName,
      username: usernameBase,
      onboarding_complete: true,
    }
  }

  return (
    <MainClientProviders>
      <MailIdentityProvider>
        <ComposerProvider>
          <div className="min-h-screen bg-background">
            <Navbar user={profile} />
            <Sidebar user={profile} />
            <main className="md:ml-56 min-h-[calc(100vh-3.5rem)]">
              {children}
            </main>
          </div>
          <ComposerModal />
        </ComposerProvider>
      </MailIdentityProvider>
    </MainClientProviders>
  )
}