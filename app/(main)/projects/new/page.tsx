'use client'

import { useRouter } from 'next/navigation'
import { CreateProjectWizard } from '@/components/project-detail/CreateProjectWizard'

export default function NewProjectPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <CreateProjectWizard onClose={() => router.push('/projects')} />
    </div>
  )
}
