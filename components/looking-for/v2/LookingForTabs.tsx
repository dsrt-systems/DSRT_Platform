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
    <div className="border-b border-zinc-800">
      <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
        {TABS.map(t => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={
                'py-3 px-4 text-[13.5px] font-semibold whitespace-nowrap transition-colors border-b-2 ' +
                (isActive
                  ? 'text-white border-white'
                  : 'text-zinc-500 border-transparent hover:text-zinc-200')
              }
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}