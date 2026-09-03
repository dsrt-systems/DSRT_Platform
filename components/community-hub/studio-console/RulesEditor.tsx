'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, ScrollText, Trash2, GripVertical } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { SectionHeader, LoadingState } from '@/components/kernel-ui'

interface Props {
  slug: string
}

export function RulesEditor({ slug }: Props) {
  const [rules, setRules] = useState<Array<{ title: string; description?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/community/${slug}/studio/rules`)
      .then((r) => r.json())
      .then((j) => setRules((j?.data?.items || []).map((r: any) => ({ title: r.title, description: r.description || '' }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const add = () => setRules((prev) => [...prev, { title: '', description: '' }])
  const remove = (i: number) => setRules((prev) => prev.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const next = i + dir
    if (next < 0 || next >= rules.length) return
    setRules((prev) => {
      const copy = [...prev]
      ;[copy[i], copy[next]] = [copy[next], copy[i]]
      return copy
    })
  }
  const setRule = (i: number, patch: Partial<{ title: string; description: string }>) => {
    setRules((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  const save = async () => {
    const cleaned = rules.filter((r) => r.title.trim())
    if (cleaned.length === 0) {
      toast.error('Add at least one rule')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/community/${slug}/studio/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: cleaned }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error?.message || 'Save failed')
        return
      }
      toast.success('Rules saved')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading rules…" />

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-4">
        <SectionHeader title="Community rules" description="Displayed on your public page. Rules are enforced by moderation." variant="mono" />
        <div className="flex items-center gap-2">
          <button
            onClick={add}
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/80 hover:text-white px-3 py-1.5 text-[12px] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Add rule
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-full bg-white text-black hover:bg-zinc-100 px-4 py-1.5 text-[12px] font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" strokeWidth={1.75} />}
            Save changes
          </button>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <ScrollText className="w-6 h-6 text-white/40 mx-auto mb-2" strokeWidth={1.75} />
          <p className="text-[13px] text-white/60">No rules yet. Add your first rule to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((r, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-white/30 hover:text-white/70 disabled:opacity-30">
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-white/40">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  value={r.title}
                  onChange={(e) => setRule(i, { title: e.target.value })}
                  placeholder="Rule title"
                  className="w-full rounded-md border border-white/[0.06] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[13px] text-white placeholder:text-white/30"
                />
                <textarea
                  value={r.description || ''}
                  onChange={(e) => setRule(i, { description: e.target.value })}
                  rows={2}
                  placeholder="Description (optional)"
                  className="w-full rounded-md border border-white/[0.06] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[12.5px] text-white placeholder:text-white/30 resize-none"
                />
              </div>
              <button
                onClick={() => remove(i)}
                className="w-7 h-7 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}