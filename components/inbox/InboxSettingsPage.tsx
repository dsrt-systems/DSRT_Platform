'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, CircleNotch, Warning } from '@phosphor-icons/react'

interface InboxSettings {
  user_id: string
  signature: string | null
  signature_html: string | null
  use_signature_on_reply: boolean
  notify_new_message: boolean
  notify_new_connection: boolean
  notify_application: boolean
  notify_dsrt_official: boolean
  notify_digest_frequency: string
  notify_email: boolean
  notify_push: boolean
  reading_pane: string
  messages_per_page: number
  auto_mark_read_seconds: number
  keyboard_shortcuts_enabled: boolean
  default_font: string
  default_font_size: string
  send_and_archive: boolean
  vacation_enabled: boolean
  vacation_subject: string | null
  vacation_message: string | null
  vacation_start_date: string | null
  vacation_end_date: string | null
}

export function InboxSettingsPage() {
  const [settings, setSettings] = useState<InboxSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/inbox/settings')
      .then(r => r.json())
      .then(d => { setSettings(d.settings); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const save = useCallback(async (patch: Partial<InboxSettings>) => {
    if (!settings) return
    const merged = { ...settings, ...patch }
    setSettings(merged)
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch('/api/inbox/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [settings])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        {[0,1,2].map(i => <div key={i} className="h-40 bg-white/[0.02] border border-white/[0.06] rounded-lg animate-pulse" />)}
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-white">Inbox Settings</h1>
          <p className="text-[13px] text-white/50 mt-0.5">Configure your messaging preferences</p>
        </div>
        {(saving || saved) && (
          <div className="inline-flex items-center gap-1.5 text-[12px] text-white/50 font-medium">
            {saving ? (
              <><CircleNotch size={11} className="animate-spin" /> Saving...</>
            ) : (
              <><Check size={11} weight="bold" className="text-emerald-400" /> Saved</>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-[12px] text-red-400">
          <Warning size={12} weight="fill" className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Notifications */}
        <Card title="Notifications" description="Choose what you want to be notified about">
          <ToggleRow label="New messages" description="When someone sends you a message" checked={settings.notify_new_message} onChange={(v) => save({ notify_new_message: v })} />
          <ToggleRow label="Connection requests" description="When someone wants to connect" checked={settings.notify_new_connection} onChange={(v) => save({ notify_new_connection: v })} />
          <ToggleRow label="Applications" description="When someone applies to your venture or project" checked={settings.notify_application} onChange={(v) => save({ notify_application: v })} />
          <ToggleRow label="DSRT official" description="Important updates from DSRT" checked={settings.notify_dsrt_official} onChange={(v) => save({ notify_dsrt_official: v })} />
          <ToggleRow label="Email notifications" description="Receive notifications via email" checked={settings.notify_email} onChange={(v) => save({ notify_email: v })} />
          <ToggleRow label="Push notifications" description="Browser push notifications" checked={settings.notify_push} onChange={(v) => save({ notify_push: v })} />

          <div className="px-5 py-3.5 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-semibold text-white">Digest frequency</p>
                <p className="text-[12px] text-white/50 mt-0.5">How often to receive email digests</p>
              </div>
              <select
                value={settings.notify_digest_frequency}
                onChange={(e) => save({ notify_digest_frequency: e.target.value })}
                className="h-9 pl-3 pr-8 rounded-md border border-white/[0.1] bg-white/[0.04] text-white text-[13px] font-medium cursor-pointer focus:outline-none appearance-none"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                <option value="realtime">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Reading */}
        <Card title="Reading" description="How messages are displayed">
          <div className="px-5 py-3.5 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-semibold text-white">Messages per page</p>
              </div>
              <select
                value={settings.messages_per_page}
                onChange={(e) => save({ messages_per_page: parseInt(e.target.value) })}
                className="h-9 pl-3 pr-8 rounded-md border border-white/[0.1] bg-white/[0.04] text-white text-[13px] font-medium cursor-pointer focus:outline-none appearance-none"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          <ToggleRow label="Keyboard shortcuts" description="Enable keyboard shortcuts in inbox" checked={settings.keyboard_shortcuts_enabled} onChange={(v) => save({ keyboard_shortcuts_enabled: v })} />
          <ToggleRow label="Send and archive" description="Automatically archive after sending a reply" checked={settings.send_and_archive} onChange={(v) => save({ send_and_archive: v })} />

          <div className="px-5 py-3.5 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-semibold text-white">Auto-mark as read</p>
                <p className="text-[12px] text-white/50 mt-0.5">Seconds after opening a message</p>
              </div>
              <select
                value={settings.auto_mark_read_seconds}
                onChange={(e) => save({ auto_mark_read_seconds: parseInt(e.target.value) })}
                className="h-9 pl-3 pr-8 rounded-md border border-white/[0.1] bg-white/[0.04] text-white text-[13px] font-medium cursor-pointer focus:outline-none appearance-none"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                <option value="0">Immediately</option>
                <option value="2">2 seconds</option>
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Signature */}
        <Card title="Signature" description="Added to the bottom of your messages">
          <div className="px-5 py-3.5">
            <textarea
              value={settings.signature || ''}
              onChange={(e) => save({ signature: e.target.value })}
              rows={4}
              placeholder="e.g. Best regards,&#10;Your Name&#10;Founder at Your Venture"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.15] resize-none leading-relaxed"
            />
            <ToggleRow label="Include on replies" description="Add signature when replying to messages" checked={settings.use_signature_on_reply} onChange={(v) => save({ use_signature_on_reply: v })} noBorder />
          </div>
        </Card>

        {/* Vacation Responder */}
        <Card title="Vacation responder" description="Auto-reply when you are away">
          <ToggleRow label="Enable vacation responder" description="Automatically reply to incoming messages" checked={settings.vacation_enabled} onChange={(v) => save({ vacation_enabled: v })} />

          {settings.vacation_enabled && (
            <div className="px-5 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Start date</label>
                  <input
                    type="date"
                    value={settings.vacation_start_date?.slice(0, 10) || ''}
                    onChange={(e) => save({ vacation_start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full h-9 px-3 rounded-md bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-white/[0.15]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">End date</label>
                  <input
                    type="date"
                    value={settings.vacation_end_date?.slice(0, 10) || ''}
                    onChange={(e) => save({ vacation_end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full h-9 px-3 rounded-md bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-white/[0.15]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Subject</label>
                <input
                  type="text"
                  value={settings.vacation_subject || ''}
                  onChange={(e) => save({ vacation_subject: e.target.value })}
                  placeholder="Out of office"
                  className="w-full h-9 px-3 rounded-md bg-white/[0.04] border border-white/[0.08] text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.15]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Message</label>
                <textarea
                  value={settings.vacation_message || ''}
                  onChange={(e) => save({ vacation_message: e.target.value })}
                  rows={3}
                  placeholder="I am currently away and will respond when I return..."
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.15] resize-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.06]">
        <h3 className="text-[14px] font-bold text-white">{title}</h3>
        {description && <p className="text-[12px] text-white/50 mt-0.5">{description}</p>}
      </div>
      <div className="divide-y divide-white/[0.06]">
        {children}
      </div>
    </div>
  )
}

function ToggleRow({
  label, description, checked, onChange, noBorder,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  noBorder?: boolean
}) {
  return (
    <div className={'flex items-start justify-between gap-4 px-5 py-3.5' + (noBorder ? '' : '')}>
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-white">{label}</p>
        <p className="text-[12px] text-white/50 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className={'relative shrink-0 w-9 rounded-full transition-colors mt-0.5 ' + (checked ? 'bg-white' : 'bg-white/20')}
        style={{ height: 20 }}
      >
        <span className={'absolute top-0.5 w-4 h-4 rounded-full shadow transition-all ' + (checked ? 'left-[18px] bg-black' : 'left-0.5 bg-white')} />
      </button>
    </div>
  )
}
