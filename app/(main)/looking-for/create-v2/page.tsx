'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CreateV2Landing() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const created = useRef(false)

  useEffect(() => {
    if (created.current) return
    created.current = true
    ;(async () => {
      try {
        const res = await fetch('/api/opportunities/drafts', { method: 'POST' })
        const d = await res.json()
        if (!res.ok) throw new Error(d?.error || 'Failed to create draft')
        router.replace(`/looking-for/create-v2/${d.draft_id}`)
      } catch (e: any) {
        setError(e?.message || 'Failed')
      }
    })()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex items-center justify-center">
      {error ? (
        <div className="text-center">
          <div className="text-[15px] font-bold text-red-300 mb-1">Could not create draft</div>
          <div className="text-[12.5px] text-zinc-500">{error}</div>
        </div>
      ) : (
        <div className="text-[13px] text-zinc-500">Creating draft…</div>
      )}
    </div>
  )
}