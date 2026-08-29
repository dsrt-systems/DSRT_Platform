'use client'

interface Props {
  stats: {
    total: number
    new: number
    shortlisted: number
    interview: number
    hired: number
  }
}

export function ApplicationStatsMini({ stats }: Props) {
  const { total, new: newCount, shortlisted, interview, hired } = stats

  if (total === 0) return null

  const segments = [
    { label: 'New', count: newCount, color: 'bg-blue-500/60' },
    { label: 'Shortlisted', count: shortlisted, color: 'bg-purple-500/60' },
    { label: 'Interview', count: interview, color: 'bg-amber-500/60' },
    { label: 'Hired', count: hired, color: 'bg-emerald-500/60' },
  ]

  return (
    <div className="space-y-1.5">
      {/* Segmented bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.03]">
        {segments.map((s, i) => {
          const width = total > 0 ? (s.count / total) * 100 : 0
          if (width === 0) return null
          return (
            <div
              key={i}
              className={s.color}
              style={{ width: `${width}%` }}
              title={`${s.label}: ${s.count}`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-zinc-500 flex-wrap">
        {segments.filter(s => s.count > 0).map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
            <span>{s.count} {s.label.toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}