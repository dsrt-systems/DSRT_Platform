'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Save,
  Archive,
  ArrowRightLeft,
  AlertTriangle,
  Search,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { SectionHeader, LoadingState } from '@/components/kernel-ui'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Props {
  slug: string
  communityId: string
  isOwner: boolean
}

export function SettingsPage({ slug, communityId, isOwner }: Props) {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/community/${slug}/studio/settings`)
      .then((r) => r.json())
      .then((j) => setSettings(j?.data?.settings || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const patch = (k: string, v: any) => setSettings((prev: any) => ({ ...prev, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/community/${slug}/studio/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error?.message || 'Save failed')
        return
      }
      toast.success('Settings saved')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading settings…" />

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-end justify-between gap-4 mb-4">
          <SectionHeader title="General settings" variant="mono" />
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-full bg-white text-black hover:bg-zinc-100 px-4 py-1.5 text-[12px] font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" strokeWidth={1.75} />}
            Save
          </button>
        </div>

        <div className="space-y-2">
          <Toggle label="Members can create posts" v={settings?.allow_member_posts !== false} onChange={(v) => patch('allow_member_posts', v)} />
          <Toggle label="Members can create polls" v={settings?.allow_member_polls !== false} onChange={(v) => patch('allow_member_polls', v)} />
          <Toggle label="Members can upload resources" v={!!settings?.allow_member_resources} onChange={(v) => patch('allow_member_resources', v)} />
          <Toggle label="Members can invite others" v={!!settings?.allow_member_invites} onChange={(v) => patch('allow_member_invites', v)} />
          <Toggle label="Require moderator approval on posts" v={!!settings?.require_post_approval} onChange={(v) => patch('require_post_approval', v)} />
          <Toggle label="Show member directory publicly" v={settings?.show_member_directory !== false} onChange={(v) => patch('show_member_directory', v)} />
          <Toggle label="Show member count publicly" v={settings?.show_member_count !== false} onChange={(v) => patch('show_member_count', v)} />
        </div>
      </section>

      {isOwner && (
        <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-300" strokeWidth={1.75} />
            <p className="label-mono text-red-300/80">Danger zone</p>
          </div>

          <div className="space-y-3">
            <TransferOwnershipDialog slug={slug} communityId={communityId} />
            <ArchiveDialog slug={slug} communityId={communityId} />
          </div>
        </section>
      )}
    </div>
  )
}

function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] transition-colors p-3 cursor-pointer">
      <span className="text-[13px] text-white/85">{label}</span>
      <span
        className={cn(
          'relative inline-flex h-5 w-9 rounded-full transition-colors border',
          v ? 'bg-white border-white' : 'bg-white/[0.04] border-white/[0.1]'
        )}
      >
        <input type="checkbox" className="sr-only" checked={v} onChange={(e) => onChange(e.target.checked)} />
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full transition-transform',
            v ? 'left-4 bg-black' : 'left-0.5 bg-white'
          )}
        />
      </span>
    </label>
  )
}

// -----------------------------------------------------------
// TransferOwnershipDialog — with member search picker
// -----------------------------------------------------------

interface Member {
  identity_id: string
  user: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    is_verified?: boolean
  } | null
}

function TransferOwnershipDialog({ slug, communityId }: { slug: string; communityId: string }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Member | null>(null)
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!open) {
      setSelected(null)
      setConfirm('')
    }
  }, [open])

  const submit = async () => {
    if (!selected?.user) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/community/${slug}/studio/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_owner_identity_id: selected.user.id,
          confirm,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error?.message || 'Transfer failed')
        return
      }
      toast.success('Ownership transferred')
      setOpen(false)
      router.push(`/community/${slug}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full text-left rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] p-4 flex items-center gap-3 transition-colors">
          <ArrowRightLeft className="w-4 h-4 text-white/70" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">Transfer ownership</p>
            <p className="text-[11.5px] text-white/50 mt-0.5">
              Hand this community over to another active member. You will become an admin.
            </p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#0c0c12] border-white/[0.08] text-white max-w-md sm:rounded-2xl p-0 gap-0">
        <div className="p-5 space-y-4">
          <div>
            <p className="label-mono text-white/50">Transfer ownership</p>
            <h3 className="mt-1 text-[15px] font-semibold text-white">This action cannot be undone</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[11.5px] font-mono uppercase tracking-wider text-white/60">
              Choose new owner
            </label>
            <MemberSearchPicker
              slug={slug}
              selected={selected}
              onSelect={setSelected}
            />
            <p className="text-[11px] text-white/45">
              New owner must already be an active member of this community.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11.5px] font-mono uppercase tracking-wider text-white/60">
              Type <span className="text-white/90">TRANSFER OWNERSHIP</span> to confirm
            </label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[12.5px] text-white placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="border-t border-white/[0.06] p-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="text-[12px] text-white/60 hover:text-white px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !selected?.user || confirm !== 'TRANSFER OWNERSHIP'}
            className={cn(
              'rounded-full px-4 py-2 text-[12px] font-semibold transition-colors',
              selected?.user && confirm === 'TRANSFER OWNERSHIP'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/[0.06] text-white/40 cursor-not-allowed'
            )}
          >
            {busy ? 'Transferring…' : 'Transfer ownership'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MemberSearchPicker({
  slug,
  selected,
  onSelect,
}: {
  slug: string
  selected: Member | null
  onSelect: (m: Member | null) => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim() || q.trim().length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/v1/community/${slug}/studio/members?status=ACTIVE&q=${encodeURIComponent(q.trim())}&limit=8`,
          { cache: 'no-store' }
        )
        const json = await res.json()
        setResults(json?.data?.items || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q, slug])

  if (selected?.user) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-white/[0.14] bg-white/[0.06] p-3">
        <Avatar className="w-9 h-9 border border-white/[0.08]">
          <AvatarImage src={selected.user.avatar_url ?? undefined} />
          <AvatarFallback className="text-[11px] bg-white/[0.08] text-white/80">
            {(selected.user.full_name || '?').charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate flex items-center gap-1">
            {selected.user.full_name}
            {selected.user.is_verified && (
              <ShieldCheck className="w-3 h-3 text-white/60" strokeWidth={1.75} />
            )}
          </p>
          <p className="text-[11px] text-white/50 truncate">@{selected.user.username}</p>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="text-[11px] text-white/50 hover:text-white transition-colors"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
        <Search className="w-3.5 h-3.5 text-white/40" strokeWidth={1.75} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search members by name or @username…"
          className="flex-1 bg-transparent outline-none text-[13px] text-white placeholder:text-white/30"
        />
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />}
      </div>

      {q.trim().length >= 2 && (
        <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-[12px] text-white/40 text-center py-4">
              {loading ? 'Searching…' : 'No members match'}
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {results.map((m) => {
                const u = m.user
                if (!u) return null
                return (
                  <li key={m.identity_id}>
                    <button
                      onClick={() => onSelect(m)}
                      className="w-full text-left p-2.5 hover:bg-white/[0.04] flex items-center gap-3"
                    >
                      <Avatar className="w-8 h-8 border border-white/[0.06]">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px] bg-white/[0.06] text-white/80">
                          {(u.full_name || '?').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-white truncate flex items-center gap-1">
                          {u.full_name}
                          {u.is_verified && (
                            <ShieldCheck className="w-3 h-3 text-white/60" strokeWidth={1.75} />
                          )}
                        </p>
                        <p className="text-[11px] text-white/45 truncate">@{u.username}</p>
                      </div>
                      <Check className="w-4 h-4 text-white/30" strokeWidth={1.75} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------
// ArchiveDialog — unchanged from before, kept for completeness
// -----------------------------------------------------------

function ArchiveDialog({ slug, communityId }: { slug: string; communityId: string }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!open) setConfirm('')
  }, [open])

  const submit = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/community/${slug}/studio/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error?.message || 'Archive failed')
        return
      }
      toast.success('Community archived')
      setOpen(false)
      router.push('/my-communities')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full text-left rounded-lg border border-red-500/20 bg-red-500/[0.03] hover:bg-red-500/[0.06] p-4 flex items-center gap-3 transition-colors">
          <Archive className="w-4 h-4 text-red-300" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-red-200">Archive community</p>
            <p className="text-[11.5px] text-red-200/60 mt-0.5">
              Make this community read-only. Discoverable only to admins.
            </p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#0c0c12] border-white/[0.08] text-white max-w-md sm:rounded-2xl p-0 gap-0">
        <div className="p-5 space-y-4">
          <div>
            <p className="label-mono text-red-300/80">Archive community</p>
            <h3 className="mt-1 text-[15px] font-semibold text-white">Are you sure?</h3>
            <p className="mt-1 text-[12.5px] text-white/60 leading-relaxed">
              The community becomes archived. New joins are blocked. Content becomes read-only.
              You can reach out to support to reverse this.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-[11.5px] font-mono uppercase tracking-wider text-white/60">
              Type <span className="text-white/90">ARCHIVE</span> to confirm
            </label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] focus:border-white/[0.18] outline-none px-3 py-2 text-[12.5px] text-white placeholder:text-white/30"
            />
          </div>
        </div>
        <div className="border-t border-white/[0.06] p-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="text-[12px] text-white/60 hover:text-white px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || confirm !== 'ARCHIVE'}
            className={cn(
              'rounded-full px-4 py-2 text-[12px] font-semibold transition-colors',
              confirm === 'ARCHIVE'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/[0.06] text-white/40 cursor-not-allowed'
            )}
          >
            {busy ? 'Archiving…' : 'Archive community'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}