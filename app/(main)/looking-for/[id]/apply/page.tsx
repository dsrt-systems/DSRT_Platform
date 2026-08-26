'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Warning } from '@phosphor-icons/react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ApplyInitPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [oppId, setOppId] = useState<string | null>(null)
  const initRef = useRef(false)

  useEffect(() => {
    params.then(p => setOppId(p.id))
  }, [params])

  useEffect(() => {
    if (!oppId || initRef.current) return
    initRef.current = true

    ;(async () => {
      try {
        const res = await fetch(`/api/opportunities/${oppId}/apply/init`, { method: 'POST' })
        const d = await res.json()
        if (res.status === 409 && d.status !== 'draft') {
          setError('You have already applied to this opportunity.')
          return
        }
        if (!res.ok) throw new Error(d?.error || 'Failed to start application')
        
        router.replace(`/looking-for/${oppId}/apply/${d.application_id}`)
      } catch (e: any) {
        setError(e?.message || 'Failed')
      }
    })()
  }, [oppId, router])

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex items-center justify-center">
      {error ? (
        <div className="text-center max-w-sm px-4">
          <Warning size={24} className="mx-auto mb-3 text-red-400" />
          <div className="text-[15px] font-bold text-white mb-2">{error}</div>
          <Link href={`/looking-for/${oppId}`} className="h-9 px-4 rounded-xl border border-zinc-800 text-[13px] text-zinc-300 hover:text-white inline-flex items-center">
            Back to Opportunity
          </Link>
        </div>
      ) : (
        <div className="text-[13px] text-zinc-500 font-medium">Preparing application studio…</div>
      )}
    </div>
  )
}