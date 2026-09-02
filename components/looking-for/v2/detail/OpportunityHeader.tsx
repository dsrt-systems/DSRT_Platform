'use client'

import {
  ArrowLeft, BookmarkSimple, ShareNetwork, Flag,
} from '@phosphor-icons/react'
import { SmartApplyButton } from '@/components/looking-for/application-studio/SmartApplyButton'

interface Props {
  opportunity: any
  tab: 'opportunity' | 'about-poster'
  onTabChange: (t: 'opportunity' | 'about-poster') => void
  isOwner: boolean
  isClosed: boolean
  hasApplied: boolean
  onApply: () => void
  onSave: () => void
  onShare: () => void
  onReport: () => void
  onBack: () => void
}

export function OpportunityHeader({
  opportunity, tab, onTabChange,
  isOwner, isClosed,
  onSave, onShare, onReport, onBack,
}: Props) {
  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={13} weight="bold" />
          Back
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <IconAction
            Icon={BookmarkSimple}
            label={opportunity.is_saved ? 'Saved' : 'Save'}
            onClick={onSave}
            active={opportunity.is_saved}
          />
          <IconAction Icon={ShareNetwork} label="Share" onClick={onShare} />
          <IconAction Icon={Flag} label="Report" onClick={onReport} />

          <SmartApplyButton
            opportunity={opportunity}
            isOwner={isOwner}
            isClosed={isClosed}
            className="inline-flex h-8 min-w-[130px] text-[12px] px-3 shadow-none rounded-lg whitespace-nowrap"
          />
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center gap-6">
          <TabButton active={tab === 'opportunity'} onClick={() => onTabChange('opportunity')}>
            Opportunity
          </TabButton>
          <TabButton active={tab === 'about-poster'} onClick={() => onTabChange('about-poster')}>
            About the Poster
          </TabButton>
        </div>
      </div>
    </header>
  )
}

function TabButton({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        'relative py-2.5 text-[13px] font-semibold tracking-tight transition-colors ' +
        (active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300')
      }
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
      )}
    </button>
  )
}

function IconAction({
  Icon, label, onClick, active,
}: {
  Icon: any
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[12px] font-medium transition-colors ' +
        (active
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
          : 'border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200')
      }
    >
      <Icon size={12} weight={active ? 'fill' : 'regular'} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}