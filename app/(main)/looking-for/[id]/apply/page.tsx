'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Warning } from '@phosphor-icons/react'
import Link from 'next/link'

export default function ApplyInitPage() {
  const router = useRouter()
  const routeParams = useParams<{ id: string }>()
  const oppId = typeof routeParams?.id === 'string' ? routeParams.id : null

  const [error, setError] = useState<string | null>(null)
  const initRef = useRef(false)

  useEffect(() => {
    if (!oppId || initRef.current) return
    initRef.current = true

    ;(async () => {
      try {
        const res = await fetch(`/api/opportunities/${oppId}/apply/init`, {
          method: 'POST',
        })
        const d = await res.json().catch(() => ({}))

        // Already applied (not draft/withdrawn) → block
        if (res.status === 409 && d?.status && d.status !== 'draft') {
          setError('You have already applied to this opportunity.')
          return
        }

        if (!res.ok) {
          throw new Error(d?.error || 'Failed to start application')
        }

        if (!d?.application_id) {
          throw new Error('Server did not return an application id')
        }

        router.replace(`/looking-for/${oppId}/apply/${d.application_id}`)
      } catch (e: any) {
        setError(e?.message || 'Failed to start application')
      }
    })()
  }, [oppId, router])

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex items-center justify-center">
      {error ? (
        <div className="text-center max-w-sm px-4">
          <Warning size={24} className="mx-auto mb-3 text-red-400" />
          <div className="text-[15px] font-bold text-white mb-2">{error}</div>
          <Link
            href={oppId ? `/looking-for/${oppId}` : '/looking-for'}
            className="h-9 px-4 rounded-xl border border-zinc-800 text-[13px] text-zinc-300 hover:text-white inline-flex items-center"
          >
            Back to Opportunity
          </Link>
        </div>
      ) : (
        <div className="text-[13px] text-zinc-500 font-medium">
          Preparing application studio…
        </div>
      )}
    </div>
  )
}