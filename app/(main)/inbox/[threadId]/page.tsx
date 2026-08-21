import { ThreadDetailPage } from '@/components/mail/ThreadDetailPage'

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
  
  return <ThreadDetailPage threadId={threadId} />
}