'use client'

export type TabId =
  | 'explore'
  | 'my-opportunities'
  | 'applications'
  | 'saved'
  | 'suggested'
  | 'people'
  | 'categories'

interface Props {
  active: TabId
  onChange: (t: TabId) => void
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'my-opportunities', label: 'My Opportunities' },
  { id: 'applications', label: 'Applications' },
  { id: 'saved', label: 'Saved' },
  { id: 'suggested', label: 'Suggested' },
  { id: 'people', label: 'People' },
  { id: 'categories', label: 'Categories' },
]

export function LookingForTabs({ active, onChange }: Props) {
  return (
    <div className="relative border-b border-zinc-800">
      {/* Subtle gradient underline shadow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
        {TABS.map(t => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={
                'relative py-3 px-4 text-[13.5px] font-semibold whitespace-nowrap transition-all ' +
                (isActive
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-200')
              }
            >
              <span className="relative z-10">{t.label}</span>

              {/* 3D active indicator with gradient */}
              {isActive && (
                <>
                  {/* Bottom bar with gradient + glow */}
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-white/20 via-white to-white/20"
                    style={{
                      boxShadow: '0 0 12px rgba(255,255,255,0.4), 0 0 4px rgba(255,255,255,0.6)',
                    }}
                  />
                  {/* Subtle background glow */}
                  <span className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-8 rounded-lg bg-gradient-to-b from-white/[0.03] to-white/[0.01] pointer-events-none" />
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}