import { createClient } from '@/lib/supabase/server'
import { InvestorSettings } from '@/components/settings/InvestorSettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'

export default async function SettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      <NotificationSettings profile={profile} />
      <InvestorSettings profile={profile} />
    </div>
  )
}