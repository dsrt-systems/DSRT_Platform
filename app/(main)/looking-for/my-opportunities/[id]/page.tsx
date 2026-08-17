import { ApplicantsWorkspace } from '@/components/looking-for/v2/manage/ApplicantsWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ApplicantsWorkspace opportunityId={id} />
}