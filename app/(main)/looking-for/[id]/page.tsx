import { OpportunityDetailPage } from '@/components/looking-for/v2/detail/OpportunityDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OpportunityDetailPage id={id} />
}