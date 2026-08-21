'use client'

import { useState } from 'react'
import { X, Clock, Sun, Coffee, Moon, CalendarBlank } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSnooze: (until: Date) => void
}

export function SnoozeModal({ open, onClose, onSnooze }: Props) {
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')

  if (!open) return null

  const now = new Date()
  const laterToday = new Date(now); laterToday.setHours(now.getHours() + 3)
  const tomorrowMorning = new Date(now); tomorrowMorning.setDate(now.getDate() + 1); tomorrowMorning.setHours(9, 0, 0, 0)
  const tomorrowEvening = new Date(now); tomorrowEvening.setDate(now.getDate() + 1); tomorrowEvening.setHours(18, 0, 0, 0)
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7); nextWeek.setHours(9, 0, 0, 0)

  const options = [
    { icon: Coffee, label: 'Later today', time: laterToday, subtitle: laterToday.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) },
    { icon: Sun, label: 'Tomorrow morning', time: tomorrowMorning, subtitle: 'Tomorrow, 9:00 AM' },
    { icon: Moon, label: 'Tomorrow evening', time: tomorrowEvening, subtitle: 'Tomorrow, 6:00 PM' },
    { icon: CalendarBlank, label: 'Next week', time: nextWeek, subtitle: `${nextWeek.toLocaleDateString([], { weekday: 'long' })}, 9:00 AM` },
  ]

  const handleCustom = () => {
    if (!customDate || !customTime) return
    const d = new Date(`${customDate}T${customTime}`)
    if (isNaN(d.getTime()) || d.getTime() <= Date.now()) return
    onSnooze(d)
  }

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-[400px] rounded-2xl overflow-hidden",
          "bg-gradient-to-b from-[#141419] to-[#0a0a0f]",
          "border border-white/[0.1] shadow-2xl"
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/60" />
            <h3 className="text-[14px] font-bold text-white tracking-tight">Snooze until</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" weight="bold" />
          </button>
        </div>

        <div className="p-2">
          {options.map(o => (
            <button
              key={o.label}
              onClick={() => onSnooze(o.time)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                <o.icon className="w-4 h-4 text-white/70" weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-bold text-white">{o.label}</p>
                <p className="text-[10.5px] text-white/50">{o.subtitle}</p>
              </div>
            </button>
          ))}

          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <p className="text-[9.5px] uppercase tracking-widest font-bold text-white/40 px-3 pb-1.5">
              Pick date & time
            </p>
            <div className="px-3 space-y-2">
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[12px] text-white focus:outline-none focus:border-white/[0.15]"
              />
              <input
                type="time"
                value={customTime}
                onChange={e => setCustomTime(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[12px] text-white focus:outline-none focus:border-white/[0.15]"
              />
              <button
                onClick={handleCustom}
                disabled={!customDate || !customTime}
                className="w-full h-9 rounded-lg bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-[12.5px] font-bold transition-colors"
              >
                Snooze
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}