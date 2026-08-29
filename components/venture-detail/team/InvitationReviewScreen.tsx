'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, Clock, CircleNotch, ArrowRight,
  ShieldCheck, Buildings, UsersThree, ChatText
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  invitationIdOrToken: string
}

export function InvitationReviewScreen({ invitationIdOrToken }: Props) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [holdMsg, setHoldMsg] = useState('')
  const [declineMsg, setDeclineMsg] = useState('')
  const [mode, setMode] = useState<'review' | 'hold_input' | 'decline_input'>('review')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/venture-invitations/${invitationIdOrToken}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load invitation')
      setData(json)

      // Auto-mark viewed if sent
      if (json.invitation?.status === 'sent') {
        fetch(`/api/venture-invitations/${invitationIdOrToken}/view`, { method: 'POST' }).catch(() => {})
      }
    } catch (e: any) {
      setError(e.message || 'Invitation not found')
    } finally {
      setLoading(false)
    }
  }, [invitationIdOrToken])

  useEffect(() => { load() }, [load])

  const handleAccept = async () => {
    setActionBusy(true)
    try {
      const res = await fetch(`/api/venture-invitations/${invitationIdOrToken}/accept`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to accept')

      toast.success('Invitation accepted! Welcome to the team.')
      if (json.redirect_url) {
        router.push(json.redirect_url)
      } else {
        router.push(`/ventures/${json.venture_slug}`)
      }
    } catch (e: any) {
      toast.error(e.message || 'Could not accept invitation')
      setActionBusy(false)
    }
  }

  const handleHold = async () => {
    setActionBusy(true)
    try {
      const res = await fetch(`/api/venture-invitations/${invitationIdOrToken}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: holdMsg })
      })
      if (!res.ok) throw new Error('Failed to hold invitation')

      toast.success('Invitation placed on hold')
      await load()
      setMode('review')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionBusy(false)
    }
  }

  const handleDecline = async () => {
    setActionBusy(true)
    try {
      const res = await fetch(`/api/venture-invitations/${invitationIdOrToken}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: declineMsg })
      })
      if (!res.ok) throw new Error('Failed to decline invitation')

      toast.info('Invitation declined')
      await load()
      setMode('review')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-[13px] text-zinc-400">
          <CircleNotch size={18} className="animate-spin" /> Loading invitation details…
        </div>
      </div>
    )
  }

  if (error || !data?.invitation) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-[#121215] border border-zinc-800 rounded-2xl p-8">
          <XCircle size={32} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-[18px] font-bold text-white mb-1">Invitation Unavailable</h2>
          <p className="text-[13px] text-zinc-400 mb-6">{error || 'This invitation does not exist or has been removed.'}</p>
          <button onClick={() => router.push('/ventures')} className="h-9 px-4 bg-white text-black text-[12.5px] font-bold rounded-lg hover:bg-zinc-200">
            Back to Ventures
          </button>
        </div>
      </div>
    )
  }

  const { invitation, is_expired } = data
  const venture = invitation.venture || invitation.venture_snapshot || {}
  const inviter = invitation.invited_by || invitation.inviter_snapshot || {}
  const isAccepted = invitation.status === 'accepted'
  const isHeld = invitation.status === 'held'
  const isRejected = invitation.status === 'rejected'

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl bg-[#121215] border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl">

        {/* Banner Header */}
        <div className="relative h-32 bg-zinc-900 overflow-hidden">
          {venture.cover_url ? (
            <img src={venture.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="px-6 pb-8 -mt-10 relative z-10">

          {/* Logo & Identity */}
          <div className="flex items-end justify-between gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-[#121215] border-2 border-zinc-800 overflow-hidden flex items-center justify-center text-white text-2xl font-bold shadow-xl flex-shrink-0">
              {venture.logo_url ? (
                <img src={venture.logo_url} alt={venture.name} className="w-full h-full object-cover" />
              ) : (
                venture.name?.charAt(0) || 'V'
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md border font-semibold ${
                isAccepted ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' :
                isHeld ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
                isRejected ? 'bg-red-500/15 border-red-500/30 text-red-300' :
                is_expired ? 'bg-zinc-800 border-zinc-700 text-zinc-500' :
                'bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}>
                {is_expired ? 'Expired' : invitation.status}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mb-1">Venture Team Invitation</p>
            <h1 className="text-[24px] font-bold text-white tracking-tight">{venture.name}</h1>
            {venture.tagline && <p className="text-[13.5px] text-zinc-400 mt-1">{venture.tagline}</p>}
          </div>

          {/* Inviter Info */}
          <div className="flex items-center gap-3 p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl mb-6">
            {inviter.avatar_url ? (
              <img src={inviter.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-300">
                {inviter.full_name?.charAt(0) || 'I'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{inviter.full_name || 'Founder'}</p>
              <p className="text-[11.5px] text-zinc-500 truncate">@{inviter.username || 'inviter'} invited you to join the team</p>
            </div>
          </div>

          {/* Offer Overview */}
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10.5px] font-mono uppercase text-zinc-500 font-semibold">Position Title</p>
                  <p className="text-[14px] font-bold text-white mt-0.5">{invitation.proposed_role_title}</p>
                </div>
                <div>
                  <p className="text-[10.5px] font-mono uppercase text-zinc-500 font-semibold">Team / Department</p>
                  <p className="text-[14px] font-bold text-white mt-0.5">{invitation.proposed_team || 'Core Team'}</p>
                </div>
              </div>

              {invitation.responsibilities?.length > 0 && (
                <div className="pt-3 border-t border-zinc-800/60">
                  <p className="text-[10.5px] font-mono uppercase text-zinc-500 font-semibold mb-2">Key Responsibilities</p>
                  <ul className="space-y-1 text-[12.5px] text-zinc-300">
                    {invitation.responsibilities.map((r: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-zinc-600 mt-1">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {invitation.personal_message && (
              <div className="p-4 bg-zinc-900/20 border border-zinc-800/40 rounded-xl">
                <p className="text-[10.5px] font-mono uppercase text-zinc-500 font-semibold mb-1 flex items-center gap-1.5">
                  <ChatText size={12} /> Personal Message
                </p>
                <p className="text-[13px] text-zinc-300 italic leading-relaxed">&ldquo;{invitation.personal_message}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Action Modes */}
          {mode === 'review' && (
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row gap-2">
              {!isAccepted && !isRejected && !is_expired ? (
                <>
                  <button
                    onClick={handleAccept}
                    disabled={actionBusy}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-white text-black text-[13px] font-bold hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                  >
                    {actionBusy ? <CircleNotch size={14} className="animate-spin" /> : <CheckCircle size={15} weight="fill" />}
                    Accept & Join Team
                  </button>
                  <button
                    onClick={() => setMode('hold_input')}
                    disabled={actionBusy}
                    className="h-10 px-4 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-[12.5px] font-semibold text-zinc-200 transition-colors"
                  >
                    Hold
                  </button>
                  <button
                    onClick={() => setMode('decline_input')}
                    disabled={actionBusy}
                    className="h-10 px-4 rounded-lg bg-zinc-800/50 border border-zinc-800 hover:bg-zinc-800 text-[12.5px] font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Decline
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push(`/ventures/${venture.slug}`)}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-white text-black text-[13px] font-bold hover:bg-zinc-100 transition-colors"
                >
                  View Venture Page <ArrowRight size={13} weight="bold" />
                </button>
              )}
            </div>
          )}

          {mode === 'hold_input' && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <p className="text-[12.5px] font-semibold text-white">Place Invitation on Hold</p>
              <textarea
                value={holdMsg}
                onChange={e => setHoldMsg(e.target.value)}
                rows={2}
                placeholder="Optional note to the founder (e.g. Need 2 days to review)..."
                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setMode('review')} className="h-8 px-3 text-[12px] text-zinc-400 hover:text-white">Cancel</button>
                <button onClick={handleHold} disabled={actionBusy} className="h-8 px-4 bg-amber-500 text-black font-bold text-[12px] rounded-md hover:bg-amber-400">
                  {actionBusy ? <CircleNotch size={12} className="animate-spin" /> : 'Confirm Hold'}
                </button>
              </div>
            </div>
          )}

          {mode === 'decline_input' && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <p className="text-[12.5px] font-semibold text-white">Decline Invitation</p>
              <textarea
                value={declineMsg}
                onChange={e => setDeclineMsg(e.target.value)}
                rows={2}
                placeholder="Optional reason for declining..."
                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setMode('review')} className="h-8 px-3 text-[12px] text-zinc-400 hover:text-white">Cancel</button>
                <button onClick={handleDecline} disabled={actionBusy} className="h-8 px-4 bg-red-500 text-white font-bold text-[12px] rounded-md hover:bg-red-400">
                  {actionBusy ? <CircleNotch size={12} className="animate-spin" /> : 'Confirm Decline'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}