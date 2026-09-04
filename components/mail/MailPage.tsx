// filepath: components/mail/MailPage.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { PencilSimple } from '@phosphor-icons/react'
import { useOnIdentityChange } from './hooks/useMailIdentity'
import { useComposer } from './composer/ComposerContext'
import { MailTopbar } from './MailTopbar'
import { MailSidebar } from './MailSidebar'
import { MailTabs, MailTab } from './MailTabs'
import { ThreadList } from './ThreadList'
import { CocoSidebar } from './CocoSidebar'
import { AdvancedFilterBar, MailFilters } from './AdvancedFilterBar'
import { useMailShortcuts } from './hooks/useMailShortcuts'
import { MailCommandPalette } from './MailCommandPalette'
import { MailErrorBoundary } from './MailErrorBoundary'
import { MailMobileDrawer } from './MailMobileDrawer'
import { MAIL_EVENTS } from '@/lib/mail/mailEvents'
import { cn } from '@/lib/utils'

const EMPTY_FILTERS: MailFilters = {
  hasAttachment: false,
  isUnread: false,
  isStarred: false,
  fromType: 'all',
  dateRange: 'all',
}

export function MailPage() {
  const { openCompose } = useComposer()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [cocoOpen, setCocoOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MailTab>('personal')
  const [folder, setFolder] = useState('inbox')
  const [searchQ, setSearchQ] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [filters, setFilters] = useState<MailFilters>(EMPTY_FILTERS)

  const filtersActive = useMemo(
    () =>
      filters.hasAttachment ||
      filters.isUnread ||
      filters.isStarred ||
      filters.fromType !== 'all' ||
      filters.dateRange !== 'all',
    [filters]
  )

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1)
    window.addEventListener(MAIL_EVENTS.refresh, handler)
    return () => window.removeEventListener(MAIL_EVENTS.refresh, handler)
  }, [])

  useEffect(() => {
    const handleOpenDraft = (e: Event) => {
      const draftState = (e as CustomEvent).detail
      if (!draftState) return
      openCompose({
        ...draftState,
        draft_id: draftState.draft_id,
      })
    }
    window.addEventListener(MAIL_EVENTS.openDraft, handleOpenDraft)
    return () => window.removeEventListener(MAIL_EVENTS.openDraft, handleOpenDraft)
  }, [openCompose])

  useOnIdentityChange(() => {
    setRefreshKey((k) => k + 1)
  })

  useMailShortcuts({
    onCompose: () => openCompose({ mode: 'new' }),
    onSearch: () => {
      setMobileSearchOpen(true)
      requestAnimationFrame(() => {
        const el = document.querySelector('input[placeholder*="Search in emails"]') as HTMLElement
        el?.focus()
      })
    },
    onCommandPalette: () => setCmdPaletteOpen(true),
    onArchive: () => {},
    onTrash: () => {},
    activeThreadId: null,
  })

  const executeCommand = (cmdId: string) => {
    if (cmdId === 'compose') openCompose({ mode: 'new' })
    if (cmdId === 'inbox') setFolder('inbox')
    if (cmdId === 'starred') setFolder('starred')
    if (cmdId === 'sent') setFolder('sent')
    if (cmdId === 'snoozed') setFolder('snoozed')
    if (cmdId === 'drafts') setFolder('drafts')
    if (cmdId === 'scheduled') setFolder('scheduled')
    if (cmdId === 'archive') setFolder('archive')
  }

  const handleFolderChange = (f: string) => {
    setFolder(f)
    setMobileNavOpen(false)
  }

  const showFiltersMobile = mobileSearchOpen || filtersActive || mobileFiltersOpen

  return (
    // FIX: Removed the negative margins (-mx-4) that were cutting the screen off
    <div className="h-[calc(100dvh-64px)] flex flex-col bg-[#05070D] text-white overflow-hidden relative w-full">
      <MailErrorBoundary label="DSRT Mail" onReset={() => setRefreshKey((k) => k + 1)}>
        
        {/* Mobile top bar */}
        <div className="lg:hidden border-b border-white/[0.06] bg-gradient-to-b from-[#0A0C13] to-[#08090F] shrink-0">
          <MailTopbar
            compact
            onToggleSidebar={() => setMobileNavOpen(true)}
            searchQ={searchQ}
            onSearchChange={setSearchQ}
            onToggleCoco={() => setCocoOpen((v) => !v)}
            cocoOpen={cocoOpen}
            searchOpen={mobileSearchOpen}
            onSearchOpenChange={(open) => {
              setMobileSearchOpen(open)
              if (!open) {
                setMobileFiltersOpen(false)
                if (!filtersActive) setFilters(EMPTY_FILTERS)
              }
            }}
            onOpenFilters={() => setMobileFiltersOpen((v) => !v)}
            filtersActive={filtersActive || mobileFiltersOpen}
          />
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:block shrink-0">
          <MailTopbar
            onToggleSidebar={() => {}}
            searchQ={searchQ}
            onSearchChange={setSearchQ}
            onToggleCoco={() => setCocoOpen((v) => !v)}
            cocoOpen={cocoOpen}
          />
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Desktop sidebar */}
          <div className="hidden lg:flex">
            <MailErrorBoundary label="Mail sidebar">
              <MailSidebar
                activeFolder={folder}
                onFolderChange={handleFolderChange}
                onComposeClick={() => openCompose({ mode: 'new' })}
              />
            </MailErrorBoundary>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Tabs */}
            <div className={mobileSearchOpen ? 'hidden lg:block' : ''}>
              <MailTabs activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} />
            </div>

            {/* Filter bar */}
            <div className={showFiltersMobile ? 'block' : 'hidden lg:block'}>
              <AdvancedFilterBar filters={filters} onChange={setFilters} />
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
              <MailErrorBoundary label="Mail list" onReset={() => setRefreshKey((k) => k + 1)}>
                <ThreadList
                  key={refreshKey + '-' + folder + '-' + activeTab + '-' + searchQ + '-' + JSON.stringify(filters)}
                  activeFolder={folder}
                  activeTab={activeTab}
                  searchQ={searchQ}
                  filters={filters}
                  selectedThreadId={null}
                  onSelectThread={() => {}}
                />
              </MailErrorBoundary>
            </div>
          </div>

          <CocoSidebar open={cocoOpen} onClose={() => setCocoOpen(false)} activeThreadId={null} />
        </div>

        {/* Mobile Compose FAB - Fixed positioning and shadow */}
        <button
          onClick={() => openCompose({ mode: 'new' })}
          className={cn(
            'lg:hidden fixed right-4 z-30 flex items-center gap-2 h-14 px-5',
            'rounded-2xl bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[15px] font-semibold',
            'shadow-[0_8px_24px_rgba(79,124,255,0.4)] active:scale-95 transition-all'
          )}
          style={{ bottom: 'calc(24px + env(safe-area-inset-bottom))' }}
        >
          <PencilSimple className="w-5 h-5" weight="bold" />
          Compose
        </button>

        {/* Mobile side drawer */}
        <MailMobileDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
          <MailSidebar
            activeFolder={folder}
            onFolderChange={handleFolderChange}
            onComposeClick={() => {
              setMobileNavOpen(false)
              openCompose({ mode: 'new' })
            }}
            mobile
          />
        </MailMobileDrawer>

        <MailCommandPalette
          isOpen={cmdPaletteOpen}
          onClose={() => setCmdPaletteOpen(false)}
          onSelectAction={executeCommand}
        />
      </MailErrorBoundary>
    </div>
  )
}