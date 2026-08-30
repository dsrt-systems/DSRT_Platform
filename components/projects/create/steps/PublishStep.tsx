'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, Circle, Globe, Eye, EyeSlash,
  Rocket, Copy, ArrowRight, Wrench, Check, EnvelopeSimple, QrCode
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useProjectCreationStore } from '@/stores/projectCreationStore'
import { QRCodeSVG } from '../QRCodeSVG'

export function PublishStep() {
  const router = useRouter()
  const { data, updateData, isSaving, setSaving, reset } = useProjectCreationStore()
  const [publishedResult, setPublishedResult] = useState<{
    slug: string
    projectNumber: string
    dsrtEmail: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handlePublish = async () => {
    if (!data.id) {
      toast.error('Project draft ID missing. Please go back and ensure draft is saved.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/projects/draft/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error)

      toast.success('Project published successfully!')
      setPublishedResult({
        slug: json.slug,
        projectNumber: json.project_number || 'PRJ-' + Math.floor(100000 + Math.random() * 900000),
        dsrtEmail: `${json.slug}@dsrt.connect`,
      })
    } catch (e: any) {
      toast.error(e.message || 'Failed to publish project')
    } finally {
      setSaving(false)
    }
  }

  const projectUrl = publishedResult ? `${window.location.origin}/projects/${publishedResult.slug}` : ''

  const handleCopyLink = () => {
    navigator.clipboard.writeText(projectUrl)
    setCopied(true)
    toast.success('Link copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const finishAndExit = (path: string) => {
    reset()
    router.push(path)
  }

  // ─── POST-PUBLISH LAUNCH SCREEN ───
  if (publishedResult) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-500 max-w-xl mx-auto pt-2 pb-16">
        <div className="bg-[#121215] border border-emerald-500/30 rounded-2xl p-8 text-center shadow-[0_0_50px_-15px_rgba(16,185,129,0.2)] relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle size={32} weight="fill" className="text-emerald-400" />
          </div>

          <div>
            <h2 className="text-[22px] font-bold text-white">Project Published!</h2>
            <p className="text-[13.5px] text-zinc-400 mt-1 max-w-md mx-auto">
              <strong className="text-white">{data.name}</strong> is live on DSRT Connect.
            </p>
          </div>

          {/* Canonical ID & Email */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-[#09090b] border border-white/[0.08] p-3 rounded-xl">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Project ID</p>
              <p className="text-[13px] font-mono font-bold text-emerald-400 mt-0.5">{publishedResult.projectNumber}</p>
            </div>
            <div className="bg-[#09090b] border border-white/[0.08] p-3 rounded-xl">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">DSRT Mail</p>
              <p className="text-[12px] font-mono font-semibold text-zinc-300 truncate mt-0.5 flex items-center gap-1">
                <EnvelopeSimple size={12} /> {publishedResult.dsrtEmail}
              </p>
            </div>
          </div>

          {/* QR Code & Link Sharing */}
          <div className="bg-[#09090b] border border-white/[0.08] p-4 rounded-xl flex items-center gap-5 text-left">
            <QRCodeSVG value={projectUrl} size={110} />
            <div className="space-y-2 flex-1 min-w-0">
              <p className="text-[12px] font-bold text-white">Share Project</p>
              <p className="text-[11px] text-zinc-500 leading-snug">Scan or copy to invite collaborators and share on social media.</p>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white text-[12px] font-semibold transition-colors"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-left space-y-2 pt-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-3 pl-1">Next steps in workspace</p>

            <button onClick={() => finishAndExit(`/projects/${publishedResult.slug}?tab=overview`)} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
              <div>
                <p className="text-[13.5px] font-bold text-white group-hover:text-blue-300 transition-colors">Add Project Knowledge</p>
                <p className="text-[11.5px] text-zinc-500">Upload documentation, research, or architecture notes.</p>
              </div>
              <ArrowRight size={14} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
            </button>

            <button onClick={() => finishAndExit(`/projects/${publishedResult.slug}`)} className="w-full flex items-center justify-center p-3 rounded-xl text-[12.5px] font-semibold text-zinc-400 hover:text-white transition-colors">
              Go to Project Workspace
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── PRE-PUBLISH CHECKLIST ───
  const checks = [
    { label: 'Project Identity', desc: 'Name, type and tagline', complete: !!data.name && !!data.tagline },
    { label: 'Description', desc: 'About this project', complete: !!data.description && data.description.length > 20 },
    { label: 'Domains', desc: 'Technical classification', complete: (data.domains || []).length > 0 },
    { label: 'Stage', desc: 'Current development phase', complete: !!data.stage },
    { label: 'Cover Image', desc: 'Visual presentation', complete: !!data.cover_image_url, optional: true },
    { label: 'Repository', desc: 'Source code link', complete: !!data.repository_url, optional: true },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Card Preview */}
      <div className="space-y-3">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block">
          Card Preview
        </label>
        <div className="w-full max-w-[340px] bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg pointer-events-none">
          <div className="relative w-full aspect-[16/9] bg-[#09090b] border-b border-white/[0.04]">
            {data.cover_image_url ? (
              <img src={data.cover_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900"><Wrench size={32} className="text-zinc-700" /></div>
            )}
            <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-[#09090b] border border-white/[0.1] shadow-lg overflow-hidden">
              {data.logo_url ? (
                <img src={data.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">{(data.name || '?')[0]?.toUpperCase()}</div>
              )}
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-[15px] font-bold text-white truncate">{data.name || 'Untitled Project'}</h3>
            <p className="text-[12.5px] text-zinc-400 truncate mt-0.5">{data.tagline || 'Project tagline...'}</p>
            <div className="flex items-center gap-2 mt-3 text-[11px] text-zinc-500 font-medium">
              {data.primary_domain && <span>{data.primary_domain}</span>}
              {data.primary_domain && data.stage && <span className="w-1 h-1 rounded-full bg-zinc-700" />}
              {data.stage && <span className="capitalize">{data.stage}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Completeness Checklist */}
      <div className="pt-6 border-t border-white/[0.06] space-y-4">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block">
          Completeness Checklist
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checks.map((check, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${check.complete ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-white/[0.02] border-white/[0.05]'}`}>
              {check.complete ? (
                <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <Circle size={16} className="text-zinc-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-[13px] font-semibold ${check.complete ? 'text-emerald-100' : 'text-zinc-300'}`}>
                  {check.label}
                  {check.optional && <span className="ml-2 text-[9px] font-mono uppercase tracking-widest text-zinc-500">Optional</span>}
                </p>
                <p className="text-[11.5px] text-zinc-500 mt-0.5">{check.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="pt-6 border-t border-white/[0.06] space-y-4">
        <label className="text-[12px] font-semibold text-white/60 uppercase tracking-wider block mb-2">
          Visibility & Discovery
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { id: 'public', label: 'Public', desc: 'Visible to everyone on DSRT', icon: Globe },
            { id: 'unlisted', label: 'Unlisted', desc: 'Anyone with link can view', icon: Eye },
            { id: 'private', label: 'Private', desc: 'Only team members', icon: EyeSlash },
          ].map(opt => {
            const active = data.visibility === opt.id
            const Icon = opt.icon
            return (
              <div
                key={opt.id}
                onClick={() => updateData({ visibility: opt.id as any })}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  active ? 'bg-white/[0.06] border-white/[0.25]' : 'bg-[#09090b] border-white/[0.08] hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className={active ? 'text-white' : 'text-zinc-500'} />
                  <p className={`text-[13px] font-bold ${active ? 'text-white' : 'text-zinc-300'}`}>{opt.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {data.visibility === 'public' && (
          <div className="space-y-3 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={data.show_in_explore}
                onChange={e => updateData({ show_in_explore: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded bg-zinc-900 border-zinc-700 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <div>
                <p className="text-[13.5px] font-semibold text-white group-hover:text-blue-300 transition-colors">Include in DSRT Explore</p>
                <p className="text-[12px] text-zinc-500 mt-0.5 leading-snug">Let the engine recommend this project based on domain and tech stack.</p>
              </div>
            </label>
          </div>
        )}
      </div>

      <div className="hidden">
        <button id="hidden-publish-trigger" onClick={handlePublish} />
      </div>
    </div>
  )
}