'use client'

import { Plus } from '@phosphor-icons/react'
import { DsrtSection, DsrtButton } from '@/components/dsrt'

interface Props {
  currentUser: any
}

export function HomeHeader({ currentUser }: Props) {
  const openComposer = () => document.getElementById('home-composer-bar')?.click()

  return (
    <div className="py-2">
      <DsrtSection
        title="Home Feed"
        description="What's happening across the DSRT ecosystem"
        actions={
          <DsrtButton variant="white" size="sm" onClick={openComposer}>
            <Plus size={16} weight="bold" />
            <span className="hidden sm:inline">Create Post</span>
          </DsrtButton>
        }
      />
    </div>
  )
}