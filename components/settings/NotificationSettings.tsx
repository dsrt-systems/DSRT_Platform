'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'

interface NotificationSettingsProps {
  profile: any
}

const NOTIFICATION_TYPES = [
  { key: 'post_like', label: 'Post likes', desc: 'When someone likes your post' },
  { key: 'post_comment', label: 'Comments', desc: 'When someone comments on your post' },
  { key: 'follow', label: 'New followers', desc: 'When someone follows you' },
  { key: 'project_join', label: 'Project joins', desc: 'When someone joins your project' },
  { key: 'message', label: 'Direct messages', desc: 'When you receive a message' },
  { key: 'mentor_reply', label: 'Mentor replies', desc: 'When DSRT Mentor responds' },
]

export function NotificationSettings({ profile }: NotificationSettingsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    profile.notif_prefs || {
      post_like: true,
      post_comment: true,
      follow: true,
      project_join: true,
      message: true,
      mentor_reply: true,
    }
  )
  const [saving, setSaving] = useState(false)

  const toggle = (key: string) => {
    setPrefs({ ...prefs, [key]: !prefs[key] })
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('users')
      .update({ notif_prefs: prefs })
      .eq('id', profile.id)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">Notifications</h2>
          <p className="text-xs text-muted-foreground">
            Choose what you want to be notified about
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {NOTIFICATION_TYPES.map((t) => (
          <div
            key={t.key}
            className="flex items-center justify-between p-3 rounded-lg border border-border/40"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs[t.key] ?? true}
                onChange={() => toggle(t.key)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  )
}