'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Heart, ChatCircle, Share, DotsThree, X, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Props {
  venture: any
  founder: any
  isOwner: boolean
  isFollowing: boolean
  onFollowToggle: () => void
  onUpdate: (patch: any) => Promise<void>
}

const STAGES = [
  { value: 'idea', label: 'Idea' },
  { value: 'mvp', label: 'MVP' },
  { value: 'beta', label: 'Beta' },
  { value: 'launched', label: 'Launched' },
  { value: 'scaling', label: 'Scaling' },
  { value: 'active', label: 'Active' },
]

export function VentureHeader({ venture, founder, isOwner, isFollowing, onFollowToggle, onUpdate }: Props) {
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

  return (
    <>
      <button onClick={() => router.push('/ventures')} className="flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white mb-3 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      {/* Cover banner with overlay content */}
      <div className="relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.06] mb-4">
        <div className="relative h-[320px] md:h-[360px] overflow-hidden">
          {venture.cover_url ? (
            <img src={venture.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
          )}

          {/* Strong gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

          {/* Change cover button */}
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

          {/* Info overlay - positioned lower in banner */}
          <div className="absolute inset-x-0 bottom-0 px-6 md:px-8 pb-6 md:pb-7 z-10">
            <div className="flex items-end gap-5">
              {/* Logo — large square */}
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

              {/* Right side */}
              <div className="flex-1 min-w-0 pb-1">
                {/* Name + stage row */}
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {editingName && isOwner ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        className="bg-white/[0.1] border border-white/[0.3] rounded px-3 py-1 text-[30px] md:text-[36px] font-bold text-white focus:outline-none focus:border-white/[0.5] min-w-[240px]"
                      />
                      <button onClick={async () => { if (nameDraft.trim()) { await onUpdate({ name: nameDraft.trim() }); setEditingName(false) } }} className="w-8 h-8 rounded bg-white text-black hover:bg-white/90 flex items-center justify-center">
                        <Check size={14} weight="bold" />
                      </button>
                      <button onClick={() => { setNameDraft(venture.name); setEditingName(false) }} className="w-8 h-8 rounded text-white/70 hover:text-white flex items-center justify-center">
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
                      onChange={async (e) => { setStageDraft(e.target.value); await onUpdate({ stage: e.target.value }); setEditingStage(false) }}
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

                {/* Tagline */}
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
                      <button onClick={async () => { await onUpdate({ tagline: taglineDraft }); setEditingTagline(false) }} className="w-7 h-7 rounded bg-white text-black flex items-center justify-center hover:bg-white/90">
                        <Check size={13} weight="bold" />
                      </button>
                      <button onClick={() => { setTaglineDraft(venture.tagline || ''); setEditingTagline(false) }} className="w-7 h-7 rounded text-white/70 hover:text-white flex items-center justify-center">
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

                {/* Meta line */}
                <div className="flex items-center gap-3 text-[12px] text-white/70 flex-wrap" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                  {venture.venture_number && (
                    <>
                      <span className="font-mono text-white/60">{venture.venture_number}</span>
                      <span className="text-white/30">·</span>
                    </>
                  )}
                  <span className="flex items-center gap-1"><Heart size={12} weight="regular" /> {venture.follower_count} followers</span>
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

              {/* Action buttons - top-right corner */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0 self-end mb-1">
                {!isOwner && (
                  <>
                    <button className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white bg-white/[0.1] backdrop-blur-md border border-white/[0.2] hover:bg-white/[0.15] px-3 h-9 rounded-lg transition-colors">
                      <ChatCircle size={13} weight="regular" /> Message
                    </button>
                    <button className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white bg-white/[0.1] backdrop-blur-md border border-white/[0.2] hover:bg-white/[0.15] px-3 h-9 rounded-lg transition-colors">
                      Connect
                    </button>
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
        <div className="md:hidden px-5 py-3 border-t border-white/[0.06] flex items-center gap-2">
          {!isOwner && (
            <>
              <button className="flex-1 text-[12px] font-semibold text-white bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] h-9 rounded-lg">Message</button>
              <button
                onClick={onFollowToggle}
                className={
                  'flex-1 text-[12px] font-semibold px-4 h-9 rounded-lg transition-colors ' +
                  (isFollowing ? 'bg-white/[0.05] border border-white/[0.08] text-white' : 'bg-white text-black')
                }
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </>
          )}
        </div>
      </div>

      {cropperFile && (
        <ImageCropperModal
          file={cropperFile.file}
          kind={cropperFile.kind}
          aspect={cropperFile.kind === 'cover' ? 3.2 : 1}
          onCancel={() => setCropperFile(null)}
          onCropped={(blob) => uploadCropped(blob, cropperFile.kind)}
        />
      )}
    </>
  )
}

function ImageCropperModal({ file, kind, aspect, onCancel, onCropped }: {
  file: File
  kind: 'cover' | 'logo'
  aspect: number
  onCancel: () => void
  onCropped: (blob: Blob) => void
}) {
  const [imgUrl, setImgUrl] = useState<string>('')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const CROP_W = 800
  const CROP_H = Math.round(CROP_W / aspect)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const draw = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !img.complete) return
    const ctx = canvas.getContext('2d')!
    canvas.width = CROP_W
    canvas.height = CROP_H
    ctx.clearRect(0, 0, CROP_W, CROP_H)
    const scale = Math.max(CROP_W / img.naturalWidth, CROP_H / img.naturalHeight) * zoom
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    const x = (CROP_W - w) / 2 + offset.x
    const y = (CROP_H - h) / 2 + offset.y
    ctx.drawImage(img, x, y, w, h)
  }

  useEffect(draw, [zoom, offset, imgUrl])

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const handleMouseUp = () => setDragging(false)

  const finish = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) onCropped(blob)
    }, 'image/jpeg', 0.92)
  }

  const displayWidth = kind === 'cover' ? 560 : 320
  const displayHeight = displayWidth / aspect

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f18] border border-white/[0.1] rounded-2xl max-w-2xl w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-white">Adjust your {kind === 'cover' ? 'cover banner' : 'logo'}</h2>
            <p className="text-[11.5px] text-white/45 mt-0.5">Drag to reposition · Use slider to zoom</p>
          </div>
          <button onClick={onCancel} className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div
            className={'relative overflow-hidden border border-white/[0.15] bg-black ' + (kind === 'logo' ? 'rounded-2xl' : 'rounded-lg')}
            style={{ width: displayWidth, height: displayHeight, cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} width={CROP_W} height={CROP_H} style={{ width: '100%', height: '100%', display: 'block' }} />
            <img ref={imgRef} src={imgUrl} alt="" onLoad={draw} style={{ display: 'none' }} crossOrigin="anonymous" />
          </div>

          <div className="w-full max-w-md flex items-center gap-3">
            <span className="text-[11px] text-white/50">Zoom</span>
            <input
              type="range" min="1" max="3" step="0.05" value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-white"
            />
            <span className="text-[11px] text-white/60 font-mono w-10 text-right">{zoom.toFixed(2)}x</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-2">
          <button onClick={onCancel} className="text-[13px] font-semibold text-white/60 hover:text-white px-4 h-9">Cancel</button>
          <button onClick={finish} className="text-[13px] font-semibold text-black bg-white hover:bg-white/90 px-4 h-9 rounded-lg">
            Apply & Upload
          </button>
        </div>
      </div>
    </div>
  )
}