'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, Heart, ChatCircle, UsersThree, ArrowLeft,
  PencilSimple, Camera, Certificate, Buildings, Trophy, Check,
  ShareNetwork
} from '@phosphor-icons/react'
import { ImageCropperModal } from './ImageCropperModal'
import { ConnectButton } from '@/components/shared/ConnectButton'

interface Project {
  id: string
  slug: string
  name: string
  short_description: string | null
  tagline: string | null
  logo_url: string | null
  cover_image_url: string | null
  icon: string | null
  color: string | null
  stage: string
  project_number: string
  global_rank: number | null
  category_rank: number | null
  industry: string | null
  category: string[]
  tech_stack: string[]
  founder_verified: boolean
  is_dsrt_verified: boolean
  is_open_source: boolean
  community_verified: boolean
  won_competition: boolean
  project_type: string
  follower_count: number
  founder_id: string | null
  user_id: string | null
  founded_date: string | null
}

interface Props {
  project: Project
  isOwner: boolean
  isFollowing: boolean
  onFollowToggle: () => Promise<void>
  onCollaborate: () => void
  onUpdate: (patch: Partial<Project>) => Promise<void>
  onUploadMedia: (file: File, kind: 'logo' | 'cover') => Promise<string | null>
}

const STAGES = ['idea','research','planning','prototype','mvp','beta','production','scaling','completed','on-hold']
const STAGE_LABELS: Record<string, string> = {
  idea:'Idea', research:'Research', planning:'Planning', prototype:'Prototype',
  mvp:'MVP', beta:'Beta', production:'Production', scaling:'Scaling',
  completed:'Completed', 'on-hold':'On Hold'
}

function formatFoundedDate(d: string | null): string {
  if (!d) return ''
  return 'Started ' + new Date(d).toLocaleDateString('en', { month: 'short', year: 'numeric' })
}

export function ProjectHeader({
  project, isOwner, isFollowing,
  onFollowToggle, onCollaborate,
  onUpdate, onUploadMedia
}: Props) {
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [followLoading, setFollowLoading] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [editingStage, setEditingStage] = useState(false)
  const [tempName, setTempName] = useState(project.name)
  const [tempDesc, setTempDesc] = useState(project.short_description || project.tagline || '')

  const [cropperSrc, setCropperSrc] = useState<string | null>(null)
  const [cropperKind, setCropperKind] = useState<'logo' | 'cover' | null>(null)
  const [cropperAspect, setCropperAspect] = useState<number>(1)

  const handleFollow = async () => {
    setFollowLoading(true)
    try { await onFollowToggle() } finally { setFollowLoading(false) }
  }

  const handleFileSelect = (kind: 'logo' | 'cover', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropperSrc(reader.result as string)
      setCropperKind(kind)
      setCropperAspect(kind === 'logo' ? 1 : 4)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropConfirm = async (blob: Blob) => {
    if (!cropperKind) return
    const filename = cropperKind + '.jpg'
    const file = new File([blob], filename, { type: 'image/jpeg' })
    const url = await onUploadMedia(file, cropperKind)
    if (url) {
      await onUpdate(cropperKind === 'logo' ? { logo_url: url } : { cover_image_url: url })
    }
    setCropperSrc(null)
    setCropperKind(null)
  }

  const saveName = async () => {
    const v = tempName.trim()
    if (v && v !== project.name) await onUpdate({ name: v })
    setEditingName(false)
  }

  const saveDesc = async () => {
    const v = tempDesc.trim()
    if (v !== (project.short_description || '')) await onUpdate({ short_description: v })
    setEditingDesc(false)
  }

  const rankLine: string[] = []
  if (project.global_rank) rankLine.push('#' + project.global_rank + ' Global')
  if (project.category_rank && project.industry) rankLine.push('#' + project.category_rank + ' in ' + project.industry)

  return (
    <>
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08] mb-5">
        <div className="relative w-full h-[180px] md:h-[220px] overflow-hidden bg-gradient-to-br from-[#1a1030] via-[#0f0a1f] to-[#0a0420] group/cover">
          {project.cover_image_url ? (
            <img src={project.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_80%_50%,rgba(59,130,246,0.18),transparent_60%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {isOwner && (
            <>
              <button
                onClick={() => coverInputRef.current?.click()}
                className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md border border-white/15 hover:bg-black/80 text-white text-[12px] font-medium px-3 h-8 rounded-lg flex items-center gap-1.5 opacity-0 group-hover/cover:opacity-100 transition-opacity"
              >
                <Camera size={13} /> Change cover
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect('cover', e)} />
            </>
          )}
        </div>

        <div className="px-6 md:px-8 pb-6 pt-4 -mt-16 md:-mt-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <div className="relative flex-shrink-0 group/logo">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-[#12121a] border-2 border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
                {project.logo_url ? (
                  <img src={project.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl md:text-5xl font-bold text-white/90">{(project.name || '?').charAt(0).toUpperCase()}</span>
                )}
              </div>
              {isOwner && (
                <>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-[#12121a] border-2 border-white/15 text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                    aria-label="Change logo"
                  >
                    <Camera size={13} weight="bold" />
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect('logo', e)} />
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {editingName ? (
                  <input
                    autoFocus
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setTempName(project.name); setEditingName(false) } }}
                    className="text-[28px] md:text-[32px] font-bold text-white bg-white/[0.06] border border-white/20 rounded-lg px-2 py-0.5 outline-none focus:border-white/40 min-w-[240px]"
                    style={{ letterSpacing: '-0.02em' }}
                    maxLength={120}
                  />
                ) : (
                  <h1
                    className={'text-[28px] md:text-[32px] font-bold text-white leading-tight ' + (isOwner ? 'cursor-pointer hover:bg-white/[0.04] rounded px-1.5 -mx-1.5 group/edit' : '')}
                    style={{ letterSpacing: '-0.02em' }}
                    onClick={() => isOwner && setEditingName(true)}
                  >
                    {project.name}
                    {isOwner && <PencilSimple size={13} className="inline ml-2 mb-1 opacity-0 group-hover/edit:opacity-40" />}
                  </h1>
                )}

                {editingStage ? (
                  <select
                    autoFocus
                    value={project.stage}
                    onChange={async (e) => { await onUpdate({ stage: e.target.value }); setEditingStage(false) }}
                    onBlur={() => setEditingStage(false)}
                    className="text-[11px] font-semibold text-white/90 bg-white/[0.06] border border-white/15 rounded-md px-2 py-1 outline-none uppercase tracking-wider"
                  >
                    {STAGES.map(s => <option key={s} value={s} className="bg-[#12121a] normal-case">{STAGE_LABELS[s]}</option>)}
                  </select>
                ) : (
                  <span
                    className={'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold text-white/85 bg-white/[0.08] border border-white/15 uppercase tracking-wider ' + (isOwner ? 'cursor-pointer hover:bg-white/[0.12]' : '')}
                    onClick={() => isOwner && setEditingStage(true)}
                  >
                    {STAGE_LABELS[project.stage] || project.stage}
                  </span>
                )}
              </div>

              {editingDesc ? (
                <input
                  autoFocus
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  onBlur={saveDesc}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveDesc(); if (e.key === 'Escape') { setTempDesc(project.short_description || ''); setEditingDesc(false) } }}
                  placeholder="One line describing what this project does..."
                  className="text-[15px] text-white/80 bg-white/[0.06] border border-white/20 rounded-md px-2 py-1 outline-none focus:border-white/40 w-full max-w-2xl mb-3"
                  maxLength={200}
                />
              ) : (
                <p
                  className={'text-[15px] text-white/80 leading-snug mb-3 max-w-2xl ' + (isOwner && !project.short_description && !project.tagline ? 'italic text-white/40' : '') + (isOwner ? ' cursor-pointer hover:bg-white/[0.04] rounded px-1.5 -mx-1.5 inline-block' : '')}
                  onClick={() => isOwner && setEditingDesc(true)}
                >
                  {project.short_description || project.tagline || (isOwner ? 'Click to add a short description...' : 'No description')}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-white/50 mb-3">
                <span className="font-mono text-white/40">{project.project_number}</span>
                <span className="text-white/25">·</span>
                <span className="flex items-center gap-1">
                  <Heart size={12} weight="fill" className="text-white/40" />
                  {project.follower_count.toLocaleString()} follower{project.follower_count !== 1 ? 's' : ''}
                </span>
                {project.founded_date && (
                  <>
                    <span className="text-white/25">·</span>
                    <span>{formatFoundedDate(project.founded_date)}</span>
                  </>
                )}
                {rankLine.length > 0 && (
                  <>
                    <span className="text-white/25">·</span>
                    <span className="inline-flex items-center gap-1 text-yellow-300/90">
                      <Trophy size={12} weight="fill" /> {rankLine.join(' · ')}
                    </span>
                  </>
                )}
              </div>

              {(project.industry || (project.tech_stack || []).length > 0) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.industry && (
                    <span className="text-[12px] font-medium text-white/85 bg-white/[0.06] border border-white/[0.12] px-2.5 py-1 rounded-md">
                      {project.industry}
                    </span>
                  )}
                  {(project.tech_stack || []).slice(0, 4).map((t) => (
                    <span key={t} className="text-[12px] text-white/70 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {project.founder_verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-300 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded">
                    <Check size={10} weight="bold" /> Verified Founder
                  </span>
                )}
                {project.is_dsrt_verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded">
                    <Certificate size={10} weight="fill" /> DSRT Verified
                  </span>
                )}
                {project.community_verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded">
                    <Buildings size={10} weight="fill" /> Community Verified
                  </span>
                )}
                {project.is_open_source && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">
                    <CheckCircle size={10} weight="fill" /> Open Source
                  </span>
                )}
                {project.won_competition && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-yellow-300 bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded">
                    <Trophy size={10} weight="fill" /> Award Winner
                  </span>
                )}
              </div>
            </div>

            {!isOwner && (
              <div className="flex md:flex-col gap-2 w-full md:w-auto md:min-w-[140px] flex-shrink-0">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={
                    'flex-1 md:flex-none h-9 px-4 rounded-md font-semibold text-[13px] flex items-center justify-center gap-1.5 transition-all ' +
                    (isFollowing
                      ? 'bg-transparent border border-white/20 text-white hover:bg-white/[0.06]'
                      : 'bg-white text-black hover:bg-white/90 border border-white')
                  }
                >
                  {isFollowing ? (<><Check size={13} weight="bold" /> Following</>) : (<><Heart size={13} /> Follow</>)}
                </button>
                <button
                  onClick={onCollaborate}
                  className="flex-1 md:flex-none h-9 px-4 rounded-md font-semibold text-[13px] bg-white/[0.06] border border-white/[0.12] text-white hover:bg-white/[0.1] flex items-center justify-center gap-1.5"
                >
                  <UsersThree size={13} /> Collaborate
                </button>
                <ConnectButton
                  entityType="project"
                  entityId={project.id}
                  entityName={project.name}
                  entitySlug={project.slug || project.project_number}
                  sourceType="project_invite"
                  label="Message"
                  variant="outline"
                  icon={true}
                  className="flex-1 md:flex-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {cropperSrc && cropperKind && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          aspect={cropperAspect}
          cropShape="rect"
          onCancel={() => { setCropperSrc(null); setCropperKind(null) }}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  )
}