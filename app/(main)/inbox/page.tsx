import { MailPage } from '@/components/mail/MailPage'

export const metadata = {
  title: 'DSRT Mail',
  description: 'Unified communication for DSRT Connect',
}

export const dynamic = 'force-dynamic'

export default function Page() {
  return <MailPage />
}