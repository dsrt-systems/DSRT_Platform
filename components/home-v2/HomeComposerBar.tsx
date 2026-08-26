'use client'

import { useState } from 'react'
import { Image as ImageIcon, VideoCamera, ChartBar, Code, ArticleNyTimes } from '@phosphor-icons/react'
import { HomeComposerModal } from './composer/HomeComposerModal'

interface Props {
  currentUser: any
}

export function HomeComposerBar({ currentUser }: Props) {
  const [open, setOpen] = useState(false)
  const [initialType, setInitialType] = useState('update')

  const handleOpen = (type: string = 'update') => {
    setInitialType(type)
    setOpen(true)
  }

  return (
    <>
      <div
        onClick={() => handleOpen('update')}
        className={
          'group rounded-xl border border-zinc-800/60 cursor-text transition-all ' +
          'bg-gradient-to-b from-zinc-900/60 via-zinc-900/40 to-zinc-950/60 ' +
          'hover:border-zinc-700/80 hover:from-zinc-900/80 ' +
          'shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_2px_8px_rgba(0,0,0,0.3)]'
        }
      >
        <div className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[13px] font-bold text-zinc-400">
                {(currentUser?.full_name || currentUser?.username || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 text-[14.5px] text-zinc-500 group-hover:text-zinc-400 transition-colors font-medium">
            What&apos;s happening in DSRT?
          </div>
        </div>

        <div className="px-3 pb-3 pt-2 border-t border-zinc-800/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5 flex-wrap">
            <QuickAction Icon={ImageIcon} label="Image" onClick={() => handleOpen('update')} />
            <QuickAction Icon={VideoCamera} label="Video" onClick={() => handleOpen('update')} />
            <QuickAction Icon={ArticleNyTimes} label="Article" onClick={() => handleOpen('discussion')} />
            <QuickAction Icon={ChartBar} label="Poll" onClick={() => handleOpen('question')} />
            <QuickAction Icon={Code} label="Code" onClick={() => handleOpen('build_log')} />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); handleOpen('update') }}
            className={
              'inline-flex items-center h-9 px-5 rounded-lg ' +
              'bg-white text-black hover:bg-zinc-100 ' +
              'text-[13px] font-bold tracking-tight transition-all ' +
              'shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]'
            }
          >
            Post
          </button>
        </div>
      </div>

      {open && (
        <HomeComposerModal 
          open={open} 
          onClose={() => setOpen(false)} 
          currentUser={currentUser} 
          initialType={initialType} 
        />
      )}
    </>
  )
}

function QuickAction({ Icon, label, onClick }: { Icon: any; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={
        'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md ' +
        'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60 ' +
        'text-[12px] font-medium transition-all'
      }
    >
      <Icon size={13} weight="regular" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}