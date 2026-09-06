'use client'

import { useState } from 'react'
import { Image as ImageIcon, VideoCamera, ChartBar, Code, ArticleNyTimes } from '@phosphor-icons/react'
import { HomeComposerModal } from './composer/HomeComposerModal'
import { DsrtAvatar, DsrtButton } from '@/components/dsrt'

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
        id="home-composer-bar"
        onClick={() => handleOpen('update')}
        className="
          cursor-text group overflow-hidden rounded-2xl
          bg-[#0D9488]
          border border-teal-300/30
          shadow-[0_4px_0_0_#0F766E,0_8px_24px_rgba(13,148,136,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]
          hover:brightness-110
          active:shadow-[0_2px_0_0_#0F766E,0_4px_12px_rgba(13,148,136,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]
          active:translate-y-[2px]
          transition-all duration-150
        "
      >
        {/* Input row */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <DsrtAvatar
            src={currentUser?.avatar_url}
            name={currentUser?.full_name || currentUser?.username}
            size="md"
          />
          <div
            className="
              flex-1 h-11 flex items-center px-4 rounded-full
              bg-black/25 border border-white/15
              text-[14px] text-white/80 group-hover:text-white
              group-hover:bg-black/30 transition-all font-medium
              shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]
            "
          >
            What's happening in DSRT?
          </div>
        </div>

        {/* Actions row */}
        <div className="px-3 pb-3.5 pt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5 flex-wrap overflow-x-auto scrollbar-hide">
            <QuickAction Icon={ImageIcon} label="Image" onClick={() => handleOpen('update')} />
            <QuickAction Icon={VideoCamera} label="Video" onClick={() => handleOpen('update')} />
            <QuickAction Icon={ArticleNyTimes} label="Article" onClick={() => handleOpen('discussion')} />
            <QuickAction Icon={ChartBar} label="Poll" onClick={() => handleOpen('question')} />
            <QuickAction Icon={Code} label="Code" onClick={() => handleOpen('build_log')} />
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleOpen('update') }}
            className="
              h-8 px-4 rounded-full text-[12.5px] font-bold text-teal-900
              bg-white border border-white/80
              shadow-[0_3px_0_0_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,1)]
              hover:bg-teal-50
              active:shadow-[0_1px_0_0_rgba(0,0,0,0.15)]
              active:translate-y-[2px]
              transition-all duration-100
            "
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
      className="
        inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg
        text-white/80 hover:text-white hover:bg-white/15
        text-[12px] font-medium transition-all select-none
      "
    >
      <Icon size={14} weight="fill" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}