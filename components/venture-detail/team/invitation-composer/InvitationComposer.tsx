'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  X, MagnifyingGlass, CircleNotch, CaretLeft, CaretRight,
  PaperPlaneTilt, Check, Pencil, CheckCircle, WarningCircle,
  XCircle, Plus, Users, Briefcase
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface DSRTUser {
  id: string
  full_name: string
  username: string
  avatar_url?: string
  tagline?: string
  skills?: string[]
}

export interface InvitationDraft {
  invitedUser: DSRTUser | null
  eligibilityResult: any | null
  positionId: string | null
  positionMode: 'existing' | 'new' | null
  newPositionData: {
    title: string
    positionType: string
    team_name: string
    department: string
    capacity: number
  } | null
  responsibilities: string[]
  requiredSkills: string[]
  roleId: string | null
  permissionTemplate: string
  permissions: string[]
  personalMessage: string
  expirationDays: number
}

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  ventureName: string
  positions: any[]
  onSuccess?: () => void
  preselectedPosition?: any
  preselectedUser?: DSRTUser
  source?: 'graph' | 'directory' | 'position' | 'looking_for'
  applicationId?: string
}

const STEPS = [
  { id: 'user', label: 'Select User' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'position', label: 'Position' },
  { id: 'responsibilities', label: 'Responsibilities' },
  { id: 'permissions', label: 'Access' },
  { id: 'message', label: 'Message' },
  { id: 'review', label: 'Review' },
]

const INITIAL_DRAFT: InvitationDraft = {
  invitedUser: null,
  eligibilityResult: null,
  positionId: null,
  positionMode: null,
  newPositionData: null,
  responsibilities: [],
  requiredSkills: [],
  roleId: null,
  permissionTemplate: 'member',
  permissions: ['view_venture', 'view_team', 'publish_updates', 'manage_documents'],
  personalMessage: '',
  expirationDays: 7,
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function InvitationComposer({
  open, onClose, slug, ventureName, positions,
  onSuccess, preselectedPosition, preselectedUser, source, applicationId
}: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState<InvitationDraft>(INITIAL_DRAFT)

  const updateDraft = useCallback((patch: Partial<InvitationDraft>) => {
    setDraft(prev => ({ ...prev, ...patch }))
  }, [])

  // Reset when opened
  useEffect(() => {
    if (open) {
      setCurrentStep(0)
      setDraft({
        ...INITIAL_DRAFT,
        invitedUser: preselectedUser || null,
        positionId: preselectedPosition?.id || null,
        positionMode: preselectedPosition ? 'existing' : null,
        responsibilities: preselectedPosition?.responsibilities || [],
        requiredSkills: preselectedPosition?.required_skills || [],
      })
    }
  }, [open, preselectedUser, preselectedPosition])

  if (!open) return null

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!draft.invitedUser
      case 1: return !!draft.eligibilityResult?.eligible
      case 2:
        if (draft.positionMode === 'existing') return !!draft.positionId
        if (draft.positionMode === 'new') return !!draft.newPositionData?.title?.trim()
        return false
      case 3: return true
      case 4: return draft.permissions.length > 0
      case 5: return true
      case 6: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const handleSend = async () => {
    if (!draft.invitedUser) return
    setSending(true)

    try {
      // If new position, create it first
      let positionId = draft.positionId
      if (draft.positionMode === 'new' && draft.newPositionData) {
        const posRes = await fetch(`/api/ventures/${slug}/team/positions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: draft.newPositionData.title,
            position_type: draft.newPositionData.positionType,
            team_name: draft.newPositionData.team_name || null,
            department: draft.newPositionData.department || null,
            capacity: draft.newPositionData.capacity,
            responsibilities: draft.responsibilities,
            status: 'open'
          })
        })

        if (!posRes.ok) {
          const err = await posRes.json()
          throw new Error(err.error || 'Failed to create position')
        }
        const posData = await posRes.json()
        positionId = posData.position.id
      }

      // Create invitation
      const idempotencyKey = `inv-${draft.invitedUser.id}-${Date.now()}`
      const res = await fetch(`/api/ventures/${slug}/team/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          invited_user_id: draft.invitedUser.id,
          position_id: positionId,
          proposed_role_title: (draft.positionMode === 'new'
            ? draft.newPositionData?.title
            : positions.find(p => p.id === positionId)?.title) || 'Team Member',
          permissions_snapshot: draft.permissions,
          personal_message: draft.personalMessage.trim() || null,
          expiration_days: draft.expirationDays,
          source: source || 'direct_invitation',
          application_id: applicationId
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send invitation')

      toast.success(`Invitation sent to ${draft.invitedUser.full_name}`)
      onSuccess?.()
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Could not send invitation')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#121215] border border-white/[0.1] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        <ComposerHeader
          steps={STEPS}
          currentStep={currentStep}
          onClose={onClose}
          ventureName={ventureName}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 0 && (
            <Step1_SelectUser
              selectedUser={draft.invitedUser}
              onSelectUser={(u: DSRTUser | null) => updateDraft({ invitedUser: u, eligibilityResult: null })}
            />
          )}

          {currentStep === 1 && draft.invitedUser && (
            <Step2_Eligibility
              slug={slug}
              invitedUserId={draft.invitedUser.id}
              positionId={draft.positionId}
              onResult={(r: any) => updateDraft({ eligibilityResult: r })}
            />
          )}

          {currentStep === 2 && (
            <Step3_Position
              positions={positions}
              selectedPositionId={draft.positionId}
              positionMode={draft.positionMode}
              newPositionData={draft.newPositionData}
              onSelectExisting={(pid: string) => updateDraft({
                positionId: pid,
                positionMode: 'existing',
                newPositionData: null,
                responsibilities: positions.find(p => p.id === pid)?.responsibilities || []
              })}
              onSelectNew={(data: any) => updateDraft({
                positionMode: 'new',
                positionId: null,
                newPositionData: data
              })}
            />
          )}

          {currentStep === 3 && (
            <Step4_Responsibilities
              responsibilities={draft.responsibilities}
              onChange={(r: string[]) => updateDraft({ responsibilities: r })}
            />
          )}

          {currentStep === 4 && (
            <Step5_Permissions
              template={draft.permissionTemplate}
              permissions={draft.permissions}
              onTemplateChange={(t: string) => updateDraft({ permissionTemplate: t })}
              onPermissionsChange={(p: string[]) => updateDraft({ permissions: p })}
            />
          )}

          {currentStep === 5 && (
            <Step6_Message
              message={draft.personalMessage}
              expirationDays={draft.expirationDays}
              onMessageChange={(m: string) => updateDraft({ personalMessage: m })}
              onExpirationChange={(d: number) => updateDraft({ expirationDays: d })}
            />
          )}

          {currentStep === 6 && (
            <Step7_Review draft={draft} positions={positions} />
          )}
        </div>

        <ComposerFooter
          onBack={currentStep > 0 ? handleBack : undefined}
          onNext={currentStep < STEPS.length - 1 ? handleNext : undefined}
          onSend={currentStep === STEPS.length - 1 ? handleSend : undefined}
          nextDisabled={!canProceed()}
          isLastStep={currentStep === STEPS.length - 1}
          sending={sending}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL STEP & HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ComposerHeader({ steps, currentStep, onClose, ventureName }: {
  steps: { id: string; label: string }[]
  currentStep: number
  onClose: () => void
  ventureName: string
}) {
  return (
    <div className="border-b border-white/[0.06]">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
            Invite Member
          </p>
          <h2 className="text-[16px] font-bold text-white mt-0.5">
            {ventureName}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-6 pb-4">
        <div className="flex items-center gap-1.5">
          {steps.map((step, idx) => {
            const active = idx === currentStep
            const done = idx < currentStep
            return (
              <div key={step.id} className="flex items-center gap-1.5 flex-1">
                <div className={
                  'flex items-center gap-2 flex-1 h-1 rounded-full transition-all ' +
                  (done ? 'bg-white' : active ? 'bg-white/60' : 'bg-white/[0.06]')
                } />
                {idx === currentStep && (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white font-bold whitespace-nowrap">
                    {step.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-zinc-500">
            Step {currentStep + 1} of {steps.length}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            {steps[currentStep]?.label}
          </p>
        </div>
      </div>
    </div>
  )
}

function ComposerFooter({ onBack, onNext, onSend, nextDisabled, isLastStep, sending, nextLabel }: {
  onBack?: () => void
  onNext?: () => void
  onSend?: () => void
  nextDisabled?: boolean
  isLastStep?: boolean
  sending?: boolean
  nextLabel?: string
}) {
  return (
    <div className="border-t border-white/[0.06] px-6 py-4 flex items-center justify-between bg-[#0d0d10]">
      <button
        onClick={onBack}
        disabled={!onBack}
        className={
          'flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-semibold transition-colors ' +
          (onBack
            ? 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            : 'text-zinc-700 cursor-not-allowed')
        }
      >
        <CaretLeft size={13} weight="bold" />
        Back
      </button>

      {isLastStep ? (
        <button
          onClick={onSend}
          disabled={nextDisabled || sending}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-white text-black text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {sending ? (
            <><CircleNotch size={13} className="animate-spin" /> Sending…</>
          ) : (
            <><PaperPlaneTilt size={13} weight="fill" /> Send Invitation</>
          )}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white text-black text-[12.5px] font-bold hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {nextLabel || 'Continue'}
          <CaretRight size={13} weight="bold" />
        </button>
      )}
    </div>
  )
}

function UserSearchInput({ onSelect, autoFocus, placeholder }: {
  onSelect: (user: DSRTUser) => void
  autoFocus?: boolean
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DSRTUser[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=8`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setResults(data.users || [])
        }
      } catch {}
      if (!cancelled) setLoading(false)
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || 'Search DSRT users by @username or name...'}
          className="w-full h-11 pl-9 pr-4 bg-[#09090b] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15]"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CircleNotch size={14} className="animate-spin text-zinc-500" />
          </div>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 max-h-[280px] overflow-y-auto bg-[#0d0d10] border border-white/[0.08] rounded-lg shadow-2xl z-30">
          {loading ? (
            <div className="p-4 flex items-center gap-2 text-[12px] text-zinc-500">
              <CircleNotch size={12} className="animate-spin" /> Searching directory…
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-[12px] text-zinc-500">
              No users found matching "{query}"
            </div>
          ) : (
            <div className="py-1">
              {results.map(u => (
                <button
                  key={u.id}
                  onClick={() => { onSelect(u); setQuery(''); setOpen(false) }}
                  className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      u.full_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate">{u.full_name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UserPreviewCard({ user, onChange }: { user: DSRTUser; onChange?: () => void }) {
  return (
    <div className="bg-[#0d0d10] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[16px] font-bold text-white flex-shrink-0">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          user.full_name?.charAt(0).toUpperCase()
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-white truncate">{user.full_name}</p>
        <p className="text-[11.5px] text-zinc-400 truncate mt-0.5">@{user.username}</p>
      </div>

      {onChange && (
        <button
          onClick={onChange}
          className="flex items-center gap-1 text-[11.5px] font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <Pencil size={11} />
          Change
        </button>
      )}
    </div>
  )
}

function EligibilityBanner({ result }: { result: any }) {
  if (!result) return null
  const { eligible, hard_failures = [], warnings = [] } = result

  if (eligible && warnings.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 flex items-start gap-3">
        <CheckCircle size={18} weight="fill" className="text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-bold text-emerald-300">Eligible</p>
          <p className="text-[11.5px] text-emerald-200/80 mt-0.5">
            This user can be invited without any conflicts.
          </p>
        </div>
      </div>
    )
  }

  if (!eligible) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4 space-y-2">
        <div className="flex items-start gap-3">
          <XCircle size={18} weight="fill" className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-bold text-red-300">Cannot Invite</p>
            <p className="text-[11.5px] text-red-200/80 mt-0.5">
              The following conflicts prevent this invitation:
            </p>
          </div>
        </div>
        <ul className="ml-9 space-y-1">
          {hard_failures.map((f: string, i: number) => (
            <li key={i} className="text-[12px] text-red-300">• {f}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 space-y-2">
      <div className="flex items-start gap-3">
        <WarningCircle size={18} weight="fill" className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-bold text-amber-300">Eligible with Notes</p>
        </div>
      </div>
      <ul className="ml-9 space-y-1">
        {warnings.map((w: string, i: number) => (
          <li key={i} className="text-[12px] text-amber-200">• {w}</li>
        ))}
      </ul>
    </div>
  )
}

function PermissionMatrix({ template, permissions, onTemplateChange, onPermissionsChange }: {
  template: string
  permissions: string[]
  onTemplateChange: (t: string) => void
  onPermissionsChange: (p: string[]) => void
}) {
  const CATALOG = [
    { id: 'view_venture', category: 'General', label: 'View Venture Workspace', description: 'Access internal venture workspace' },
    { id: 'edit_overview', category: 'General', label: 'Edit Overview', description: 'Update mission, vision, and pitch' },
    { id: 'view_team', category: 'Team', label: 'View Team Directory', description: 'See internal team roster' },
    { id: 'invite_members', category: 'Team', label: 'Invite Members', description: 'Send new team invitations' },
    { id: 'publish_updates', category: 'Content', label: 'Publish Updates', description: 'Author and publish update posts' },
    { id: 'manage_documents', category: 'Content', label: 'Manage Knowledge Base', description: 'Create, edit, delete documents' },
  ]

  const TEMPLATES: Record<string, string[]> = {
    co_founder: ['view_venture', 'edit_overview', 'view_team', 'invite_members', 'publish_updates', 'manage_documents'],
    executive: ['view_venture', 'edit_overview', 'view_team', 'invite_members', 'publish_updates'],
    member: ['view_venture', 'view_team', 'publish_updates', 'manage_documents'],
    advisor: ['view_venture', 'view_team', 'publish_updates'],
  }

  const handleTemplate = (t: string) => {
    onTemplateChange(t)
    onPermissionsChange(TEMPLATES[t] || [])
  }

  const toggle = (id: string) => {
    const next = permissions.includes(id) ? permissions.filter(p => p !== id) : [...permissions, id]
    onPermissionsChange(next)
    onTemplateChange('custom')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'co_founder', label: 'Co-founder' },
          { id: 'executive', label: 'Executive' },
          { id: 'member', label: 'Team Member' },
          { id: 'advisor', label: 'Advisor' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => handleTemplate(t.id)}
            className={
              'p-2.5 rounded-lg border text-left text-[12px] font-bold transition-all ' +
              (template === t.id ? 'border-white/20 bg-white/[0.06] text-white' : 'border-white/[0.06] bg-[#0d0d10] text-zinc-400')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 bg-[#0d0d10] border border-white/[0.06] p-3 rounded-xl">
        {CATALOG.map(p => {
          const checked = permissions.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.02] text-left"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-white border-white' : 'border-zinc-700'}`}>
                {checked && <Check size={10} weight="bold" className="text-black" />}
              </div>
              <div>
                <p className={`text-[12px] font-semibold ${checked ? 'text-white' : 'text-zinc-500'}`}>{p.label}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Step1_SelectUser({ selectedUser, onSelectUser }: { selectedUser: DSRTUser | null; onSelectUser: (u: DSRTUser | null) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-white">Who are you inviting?</h3>
        <p className="text-[12.5px] text-zinc-500 mt-1">Search the DSRT directory for the user you'd like to invite.</p>
      </div>

      {!selectedUser ? (
        <UserSearchInput onSelect={onSelectUser} autoFocus />
      ) : (
        <UserPreviewCard user={selectedUser} onChange={() => onSelectUser(null)} />
      )}
    </div>
  )
}

function Step2_Eligibility({ slug, invitedUserId, positionId, onResult }: { slug: string; invitedUserId: string; positionId?: string | null; onResult: (r: any) => void }) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    async function check() {
      setLoading(true)
      try {
        const res = await fetch(`/api/ventures/${slug}/team/invitations/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invited_user_id: invitedUserId, position_id: positionId || null })
        })
        const data = await res.json()
        setResult(data.eligibility)
        onResult(data.eligibility)
      } catch {}
      setLoading(false)
    }
    check()
  }, [slug, invitedUserId, positionId, onResult])

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-white">Eligibility Check</h3>
        <p className="text-[12.5px] text-zinc-500 mt-1">Verifying member invite eligibility.</p>
      </div>

      {loading ? (
        <div className="p-6 border border-white/[0.06] bg-[#0d0d10] rounded-xl text-[12.5px] text-zinc-500 flex items-center gap-2">
          <CircleNotch size={14} className="animate-spin" /> Running checks…
        </div>
      ) : (
        <EligibilityBanner result={result} />
      )}
    </div>
  )
}

function Step3_Position({ positions, selectedPositionId, positionMode, newPositionData, onSelectExisting, onSelectNew }: {
  positions: any[]; selectedPositionId: string | null; positionMode: 'existing' | 'new' | null; newPositionData: any;
  onSelectExisting: (id: string) => void; onSelectNew: (data: any) => void;
}) {
  const [mode, setMode] = useState<'existing' | 'new'>(positionMode || 'existing')
  const [title, setTitle] = useState(newPositionData?.title || '')

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-white">What position are they filling?</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setMode('existing')} className={`p-3 rounded-xl border text-left text-[12.5px] font-bold ${mode === 'existing' ? 'border-white/20 bg-white/[0.06] text-white' : 'border-white/[0.06] text-zinc-400'}`}>Existing Position</button>
        <button onClick={() => setMode('new')} className={`p-3 rounded-xl border text-left text-[12.5px] font-bold ${mode === 'new' ? 'border-white/20 bg-white/[0.06] text-white' : 'border-white/[0.06] text-zinc-400'}`}>Create New Position</button>
      </div>

      {mode === 'existing' ? (
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {positions.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectExisting(p.id)}
              className={`w-full p-3 rounded-xl border text-left text-[13px] font-bold ${selectedPositionId === p.id ? 'border-white/20 bg-white/[0.06] text-white' : 'border-white/[0.06] text-zinc-400'}`}
            >
              {p.title} ({p.team_name || 'General'})
            </button>
          ))}
        </div>
      ) : (
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1.5">Position Title *</label>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); onSelectNew({ title: e.target.value, positionType: 'employee', capacity: 1 }) }}
            placeholder="e.g. Senior Designer"
            className="w-full h-10 px-3 bg-[#0d0d10] border border-white/[0.06] rounded-lg text-[13px] text-white focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}

function Step4_Responsibilities({ responsibilities, onChange }: { responsibilities: string[]; onChange: (r: string[]) => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-bold text-white">Responsibilities</h3>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="Add responsibility..."
          className="flex-1 h-9 px-3 bg-[#0d0d10] border border-white/[0.06] rounded-lg text-[13px] text-white focus:outline-none"
        />
        <button onClick={() => { if(val.trim()){ onChange([...responsibilities, val.trim()]); setVal('') }}} className="px-3 bg-white text-black font-bold rounded-lg text-xs">Add</button>
      </div>
      <div className="space-y-1">
        {responsibilities.map((r, i) => (
          <p key={i} className="text-[12px] text-zinc-300">• {r}</p>
        ))}
      </div>
    </div>
  )
}

function Step5_Permissions({ template, permissions, onTemplateChange, onPermissionsChange }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-bold text-white">Access Scope</h3>
      <PermissionMatrix
        template={template}
        permissions={permissions}
        onTemplateChange={onTemplateChange}
        onPermissionsChange={onPermissionsChange}
      />
    </div>
  )
}

function Step6_Message({ message, expirationDays, onMessageChange, onExpirationChange }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-bold text-white">Personal Note</h3>
      <textarea
        value={message}
        onChange={e => onMessageChange(e.target.value)}
        placeholder="Why they should join..."
        rows={4}
        className="w-full p-3 bg-[#0d0d10] border border-white/[0.06] rounded-lg text-[13px] text-white focus:outline-none resize-none"
      />
    </div>
  )
}

function Step7_Review({ draft, positions }: { draft: InvitationDraft; positions: any[] }) {
  const pos = positions.find(p => p.id === draft.positionId)
  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-bold text-white">Review & Confirm</h3>
      <div className="p-4 bg-[#0d0d10] border border-white/[0.06] rounded-xl space-y-2 text-[12.5px]">
        <p><strong>Inviting:</strong> {draft.invitedUser?.full_name} (@{draft.invitedUser?.username})</p>
        <p><strong>Role:</strong> {pos?.title || draft.newPositionData?.title || 'Team Member'}</p>
        <p><strong>Permissions:</strong> {draft.permissions.length} granted</p>
      </div>
    </div>
  )
}