'use client'

export type HomeTab = 'for-you' | 'following' | 'ventures' | 'trending' | 'latest'

interface Props {
  active: HomeTab
  onChange: (t: HomeTab) => void
}

const TABS: { id: HomeTab; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'following', label: 'Following' },
  { id: 'ventures', label: 'Ventures' },
  { id: 'trending', label: 'Trending' },
  { id: 'latest', label: 'Latest' },
]

export function HomeTabs({ active, onChange }: Props) {
  return (
    <div className="relative border-b border-zinc-800/60">
      <div className="flex gap-0 -mb-px overflow-x-auto scrollbar-hide">
        {TABS.map(t => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={
                'relative py-3.5 px-5 text-[14px] font-semibold tracking-tight whitespace-nowrap transition-all ' +
                (isActive
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-200')
              }
            >
              <span className="relative z-10">{t.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-[2px] rounded-t bg-white"
                  style={{ boxShadow: '0 0 8px rgba(255,255,255,0.25)' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}