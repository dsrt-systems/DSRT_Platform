'use client'

import { useState, useEffect } from 'react'
import { X, CircleNotch, Link as LinkIcon, Plus, ArrowRight, LinkBreak } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  position: any | null
  onSuccess: () => void
}

export function LinkOpportunityModal({ open, onClose, slug, position, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    if (!open || !position) return
    let cancelled = false
    const fetchOpps = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user && !cancelled) {
        const { data } = await supabase
          .from('opportunities')
          .select('id, title, status, linked_position_id')
          .eq('poster_user_id', user.id)
          .in('status', ['draft', 'active', 'open', 'closing-soon'])
          .order('created_at', { ascending: false })
        
        setOpportunities(data || [])
      }
      setLoading(false)
      setSelectedId(position.linked_opportunity_id || '')
    }
    fetchOpps()
    return () => { cancelled = true }
  }, [open, position, supabase])

  if (!open || !position) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { opportunity_id: selectedId || null }
      const res = await fetch(`/api/ventures/${slug}/team/positions/${position.id}/link`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to link')

      toast.success(selectedId ? 'Opportunity linked' : 'Opportunity unlinked')
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Error linking opportunity')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNew = async () => {
    setCreating(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/open-roles/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position_id: position.id, title: position.title })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create draft')
      
      if (json.draft_id) {
        toast.success('Draft created. Opening Opportunity Studio...')
        router.push(json.studio_url || `/looking-for/create-v2/${json.draft_id}`)
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to create new opportunity draft')
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
          <div>
            <h2 className="text-[15px] font-bold text-white">Link Public Opportunity</h2>
            <p className="text-[11.5px] text-zinc-400 mt-0.5">Attach a role to <strong className="text-white">{position.title}</strong></p>
          </div>
          <button onClick={onClose} disabled={creating || saving} className="text-zinc-500 hover:text-white disabled:opacity-50"><X size={16} /></button>
        </div>
        
        <div className="p-5 space-y-5">
          {loading ? (
            <div className="flex justify-center py-6"><CircleNotch size={18} className="animate-spin text-zinc-500" /></div>
          ) : (
            <>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedId('')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedId === '' ? 'border-white/20 bg-white/[0.06]' : 'border-white/[0.06] bg-[#0d0d10] hover:border-white/[0.12]'}`}
                >
                  <LinkBreak size={16} className="text-zinc-500" />
                  <div>
                    <p className="text-[12.5px] font-bold text-white">No Link</p>
                    <p className="text-[10.5px] text-zinc-500">Disconnect from Looking For</p>
                  </div>
                </button>

                {opportunities.map(opp => {
                  const isLinkedToOther = opp.linked_position_id && opp.linked_position_id !== position.id
                  const isSelected = selectedId === opp.id
                  return (
                    <button
                      key={opp.id}
                      onClick={() => !isLinkedToOther && setSelectedId(opp.id)}
                      disabled={isLinkedToOther}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? 'border-white/20 bg-white/[0.06]' : isLinkedToOther ? 'border-white/[0.02] bg-transparent opacity-50 cursor-not-allowed' : 'border-white/[0.06] bg-[#0d0d10] hover:border-white/[0.12]'}`}
                    >
                      <LinkIcon size={16} className={isSelected ? 'text-emerald-400' : 'text-zinc-500'} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-bold text-white truncate">{opp.title}</p>
                        <p className="text-[10.5px] text-zinc-500 truncate capitalize">{opp.status} {isLinkedToOther ? '(Linked elsewhere)' : ''}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px bg-zinc-800 flex-1" />
                <span className="text-[10px] uppercase font-bold text-zinc-500">OR</span>
                <div className="h-px bg-zinc-800 flex-1" />
              </div>

              <button 
                onClick={handleCreateNew}
                disabled={creating}
                className="w-full flex items-center justify-between px-4 h-11 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-white/[0.02] text-[13px] font-semibold text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {creating ? <CircleNotch size={15} className="animate-spin" /> : <Plus size={15} weight="bold" />}
                  <span>Create new opportunity draft</span>
                </div>
                <ArrowRight size={14} className="text-zinc-600" />
              </button>
            </>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end gap-2">
          <button onClick={onClose} disabled={creating || saving} className="px-4 h-9 text-[12.5px] font-semibold text-zinc-400 hover:text-white disabled:opacity-50">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={saving || loading || creating || selectedId === (position.linked_opportunity_id || '')}
            className="inline-flex items-center justify-center gap-1.5 px-5 h-9 bg-white text-black rounded-lg text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-50"
          >
            {saving ? <CircleNotch size={14} className="animate-spin" /> : <><LinkIcon size={14} weight="bold"/> Save Link</>}
          </button>
        </div>
      </div>
    </div>
  )
}