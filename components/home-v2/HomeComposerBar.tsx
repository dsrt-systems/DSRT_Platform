'use client'

import { useState } from 'react'
import { Image as ImageIcon, VideoCamera, ChartBar, Code, ArticleNyTimes } from '@phosphor-icons/react'
import { HomeComposerModal } from './composer/HomeComposerModal'
import { DsrtPanel, DsrtAvatar, DsrtButton } from '@/components/dsrt'

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
      <DsrtPanel
        id="home-composer-bar"
        variant="default"
        padding="none"
        as="div"
        className="cursor-text group hover:border-white/[0.12] transition-all overflow-hidden"
        onClick={() => handleOpen('update')}
      >
        <div className="p-4 flex items-center gap-3">
          <DsrtAvatar
            src={currentUser?.avatar_url}
            name={currentUser?.full_name || currentUser?.username}
            size="md"
          />
          <div className="flex-1 text-[14px] text-white/50 group-hover:text-white/70 transition-colors font-medium">
            What's happening in DSRT?
          </div>
        </div>

        <div className="px-3 pb-3 pt-2 bg-black/20 border-t border-white/[0.04] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap overflow-x-auto scrollbar-hide">
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
          >
            Post
          </DsrtButton>
        </div>
      </DsrtPanel>

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
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] text-[12px] font-medium transition-all select-none"
    >
      <Icon size={14} weight="regular" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}