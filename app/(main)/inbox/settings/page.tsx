import { Metadata } from 'next'
import { InboxSettingsPage } from '@/components/inbox/InboxSettingsPage'

export const metadata: Metadata = { title: 'Inbox Settings · DSRT' }
export const dynamic = 'force-dynamic'

export default function Page() {
  return <InboxSettingsPage />
}
