'use client'

import { useEffect, useState } from 'react'
import { UserCircle, Rocket, Buildings, UsersThree } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export type MailTab = 'personal' | 'projects' | 'ventures' | 'network'

interface Props {
  activeTab: MailTab
  onTabChange: (tab: MailTab) => void
}

const TABS: Array<{
  key: MailTab
  label: string
  sublabel: string
  icon: any
}> = [
  { key: 'personal', label: 'Personal', sublabel: 'Direct & important conversations', icon: UserCircle },
  { key: 'network', label: 'Network', sublabel: 'Community & networking', icon: UsersThree },
  { key: 'projects', label: 'Projects', sublabel: 'Project-related communication', icon: Rocket },
  { key: 'ventures', label: 'Ventures', sublabel: 'Venture & business communication', icon: Buildings },
]

export function MailTabs({ activeTab, onTabChange }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const supabase = createClient()

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/mail/tab-counts')
      const d = await res.json()
      setCounts(d.counts || {})
    } catch {}
  }

  useEffect(() => {
    fetchCounts()
    const channel = supabase
      .channel('mail_tab_counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mail_thread_participants' }, () => fetchCounts())
      .subscribe()

    const refresh = () => fetchCounts()
    window.addEventListener('mail:refresh', refresh)
    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('mail:refresh', refresh)
    }
  }, [])

  return (
    <div className={cn(
      "grid grid-cols-4 border-b border-white/[0.06]",
      "bg-gradient-to-b from-[#0c0c12] to-[#0a0a0f]"
    )}>
      {TABS.map((tab, idx) => {
        const Icon = tab.icon
        const active = activeTab === tab.key
        const count = counts[tab.key] || 0
        const isLast = idx === TABS.length - 1

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "relative flex items-center gap-3 px-4 py-3 group transition-all",
              !isLast && "border-r border-white/[0.04]",
              active ? "bg-gradient-to-b from-white/[0.05] to-transparent" : "hover:bg-white/[0.02]"
            )}
          >
            {active && <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white rounded-t" />}

            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all",
              active 
                ? "bg-white/[0.09] border-white/[0.14]" 
                : "bg-white/[0.02] border-white/[0.05] group-hover:bg-white/[0.05] group-hover:border-white/[0.08]"
            )}>
              <Icon 
                className={cn(
                  "w-[18px] h-[18px] transition-colors",
                  active ? "text-white" : "text-white/45 group-hover:text-white/75"
                )} 
                weight={active ? "fill" : "regular"} 
              />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className={cn(
                  "text-[13px] font-bold tracking-tight transition-colors",
                  active ? "text-white" : "text-white/70 group-hover:text-white/90"
                )}>
                  {tab.label}
                </p>
                {count > 0 && (
                  <span className={cn(
                    "text-[9.5px] font-bold px-1.5 h-[15px] flex items-center rounded",
                    active 
                      ? "bg-white text-black" 
                      : "bg-white/[0.08] text-white/70"
                  )}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <p className={cn(
                "text-[10.5px] mt-0.5 truncate transition-colors",
                active ? "text-white/55" : "text-white/35"
              )}>
                {tab.sublabel}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}