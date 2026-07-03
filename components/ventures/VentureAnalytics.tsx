'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, Target, CheckCircle2 } from 'lucide-react'

interface VentureAnalyticsProps {
  ventureId: string
}

export function VentureAnalytics({ ventureId }: VentureAnalyticsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/analytics/venture?ventureId=${ventureId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
  }, [ventureId])

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox
          label="Followers"
          value={data.followers}
          subtitle={`+${data.new_followers_30d} this month`}
          icon={Users}
        />
        <StatBox
          label="Team Size"
          value={data.members}
          icon={Users}
        />
        <StatBox
          label="Milestones"
          value={`${data.milestones_achieved}/${data.milestones_total}`}
          icon={Target}
        />
        <StatBox
          label="Completion"
          value={`${data.completion_rate}%`}
          icon={CheckCircle2}
        />
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6">
        <h3 className="font-semibold mb-2">Founder Insights</h3>
        <p className="text-sm text-muted-foreground">
          Full growth charts coming soon. For now, use these metrics to
          understand momentum.
        </p>
      </div>
    </div>
  )
}

function StatBox({ label, value, subtitle, icon: Icon }: any) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}