'use client'

import { useState } from 'react'
import { CaretDown, Globe } from '@phosphor-icons/react'

interface Category {
  slug: string
  name: string
  count?: number
}

interface Props {
  categories: Category[]
  allSectors: { id: string; name: string; slug: string }[]
  active: string
  onChange: (slug: string) => void
}

export function VentureCategoryPills({ categories, allSectors, active, onChange }: Props) {
  const [moreOpen, setMoreOpen] = useState(false)

  const primary = categories.slice(0, 14)
  const extraSectors = allSectors.filter(s => !primary.some(p => p.name.toLowerCase() === s.name.toLowerCase()))

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {primary.map(cat => {
        const isActive = active === cat.slug || active === cat.name
        return (
          <button
            key={cat.slug}
            onClick={() => onChange(cat.slug === 'all' ? 'all' : cat.name)}
            className={
              'px-3 h-8 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ' +
              (isActive
                ? 'bg-white text-black'
                : 'bg-white/[0.03] border border-white/[0.08] text-white/70 hover:bg-white/[0.06] hover:text-white')
            }
          >
            {cat.slug === 'all' && <Globe size={11} weight="fill" />}
            {cat.name}
            {cat.count !== undefined && cat.count > 0 && (
              <span className={
                'text-[10px] font-bold px-1.5 py-0.5 rounded ' +
                (isActive ? 'bg-black/10 text-black' : 'bg-white/[0.06] text-white/50')
              }>
                {cat.count}
              </span>
            )}
          </button>
        )
      })}

      {extraSectors.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="px-3 h-8 rounded-lg text-[12px] font-medium bg-white/[0.03] border border-white/[0.08] text-white/70 hover:bg-white/[0.06] hover:text-white flex items-center gap-1"
          >
            More <CaretDown size={11} />
          </button>
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
              <div className="absolute z-40 top-10 left-0 w-[280px] max-h-[380px] overflow-y-auto bg-[#12121a] border border-white/[0.08] rounded-lg shadow-2xl p-2">
                {extraSectors.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { onChange(s.name); setMoreOpen(false) }}
                    className="w-full text-left px-3 py-2 text-[12px] text-white/85 hover:bg-white/[0.05] rounded-md"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
