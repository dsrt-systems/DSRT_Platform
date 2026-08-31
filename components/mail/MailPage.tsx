'use client'

import { useState, useEffect } from 'react'
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
import { MAIL_EVENTS } from '@/lib/mail/mailEvents'

export function MailPage() {
  const { openCompose } = useComposer()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [cocoOpen, setCocoOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MailTab>('personal')
  const [folder, setFolder] = useState('inbox')
  const [searchQ, setSearchQ] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [filters, setFilters] = useState<MailFilters>({
    hasAttachment: false,
    isUnread: false,
    isStarred: false,
    fromType: 'all',
    dateRange: 'all',
  })

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
      const el = document.querySelector('input[placeholder*="Search"]') as HTMLElement
      el?.focus()
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

  return (
    <div className="fixed top-[76px] bottom-0 left-0 md:left-56 right-0 flex flex-col bg-[#08080c] text-white overflow-hidden">
      <MailErrorBoundary label="DSRT Mail" onReset={() => setRefreshKey((k) => k + 1)}>
        <MailTopbar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          searchQ={searchQ}
          onSearchChange={setSearchQ}
          onToggleCoco={() => setCocoOpen((v) => !v)}
          cocoOpen={cocoOpen}
        />

        <div className="flex-1 flex overflow-hidden">
          {!sidebarCollapsed && (
            <MailErrorBoundary label="Mail sidebar">
              <MailSidebar
                activeFolder={folder}
                onFolderChange={(f) => setFolder(f)}
                onComposeClick={() => openCompose({ mode: 'new' })}
              />
            </MailErrorBoundary>
          )}

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <MailTabs activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} />
            <AdvancedFilterBar filters={filters} onChange={setFilters} />

            <div className="flex-1 flex overflow-hidden min-h-0">
              <MailErrorBoundary
                label="Mail list"
                onReset={() => setRefreshKey((k) => k + 1)}
              >
                <ThreadList
                  key={refreshKey + '-' + folder + '-' + activeTab + '-' + JSON.stringify(filters)}
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

        <MailCommandPalette
          isOpen={cmdPaletteOpen}
          onClose={() => setCmdPaletteOpen(false)}
          onSelectAction={executeCommand}
        />
      </MailErrorBoundary>
    </div>
  )
}