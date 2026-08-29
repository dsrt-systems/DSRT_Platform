'use client'

import { useState, useEffect } from 'react'
import { X, MagnifyingGlass, CircleNotch, PaperPlaneRight } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  position: any
  onSuccess: () => void
}

export function TeamInviteModal({ open, onClose, slug, position, onSuccess }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`)
        const data = await res.json()
        setResults(data.users || [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  if (!open || !position) return null

  const handleSend = async () => {
    if (!selectedUser) return
    setSending(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/team/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invited_user_id: selectedUser.id,
          position_id: position.id,
          personal_message: message.trim() || null
        })
      })
      
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to send invite')
      
      toast.success(`Invitation sent to ${selectedUser.full_name}`)
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
          <div>
            <h2 className="text-[15px] font-bold text-white">Invite to Team</h2>
            <p className="text-[11.5px] text-zinc-400 mt-0.5">Inviting for: <strong className="text-white">{position.title}</strong></p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16} /></button>
        </div>
        
        <div className="p-5">
          {!selectedUser ? (
            <div>
              <div className="relative mb-3">
                <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search DSRT users by name or @username..."
                  className="w-full h-10 pl-9 pr-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="h-[200px] overflow-y-auto">
                {searching ? (
                  <div className="flex justify-center py-8"><CircleNotch size={18} className="animate-spin text-zinc-500" /></div>
                ) : results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                            {u.full_name?.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate">{u.full_name}</p>
                          <p className="text-[11px] text-zinc-500 truncate">@{u.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : query.length >= 2 ? (
                  <p className="text-center text-[12px] text-zinc-500 py-8">No users found.</p>
                ) : (
                  <p className="text-center text-[12px] text-zinc-600 py-8">Type to search the directory.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                      {selectedUser.full_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-[13px] font-semibold text-white">{selectedUser.full_name}</p>
                    <p className="text-[11px] text-zinc-500">@{selectedUser.username}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-[11px] font-semibold text-zinc-400 hover:text-white">Change</button>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-white mb-1.5">Personal Message (Optional)</label>
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Why they should join this mission..."
                  className="w-full p-3 bg-[#09090b] border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 h-10 bg-white text-black rounded-lg text-[13px] font-bold hover:bg-zinc-200 disabled:opacity-50"
                >
                  {sending ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneRight size={15} weight="fill" />}
                  Send Invitation
                </button>
                <p className="text-[10px] text-center text-zinc-500 mt-3">
                  They will receive an email and DSRT Mail notification.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}