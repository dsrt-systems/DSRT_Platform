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
          border border-teal-400/25
          bg-gradient-to-br from-teal-500/25 via-cyan-600/15 to-teal-900/30
          shadow-[0_0_0_1px_rgba(45,212,191,0.08),0_8px_32px_rgba(13,148,136,0.12)]
          hover:border-teal-300/40 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.15),0_12px_40px_rgba(13,148,136,0.2)]
          transition-all duration-200
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
              bg-black/30 border border-white/[0.08]
              text-[14px] text-white/55 group-hover:text-white/75
              group-hover:border-teal-400/20 transition-all font-medium
            "
          >
            What's happening in DSRT?
          </div>
        </div>

        {/* Actions row */}
        <div className="px-3 pb-3 pt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5 flex-wrap overflow-x-auto scrollbar-hide">
            <QuickAction Icon={ImageIcon} label="Image" onClick={() => handleOpen('update')} />
            <QuickAction Icon={VideoCamera} label="Video" onClick={() => handleOpen('update')} />
            <QuickAction Icon={ArticleNyTimes} label="Article" onClick={() => handleOpen('discussion')} />
            <QuickAction Icon={ChartBar} label="Poll" onClick={() => handleOpen('question')} />
            <QuickAction Icon={Code} label="Code" onClick={() => handleOpen('build_log')} />
          </div>

          <DsrtButton
            size="sm"
            variant="primary"
            onClick={(e) => { e.stopPropagation(); handleOpen('update') }}
            className="!bg-teal-500 hover:!bg-teal-400 !text-black !font-bold !border-0 shadow-[0_2px_12px_rgba(20,184,166,0.35)]"
          >
            Post
          </DsrtButton>
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
        text-white/55 hover:text-white hover:bg-white/[0.1]
        text-[12px] font-medium transition-all select-none
      "
    >
      <Icon size={14} weight="regular" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}