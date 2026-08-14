import { VentureDetailPage } from '@/components/venture-detail/VentureDetailPage'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function VentureSlugPage({ params }: Props) {
  const { slug } = await params
  return <VentureDetailPage slug={slug} />
}