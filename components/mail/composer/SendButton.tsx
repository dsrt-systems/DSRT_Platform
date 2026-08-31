'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { PaperPlaneRight, CaretDown, Clock, CalendarBlank } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Props {
  onSend: () => void
  onSchedule?: (date: Date) => void
  disabled?: boolean
  sending?: boolean
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function buildPreset(hours: number, minutes = 0, dayOffset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function nextMondayMorning() {
  const d = new Date()
  const day = d.getDay() // 0 Sun ... 6 Sat
  const add = day === 0 ? 1 : day === 1 ? 7 : (8 - day)
  d.setDate(d.getDate() + add)
  d.setHours(9, 0, 0, 0)
  return d
}

export function SendButton({ onSend, onSchedule, disabled, sending }: Props) {
  const [open, setOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customLocal, setCustomLocal] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const presets = useMemo(() => {
    const now = new Date()
    const tomorrowMorning = buildPreset(9, 0, 1)
    const tomorrowAfternoon = buildPreset(14, 0, 1)
    const tonight = buildPreset(20, 0, 0)
    const monday = nextMondayMorning()

    const list: Array<{ id: string; label: string; sub: string; date: Date }> = []

    if (tonight.getTime() > now.getTime() + 20 * 60 * 1000) {
      list.push({
        id: 'tonight',
        label: 'Tonight',
        sub: tonight.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
        date: tonight,
      })
    }

    list.push(
      {
        id: 'tm',
        label: 'Tomorrow morning',
        sub: tomorrowMorning.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        date: tomorrowMorning,
      },
      {
        id: 'ta',
        label: 'Tomorrow afternoon',
        sub: tomorrowAfternoon.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        date: tomorrowAfternoon,
      },
      {
        id: 'mon',
        label: 'Monday morning',
        sub: monday.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        date: monday,
      }
    )

    return list
  }, [open])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCustomOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const minLocal = useMemo(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }, [customOpen])

  const schedule = (date: Date) => {
    if (!onSchedule) return
    if (date.getTime() <= Date.now() + 60 * 1000) return
    onSchedule(date)
    setOpen(false)
    setCustomOpen(false)
  }

  return (
    <div ref={ref} className="relative flex items-stretch">
      <button
        onClick={onSend}
        disabled={disabled || sending}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3.5 rounded-l-md font-bold text-[12px] transition-all',
          'bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        {sending ? (
          <>
            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Sending
          </>
        ) : (
          <>
            <PaperPlaneRight className="w-3.5 h-3.5" weight="fill" />
            Send
          </>
        )}
      </button>

      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || sending || !onSchedule}
        className={cn(
          'w-7 h-8 rounded-r-md border-l border-black/10 transition-all',
          'bg-white text-black hover:bg-zinc-200 flex items-center justify-center disabled:opacity-40'
        )}
        title="Schedule send"
      >
        <CaretDown className="w-3 h-3" weight="bold" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1.5 w-[260px] z-50 rounded-xl bg-[#121218] border border-white/[0.1] shadow-xl overflow-hidden p-1">
          <button
            onClick={() => {
              onSend()
              setOpen(false)
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left"
          >
            <PaperPlaneRight className="w-3.5 h-3.5 text-white/60" weight="fill" />
            <div>
              <p className="text-[12px] font-semibold text-white">Send now</p>
              <p className="text-[10px] text-white/45">Deliver immediately</p>
            </div>
          </button>

          <div className="h-px bg-white/[0.06] my-1" />

          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => schedule(p.date)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left"
            >
              <Clock className="w-3.5 h-3.5 text-white/55" />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white">{p.label}</p>
                <p className="text-[10px] text-white/45 truncate">{p.sub}</p>
              </div>
            </button>
          ))}

          <div className="h-px bg-white/[0.06] my-1" />

          {!customOpen ? (
            <button
              onClick={() => {
                setCustomOpen(true)
                setCustomLocal(minLocal)
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left"
            >
              <CalendarBlank className="w-3.5 h-3.5 text-white/55" />
              <div>
                <p className="text-[12px] font-semibold text-white">Custom date & time</p>
                <p className="text-[10px] text-white/45">Pick exact schedule</p>
              </div>
            </button>
          ) : (
            <div className="p-2 space-y-2">
              <input
                type="datetime-local"
                value={customLocal}
                min={minLocal}
                onChange={(e) => setCustomLocal(e.target.value)}
                className="w-full h-9 rounded-md bg-white/[0.04] border border-white/[0.1] px-2 text-[12px] text-white focus:outline-none focus:border-white/25"
              />
              <button
                onClick={() => {
                  if (!customLocal) return
                  const d = new Date(customLocal)
                  if (Number.isNaN(d.getTime())) return
                  schedule(d)
                }}
                className="w-full h-8 rounded-md bg-white text-black text-[12px] font-bold hover:bg-zinc-200"
              >
                Schedule send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}