import { VenturesDashboard } from '@/components/ventures-hub/VenturesDashboard'

export const metadata = {
  title: 'Ventures | DSRT Connect',
  description: 'Build, grow and discover ambitious companies.',
}

export const dynamic = 'force-dynamic'

export default function VenturesPage() {
  return <VenturesDashboard />
}
