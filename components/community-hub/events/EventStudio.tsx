'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StudioShell } from '@/components/kernel-ui'
import { Calendar, MapPin, Ticket, MessageSquare, Rocket, Sparkles } from 'lucide-react'
import { StudioSectionCard, StudioField, StudioFooter, StudioTipCard } from '@/components/community-hub/studio/primitives'
import { LogoUploader } from '@/components/community-hub/studio/LogoUploader'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const STEPS = [
  { key: 'basics', label: 'Basics', icon: Calendar },
  { key: 'schedule', label: 'Schedule & Location', icon: MapPin },
  { key: 'registration', label: 'Registration', icon: Ticket },
  { key: 'communication', label: 'Communication', icon: MessageSquare },
  { key: 'review', label: 'Review & Publish', icon: Rocket },
] as const

type StepKey = (typeof STEPS)[number]['key']

interface Props {
  slug: string
  communityId: string
  eventId?: string   // if editing
}

export function EventStudio({ slug, communityId, eventId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<StepKey>('basics')
  const [loading, setLoading] = useState(!!eventId)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [event, setEvent] = useState<any>(null)
  const [config, setConfig] = useState<any>({})
  const [form, setForm] = useState<any>({
    title: '',
    tagline: '',
    description: '',
    event_type: 'GENERAL',
    is_online: true,
    location_text: '',
    meeting_url: '',
    timezone: 'UTC',
    cover_url: null,
    cover_file_id: null,
    starts_at: '',
    ends_at: '',
    registration: {
      capacity: null as number | null,
      waitlist_enabled: true,
      require_approval: false,
      members_only: false,
    },
  })

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/v1/community/events/${eventId}`)
      .then(r => r.json())
      .then(j => {
        const e = j?.data?.event
        const c = j?.data?.config
        if (e) {
          setEvent(e)
          setForm((f: any) => ({
            ...f,
            title: e.title, tagline: e.tagline || '', description: e.description || '',
            event_type: e.event_type, is_online: e.is_online,
            location_text: e.location_text || '', meeting_url: e.meeting_url || '',
            timezone: e.timezone || 'UTC', cover_url: e.cover_url,
            cover_file_id: e.cover_file_id,
            starts_at: e.starts_at?.slice(0, 16) || '', ends_at: e.ends_at?.slice(0, 16) || '',
            registration: {
              capacity: c?.capacity ?? null,
              waitlist_enabled: c?.waitlist_enabled ?? true,
              require_approval: c?.require_approval ?? false,
              members_only: c?.members_only ?? false,
            },
          }))
          setConfig(c || {})
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [eventId])

  const currentIndex = STEPS.findIndex(s => s.key === step)
  const canContinue = useMemo(() => {
    if (step === 'basics') return !!form.title?.trim()
    if (step === 'schedule') return !!form.starts_at
    return true
  }, [step, form])

  const save = async (): Promise<any> => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        community_id: communityId,
      }
      const url = eventId ? `/api/v1/community/events/${eventId}` : '/api/v1/community/events'
      const res = await fetch(url, {
        method: eventId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `evt-${communityId}-${Date.now()}`,
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json?.error?.message || 'Save failed'); return null }
      const e = json?.data?.event
      if (e && !eventId) {
        router.replace(`/community/${slug}/studio/events/${e.id}/edit`)
      } else if (e) {
        setEvent(e)
      }
      toast.success('Saved')
      return e
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    let target = event
    if (!target) target = await save()
    if (!target) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/v1/community/events/${target.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REGISTRATION_OPEN' }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json?.error?.message || 'Publish failed'); return }
      toast.success('Event published — registration open')
      router.push(`/community/${slug}/events/${target.slug}`)
    } finally {
      setPublishing(false)
    }
  }

  const next = async () => {
    await save()
    const n = STEPS[currentIndex + 1]
    if (n) setStep(n.key)
  }
  const back = () => {
    const p = STEPS[currentIndex - 1]
    if (p) setStep(p.key)
  }

  const navGroups = [{
    label: 'Event Studio',
    items: STEPS.map((s, i) => ({
      label: `${i + 1}. ${s.label}`,
      href: `#${s.key}`,
      icon: s.icon,
      disabled: i > currentIndex + 1,
    })),
  }]

  return (
    <StudioShell
      title={form.title || 'New event'}
      subtitle="Event Studio"
      exitHref={`/community/${slug}/studio`}
      exitLabel="Save & exit"
      status={saving ? 'saving' : 'saved'}
      navGroups={navGroups}
    >
      <div className="mb-6 flex items-center gap-2 text-[11.5px] font-mono uppercase tracking-wider text-white/40">
        <span>Step {currentIndex + 1} of {STEPS.length}</span>
        <span className="opacity-40">·</span>
        <span className="text-white/70">{STEPS[currentIndex].label}</span>
      </div>

      {step === 'basics' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <StudioSectionCard title="Basics" description="Give your event a title, a short tagline, and a cover image.">
            <StudioField label="Title" htmlFor="title" counter={`${form.title.length}/300`}>
              <input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={300}
                placeholder="e.g., DSRT Robotics Kickoff Meetup"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[14px] text-white placeholder:text-white/25"
              />
            </StudioField>
            <StudioField label="Tagline" optional counter={`${form.tagline.length}/300`}>
              <input
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                maxLength={300}
                placeholder="One-liner that hooks attendees."
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[13px] text-white placeholder:text-white/25"
              />
            </StudioField>
            <StudioField label="Description" optional>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={6}
                placeholder="What is this event about? What should attendees expect?"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[12.5px] text-white placeholder:text-white/25 resize-none leading-relaxed"
              />
            </StudioField>
            <StudioField label="Event type">
              <div className="flex flex-wrap gap-1.5">
                {['GENERAL', 'WORKSHOP', 'MEETUP', 'HACKATHON', 'CONFERENCE', 'AMA', 'DEMO'].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, event_type: t })}
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11.5px] transition-colors',
                      form.event_type === t
                        ? 'border-white/[0.2] bg-white/[0.08] text-white'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                    )}
                  >
                    {t.toLowerCase()}
                  </button>
                ))}
              </div>
            </StudioField>
            <StudioField label="Cover image" optional>
              <LogoUploader
                value={form.cover_url}
                onChange={(url, fileId) => setForm({ ...form, cover_url: url, cover_file_id: fileId })}
                aspect="wide"
                label="Event cover"
                hint="16:6. Renders at top of event page."
                entityId={communityId}
              />
            </StudioField>
          </StudioSectionCard>
          <StudioTipCard title="Great event titles" icon={Sparkles}>
            <p>Be specific: <em>"Intro to ROS2 Navigation"</em> beats <em>"Robotics Meetup"</em>.</p>
            <p>Keep it under 60 characters when possible.</p>
          </StudioTipCard>
        </div>
      )}

      {step === 'schedule' && (
        <StudioSectionCard title="Schedule & Location">
          <div className="grid gap-4 md:grid-cols-2">
            <StudioField label="Starts at" htmlFor="starts_at">
              <input
                id="starts_at"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[13px] text-white"
              />
            </StudioField>
            <StudioField label="Ends at" optional>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[13px] text-white"
              />
            </StudioField>
          </div>
          <StudioField label="Timezone">
            <input
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="UTC / Asia/Kolkata / America/New_York…"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[12.5px] text-white placeholder:text-white/30 font-mono"
            />
          </StudioField>
          <StudioField label="Mode">
            <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
              <button
                onClick={() => setForm({ ...form, is_online: true })}
                className={cn(
                  'rounded-full px-3 py-1 text-[11.5px] transition-colors',
                  form.is_online ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                )}
              >Online</button>
              <button
                onClick={() => setForm({ ...form, is_online: false })}
                className={cn(
                  'rounded-full px-3 py-1 text-[11.5px] transition-colors',
                  !form.is_online ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                )}
              >In person</button>
            </div>
          </StudioField>
          {form.is_online ? (
            <StudioField label="Meeting URL" optional>
              <input
                value={form.meeting_url}
                onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
                placeholder="https://meet.google.com/…"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[12.5px] text-white placeholder:text-white/30 font-mono"
              />
            </StudioField>
          ) : (
            <StudioField label="Venue / Location">
              <input
                value={form.location_text}
                onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                placeholder="Venue address, city, region…"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[13px] text-white placeholder:text-white/30"
              />
            </StudioField>
          )}
        </StudioSectionCard>
      )}

      {step === 'registration' && (
        <StudioSectionCard title="Registration" description="Capacity, waitlist, and access controls.">
          <StudioField label="Capacity" optional hint="Leave empty for unlimited.">
            <input
              type="number"
              min={1}
              value={form.registration.capacity ?? ''}
              onChange={(e) => setForm({ ...form, registration: { ...form.registration, capacity: e.target.value ? parseInt(e.target.value) : null } })}
              placeholder="e.g., 100"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[13px] text-white placeholder:text-white/30"
            />
          </StudioField>
          <Toggle
            label="Enable waitlist when full"
            hint="Recommended. Automatically promotes people when spots open."
            v={!!form.registration.waitlist_enabled}
            onChange={(v) => setForm({ ...form, registration: { ...form.registration, waitlist_enabled: v } })}
          />
          <Toggle
            label="Members-only event"
            v={!!form.registration.members_only}
            onChange={(v) => setForm({ ...form, registration: { ...form.registration, members_only: v } })}
          />
          <Toggle
            label="Require approval to attend"
            hint="Organizer manually approves each registration."
            v={!!form.registration.require_approval}
            onChange={(v) => setForm({ ...form, registration: { ...form.registration, require_approval: v } })}
          />
        </StudioSectionCard>
      )}

      {step === 'communication' && (
        <StudioSectionCard title="Communication" description="Reminders sent to confirmed attendees.">
          <p className="text-[12.5px] text-white/60">
            Default reminders will be sent 24 hours and 1 hour before the event. You'll be able to send custom announcements from the event dashboard after publishing.
          </p>
        </StudioSectionCard>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <StudioSectionCard title="Ready to publish?" description="Publishing opens registration immediately.">
            <ul className="space-y-2 text-[12.5px] text-white/75">
              <li>· <strong className="text-white">{form.title}</strong></li>
              <li>· {form.starts_at ? new Date(form.starts_at).toLocaleString() : '—'}</li>
              <li>· {form.is_online ? 'Online' : (form.location_text || 'In person')}</li>
              <li>· Capacity: {form.registration.capacity ?? 'Unlimited'} {form.registration.waitlist_enabled ? '(waitlist on)' : ''}</li>
              <li>· {form.registration.members_only ? 'Members only' : 'Open to all'}</li>
            </ul>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={save} disabled={saving} className="rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/80 hover:text-white px-4 py-2 text-[12px] font-medium transition-colors">
                Save as draft
              </button>
              <button
                onClick={publish}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 rounded-full bg-white text-black hover:bg-zinc-100 px-4 py-2 text-[12.5px] font-semibold transition-colors"
              >
                {publishing ? 'Publishing…' : 'Publish & open registration'}
              </button>
            </div>
          </StudioSectionCard>
        </div>
      )}

      <div className="mt-8">
        <StudioFooter
          onBack={currentIndex > 0 ? back : undefined}
          onContinue={currentIndex < STEPS.length - 1 ? next : undefined}
          onSaveExit={async () => { await save(); router.push(`/community/${slug}/studio`) }}
          disabled={!canContinue}
          loading={saving}
        />
      </div>
    </StudioShell>
  )
}

function Toggle({ label, hint, v, onChange }: { label: string; hint?: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] transition-colors p-3 cursor-pointer">
      <div className="min-w-0">
        <p className="text-[13px] text-white/85">{label}</p>
        {hint && <p className="mt-0.5 text-[11.5px] text-white/45">{hint}</p>}
      </div>
      <span className={cn('relative inline-flex h-5 w-9 rounded-full transition-colors border', v ? 'bg-white border-white' : 'bg-white/[0.04] border-white/[0.1]')}>
        <input type="checkbox" className="sr-only" checked={v} onChange={(e) => onChange(e.target.checked)} />
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full transition-transform', v ? 'left-4 bg-black' : 'left-0.5 bg-white')} />
      </span>
    </label>
  )
}