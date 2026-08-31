import { ThreadDetailPage } from '@/components/mail/ThreadDetailPage'
import { MailErrorBoundary } from '@/components/mail/MailErrorBoundary'

export const metadata = {
  title: 'Conversation | DSRT Mail',
}

export const dynamic = 'force-dynamic'

export default async function Page({
  params,
}: {
  params: Promise<{ threadId: string }>
}) {
  const { threadId } = await params

  return (
    <MailErrorBoundary label="Conversation">
      <ThreadDetailPage threadId={threadId} />
    </MailErrorBoundary>
  )
}