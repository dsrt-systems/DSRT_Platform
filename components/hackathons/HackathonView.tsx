'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Award,
  CheckCircle2,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface HackathonViewProps {
  hackathon: any
  isRegistered: boolean
  totalRegistered: number
}

export function HackathonView({
  hackathon,
  isRegistered: initialRegistered,
  totalRegistered,
}: HackathonViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [registered, setRegistered] = useState(initialRegistered)
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(totalRegistered)

  const toggleRegistration = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)

    if (registered) {
      await supabase
        .from('hackathon_registrations')
        .delete()
        .eq('hackathon_id', hackathon.id)
        .eq('user_id', user.id)
      setRegistered(false)
      setCount((c) => c - 1)
    } else {
      await supabase.from('hackathon_registrations').insert({
        hackathon_id: hackathon.id,
        user_id: user.id,
      })
      setRegistered(true)
      setCount((c) => c + 1)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm overflow-hidden">
        {hackathon.cover_url && (
          <div className="h-40 md:h-56 bg-muted overflow-hidden">
            <img
              src={hackathon.cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-500 capitalize">
                  {hackathon.status}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-muted capitalize">
                  {hackathon.mode}
                </span>
              </div>
              <h1 className="text-3xl font-bold">{hackathon.title}</h1>
              {hackathon.tagline && (
                <p className="text-muted-foreground mt-1">
                  {hackathon.tagline}
                </p>
              )}
              {hackathon.host_name && (
                <p className="text-sm mt-2">
                  Hosted by <span className="font-medium">{hackathon.host_name}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {hackathon.start_date && (
              <InfoBox
                icon={Calendar}
                label="Starts"
                value={format(new Date(hackathon.start_date), 'MMM d')}
              />
            )}
            {hackathon.location && (
              <InfoBox
                icon={MapPin}
                label="Location"
                value={hackathon.location}
              />
            )}
            {hackathon.prize_pool && (
              <InfoBox
                icon={Award}
                label="Prize Pool"
                value={hackathon.prize_pool}
                highlight
              />
            )}
            <InfoBox
              icon={Users}
              label="Registered"
              value={count.toLocaleString()}
            />
          </div>

          {hackathon.themes && hackathon.themes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hackathon.themes.map((t: string) => (
                <span
                  key={t}
                  className="px-2.5 py-1 text-xs bg-muted/60 rounded-md"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-border/40">
            <Button
              size="lg"
              onClick={toggleRegistration}
              disabled={loading}
              variant={registered ? 'outline' : 'default'}
              className="w-full md:w-auto"
            >
              {registered ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Registered — Withdraw
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Register for Hackathon
                </>
              )}
            </Button>
            {hackathon.registration_deadline && (
              <p className="text-xs text-muted-foreground mt-2">
                Registration closes{' '}
                {formatDistanceToNow(
                  new Date(hackathon.registration_deadline),
                  { addSuffix: true }
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {hackathon.description && (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6">
          <h2 className="font-semibold mb-3">About</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {hackathon.description}
          </p>
        </div>
      )}
    </div>
  )
}

function InfoBox({ icon: Icon, label, value, highlight }: any) {
  return (
    <div
      className={`rounded-xl p-3 ${
        highlight ? 'bg-amber-500/10' : 'bg-background/40 border border-border/40'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon
          className={`w-3.5 h-3.5 ${
            highlight ? 'text-amber-500' : 'text-muted-foreground'
          }`}
        />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
      </div>
      <p
        className={`font-semibold ${
          highlight ? 'text-amber-500' : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
}