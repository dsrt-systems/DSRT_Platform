'use client'

import { useState } from 'react'
import { Gear, Globe, Eye, EyeSlash, ChatCircle, Briefcase, Sparkle, Warning, Trash, Archive } from '@phosphor-icons/react'

interface Props {
  slug: string
  project: any
  onUpdate: (patch: Record<string, any>) => Promise<void>
  onArchive: () => Promise<void>
}

const MSG_PERMS = [
  { id: 'anyone', label: 'Anyone', desc: 'Any signed-in DSRT user can send messages' },
  { id: 'followers', label: 'Followers only', desc: 'Only people following this project' },
  { id: 'builders', label: 'Builders only', desc: 'Users with verified builder status' },
  { id: 'team', label: 'Team only', desc: 'Only project team members' },
]

const APP_PERMS = [
  { id: 'anyone', label: 'Anyone', desc: 'Anyone can apply to open roles' },
  { id: 'verified', label: 'Verified users only', desc: 'Only DSRT-verified users' },
  { id: 'requirements', label: 'Specific requirements', desc: 'Only users matching role requirements' },
]

export function ProjectSettings({ slug, project, onUpdate, onArchive }: Props) {
  const [saving, setSaving] = useState(false)

  const patch = async (fields: Record<string, any>) => {
    setSaving(true)
    try { await onUpdate(fields) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">

      {/* Visibility */}
      <SettingCard title="Visibility" description="Control who can discover and view this project">
        <RadioGroup
          value={project.is_public ? 'public' : (project.visibility === 'unlisted' ? 'unlisted' : 'private')}
          onChange={(v) => {
            patch({
              visibility: v,
              is_public: v === 'public',
              show_in_explore: v === 'public' && project.show_in_explore,
            })
          }}
          options={[
            { id: 'public', label: 'Public', desc: 'Anyone on DSRT can discover this project', icon: Globe },
            { id: 'unlisted', label: 'Unlisted', desc: 'Only people with the link can view', icon: Eye },
            { id: 'private', label: 'Private', desc: 'Only team members can view', icon: EyeSlash },
          ]}
        />

        {project.is_public && (
          <ToggleRow
            className="mt-4"
            label="Show in Explore Projects"
            desc="Include this project in DSRT's recommendation feed"
            checked={project.show_in_explore ?? true}
            onChange={(v) => patch({ show_in_explore: v })}
          />
        )}
      </SettingCard>

      {/* Communication */}
      <SettingCard title="Communication" description="Who can contact this project">
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
            <ChatCircle size={12} /> Messaging
          </p>
          <RadioGroup
            value={project.messaging_permission || 'anyone'}
            onChange={(v) => patch({ messaging_permission: v })}
            options={MSG_PERMS.map(p => ({ id: p.id, label: p.label, desc: p.desc }))}
          />
        </div>

        <div className="space-y-2 mt-6">
          <p className="text-[12px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase size={12} /> Applications
          </p>
          <RadioGroup
            value={project.application_permission || 'anyone'}
            onChange={(v) => patch({ application_permission: v })}
            options={APP_PERMS.map(p => ({ id: p.id, label: p.label, desc: p.desc }))}
          />
        </div>
      </SettingCard>

      {/* DSRT integrations */}
      <SettingCard title="DSRT Recommendations" description="How DSRT surfaces this project">
        <ToggleRow
          label="Appear in recommendations"
          desc="Allow the DSRT algorithm to recommend this project to matching users"
          checked={project.allow_recommendations ?? true}
          onChange={(v) => patch({ allow_recommendations: v })}
        />
        <ToggleRow
          className="mt-3"
          label="Recommend builders to this project"
          desc="Let DSRT suggest potential builders and collaborators"
          checked={project.allow_builder_matching ?? true}
          onChange={(v) => patch({ allow_builder_matching: v })}
        />
      </SettingCard>

      {/* Danger zone */}
      <div className="bg-red-500/[0.05] border border-red-500/25 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-red-500/20">
          <div className="flex items-center gap-2">
            <Warning size={16} weight="fill" className="text-red-400" />
            <h3 className="text-[16px] font-semibold text-red-300">Danger zone</h3>
          </div>
          <p className="text-[13px] text-red-200/70 mt-1">Irreversible actions. Proceed with caution.</p>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-white">Archive project</p>
              <p className="text-[13px] text-white/55">
                Removes the project from public visibility. You can restore it later.
              </p>
            </div>
            <button
              onClick={async () => {
                if (confirm('Archive this project? It will no longer be visible publicly.')) {
                  await onArchive()
                }
              }}
              className="flex items-center gap-1.5 text-[13px] font-semibold bg-white/[0.06] border border-white/[0.15] text-white hover:bg-white/[0.1] px-4 h-9 rounded-md"
            >
              <Archive size={13} /> Archive
            </button>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-white">Delete project permanently</p>
              <p className="text-[13px] text-white/55">
                Permanently deletes the project, all updates, reviews, and related data.
              </p>
            </div>
            <button
              onClick={() => {
                const c = prompt('Type "' + project.name + '" to confirm permanent deletion:')
                if (c === project.name) {
                  onArchive() // TODO: implement hard delete API
                  alert('Project marked for deletion.')
                } else if (c !== null) {
                  alert('Name did not match. Deletion cancelled.')
                }
              }}
              className="flex items-center gap-1.5 text-[13px] font-semibold bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 px-4 h-9 rounded-md"
            >
              <Trash size={13} /> Delete
            </button>
          </div>
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-6 right-6 bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-lg px-4 py-2 text-[13px] text-white flex items-center gap-2 shadow-2xl z-50">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Saving...
        </div>
      )}
    </div>
  )
}

function SettingCard({ title, description, children }: {
  title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <h3 className="text-[16px] font-semibold text-white">{title}</h3>
        <p className="text-[13px] text-white/55 mt-0.5">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function RadioGroup({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string; desc: string; icon?: any }[]
}) {
  return (
    <div className="space-y-2">
      {options.map(o => {
        const active = value === o.id
        const Icon = o.icon
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={
              'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ' +
              (active
                ? 'bg-white/[0.05] border-white/[0.2]'
                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]')
            }
          >
            <div className={
              'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ' +
              (active ? 'border-white bg-white' : 'border-white/25')
            }>
              {active && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
            </div>
            {Icon && <Icon size={16} className={active ? 'text-white' : 'text-white/50'} />}
            <div className="min-w-0">
              <p className={'text-[14px] font-semibold ' + (active ? 'text-white' : 'text-white/80')}>{o.label}</p>
              <p className="text-[12px] text-white/50 mt-0.5">{o.desc}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange, className = '' }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; className?: string
}) {
  return (
    <div className={'flex items-start justify-between gap-4 ' + className}>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-white">{label}</p>
        <p className="text-[12px] text-white/50 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={
          'w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ' +
          (checked ? 'bg-white' : 'bg-white/[0.15]')
        }
      >
        <div className={
          'absolute top-0.5 w-5 h-5 rounded-full transition-transform ' +
          (checked ? 'left-4 bg-black' : 'left-0.5 bg-white')
        } />
      </button>
    </div>
  )
}
