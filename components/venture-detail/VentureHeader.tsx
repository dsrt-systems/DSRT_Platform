'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Heart, Share, DotsThree, X, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ConnectButton } from '@/components/shared/ConnectButton'

interface Props {
  venture: any
  founder: any
  isOwner: boolean
  isFollowing: boolean
  onFollowToggle: () => void
  onUpdate: (patch: any) => Promise<void>
  onMessage?: () => void
  onConnect?: () => void
  stats?: {
    team: number
    followers: number
    applications: number
    openRoles: number
  }
}

const STAGES = [
  { value: 'idea', label: 'Idea' },
  { value: 'mvp', label: 'MVP' },
  { value: 'beta', label: 'Beta' },
  { value: 'launched', label: 'Launched' },
  { value: 'scaling', label: 'Scaling' },
  { value: 'active', label: 'Active' },
]

export function VentureHeader({
  venture,
  founder,
  isOwner,
  isFollowing,
  onFollowToggle,
  onUpdate,
  stats,
}: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState<'cover' | 'logo' | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [editingTagline, setEditingTagline] = useState(false)
  const [editingStage, setEditingStage] = useState(false)
  const [nameDraft, setNameDraft] = useState(venture.name)
  const [taglineDraft, setTaglineDraft] = useState(venture.tagline || '')
  const [stageDraft, setStageDraft] = useState(venture.stage || 'idea')
  const [cropperFile, setCropperFile] = useState<{ file: File; kind: 'cover' | 'logo' } | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, kind: 'cover' | 'logo') => {
    const file = e.target.files?.[0]
    if (file) setCropperFile({ file, kind })
    e.target.value = ''
  }

  const uploadCropped = async (blob: Blob, kind: 'cover' | 'logo') => {
    setUploading(kind)
    try {
      const fd = new FormData()
      fd.append('file', blob, kind + '.jpg')
      fd.append('kind', kind)
      const res = await fetch('/api/ventures/' + venture.slug + '/media', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      const patchKey = kind === 'logo' ? 'logo_url' : 'cover_url'
      await onUpdate({ [patchKey]: json.url })
      toast.success((kind === 'logo' ? 'Logo' : 'Cover') + ' updated')
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploading(null)
      setCropperFile(null)
    }
  }

  const currentStage = STAGES.find(s => s.value === (venture.stage || 'idea'))?.label || 'Idea'

  const statParts: string[] = []
  const teamCount = stats?.team ?? 0
  const followerCount = venture.follower_count ?? 0
  const applicationCount = stats?.applications ?? 0
  const openRoleCount = stats?.openRoles ?? 0

  if (teamCount > 0) statParts.push(teamCount + ' team')
  statParts.push(followerCount + ' follower' + (followerCount !== 1 ? 's' : ''))
  if (openRoleCount > 0) statParts.push(openRoleCount + ' open role' + (openRoleCount !== 1 ? 's' : ''))
  if (applicationCount > 0) statParts.push(applicationCount + ' application' + (applicationCount !== 1 ? 's' : ''))
  const compactStatLine = statParts.join(' · ')

  return (
    <>
      <button
        onClick={() => router.push('/ventures')}
        className="flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white mb-3 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      <div className="relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.06] mb-4">
        <div className="relative h-[320px] md:h-[360px] overflow-hidden">
          {venture.cover_url ? (
            <img src={venture.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

          {isOwner && (
            <>
              <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e, 'cover')} />
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading === 'cover'}
                className="absolute top-4 right-4 flex items-center gap-1.5 text-[12px] font-semibold text-white bg-black/60 backdrop-blur-md border border-white/20 hover:bg-black/80 px-3 h-8 rounded-lg transition-colors z-20"
              >
                <Camera size={13} weight="regular" />
                {uploading === 'cover' ? 'Uploading...' : 'Change cover'}
              </button>
            </>
          )}

          <div className="absolute inset-x-0 bottom-0 px-6 md:px-8 pb-6 md:pb-7 z-10">
            <div className="flex items-end gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-[96px] h-[96px] md:w-[112px] md:h-[112px] rounded-2xl border-[3px] border-black/40 bg-[#0f0f18] overflow-hidden shadow-2xl">
                  {venture.logo_url ? (
                    <img src={venture.logo_url} alt={venture.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white text-4xl font-bold">
                      {venture.name?.charAt(0)}
                    </div>
                  )}
                </div>
                {isOwner && (
                  <>
                    <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e, 'logo')} />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading === 'logo'}
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/80 backdrop-blur-md border border-white/25 hover:bg-black flex items-center justify-center transition-colors"
                      title="Change logo"
                    >
                      <Camera size={13} weight="regular" className="text-white" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {editingName && isOwner ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        className="bg-white/[0.1] border border-white/[0.3] rounded px-3 py-1 text-[30px] md:text-[36px] font-bold text-white focus:outline-none focus:border-white/[0.5] min-w-[240px]"
                      />
                      <button
                        onClick={async () => {
                          if (nameDraft.trim()) { await onUpdate({ name: nameDraft.trim() }); setEditingName(false) }
                        }}
                        className="w-8 h-8 rounded bg-white text-black hover:bg-white/90 flex items-center justify-center"
                      >
                        <Check size={14} weight="bold" />
                      </button>
                      <button
                        onClick={() => { setNameDraft(venture.name); setEditingName(false) }}
                        className="w-8 h-8 rounded text-white/70 hover:text-white flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <h1
                      onClick={() => isOwner && setEditingName(true)}
                      className={
                        'text-[30px] md:text-[36px] font-bold text-white leading-none tracking-tight ' +
                        (isOwner ? 'cursor-pointer hover:opacity-80 transition-opacity' : '')
                      }
                      style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}
                    >
                      {venture.name}
                    </h1>
                  )}

                  {editingStage && isOwner ? (
                    <select
                      autoFocus
                      value={stageDraft}
                      onChange={async (e) => {
                        setStageDraft(e.target.value)
                        await onUpdate({ stage: e.target.value })
                        setEditingStage(false)
                      }}
                      onBlur={() => setEditingStage(false)}
                      className="bg-white/[0.15] border border-white/[0.3] text-white text-[11px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1.5 outline-none"
                    >
                      {STAGES.map(s => <option key={s.value} value={s.value} className="bg-[#12121a]">{s.label}</option>)}
                    </select>
                  ) : (
                    <button
                      onClick={() => isOwner && setEditingStage(true)}
                      className={
                        'inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md bg-white/[0.15] backdrop-blur-md border border-white/[0.2] text-white ' +
                        (isOwner ? 'hover:bg-white/[0.25] cursor-pointer' : '')
                      }
                    >
                      {currentStage}
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  {editingTagline && isOwner ? (
                    <div className="flex items-center gap-1.5 max-w-2xl">
                      <input
                        autoFocus
                        value={taglineDraft}
                        onChange={(e) => setTaglineDraft(e.target.value)}
                        maxLength={140}
                        placeholder="Add a one-line company thesis..."
                        className="flex-1 bg-white/[0.1] border border-white/[0.3] rounded px-3 py-1.5 text-[15px] text-white placeholder:text-white/40 focus:outline-none focus:border-white/[0.5]"
                      />
                      <button
                        onClick={async () => { await onUpdate({ tagline: taglineDraft }); setEditingTagline(false) }}
                        className="w-7 h-7 rounded bg-white text-black flex items-center justify-center hover:bg-white/90"
                      >
                        <Check size={13} weight="bold" />
                      </button>
                      <button
                        onClick={() => { setTaglineDraft(venture.tagline || ''); setEditingTagline(false) }}
                        className="w-7 h-7 rounded text-white/70 hover:text-white flex items-center justify-center"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <p
                      onClick={() => isOwner && setEditingTagline(true)}
                      className={
                        'text-[15px] md:text-[16px] leading-relaxed max-w-2xl ' +
                        (venture.tagline
                          ? 'text-white/90 ' + (isOwner ? 'cursor-pointer hover:text-white' : '')
                          : 'text-white/50 italic ' + (isOwner ? 'cursor-pointer hover:text-white/70' : ''))
                      }
                      style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
                    >
                      {venture.tagline || (isOwner ? 'Click to add a one-line company thesis...' : '')}
                    </p>
                  )}
                </div>

                <div
                  className="flex items-center gap-2 text-[11.5px] md:text-[12px] text-white/70 flex-wrap"
                  style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
                >
                  {venture.venture_number && (
                    <>
                      <span className="font-mono text-white/60">{venture.venture_number}</span>
                      <span className="text-white/30">·</span>
                    </>
                  )}
                  <span className="font-medium">{compactStatLine}</span>
                  {venture.industry && (
                    <>
                      <span className="text-white/30">·</span>
                      <span>{venture.industry}</span>
                    </>
                  )}
                  {venture.headquarters && (
                    <>
                      <span className="text-white/30">·</span>
                      <span>{venture.headquarters}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Desktop action buttons */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0 self-end mb-1">
                {!isOwner && (
                  <>
                    {/* DSRT Mail ConnectButton replaces legacy message/connect buttons */}
                    <ConnectButton
                      entityType="venture"
                      entityId={venture.id}
                      entityName={venture.name}
                      entitySlug={venture.slug}
                      sourceType="venture_invite"
                      variant="primary"
                      label="Contact Team"
                      icon={true}
                    />
                    <button
                      onClick={onFollowToggle}
                      className={
                        'flex items-center gap-1.5 text-[12.5px] font-semibold px-4 h-9 rounded-lg transition-colors ' +
                        (isFollowing
                          ? 'bg-white/[0.1] backdrop-blur-md border border-white/[0.2] text-white hover:bg-white/[0.15]'
                          : 'bg-white text-black hover:bg-white/90')
                      }
                    >
                      <Heart size={13} weight={isFollowing ? 'fill' : 'regular'} />
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied') }}
                  className="w-9 h-9 rounded-lg bg-white/[0.1] backdrop-blur-md border border-white/[0.2] hover:bg-white/[0.15] text-white flex items-center justify-center transition-colors"
                >
                  <Share size={13} />
                </button>
                <button className="w-9 h-9 rounded-lg bg-white/[0.1] backdrop-blur-md border border-white/[0.2] hover:bg-white/[0.15] text-white flex items-center justify-center transition-colors">
                  <DotsThree size={15} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile action bar */}
        {!isOwner && (
          <div className="md:hidden px-4 py-3 border-t border-white/[0.06] grid grid-cols-2 gap-2">
            <ConnectButton
              entityType="venture"
              entityId={venture.id}
              entityName={venture.name}
              entitySlug={venture.slug}
              sourceType="venture_invite"
              variant="primary"
              label="Contact Team"
              icon={true}
            />
            <button
              onClick={onFollowToggle}
              className={
                'text-[11.5px] font-semibold px-4 h-9 rounded-lg transition-colors ' +
                (isFollowing ? 'bg-white/[0.05] border border-white/[0.08] text-white' : 'bg-white text-black')
              }
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}