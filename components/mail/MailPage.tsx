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
    hasAttachment: false, isUnread: false, isStarred: false, 
    fromType: 'all', dateRange: 'all'
  })

  // Refresh list when mail:refresh fires
  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('mail:refresh', handler)
    return () => window.removeEventListener('mail:refresh', handler)
  }, [])

  // Open composer when a draft is clicked from ThreadList
  useEffect(() => {
    const handleOpenDraft = (e: Event) => {
      const draftState = (e as CustomEvent).detail
      if (!draftState) return
      openCompose({
        ...draftState,
        draft_id: draftState.draft_id,
      })
    }
    
    window.addEventListener('mail:open_draft', handleOpenDraft)
    return () => window.removeEventListener('mail:open_draft', handleOpenDraft)
  }, [openCompose])

  // Refresh everything when identity changes
  useOnIdentityChange(() => {
    setRefreshKey(k => k + 1)
  })

  useMailShortcuts({
    onCompose: () => openCompose({ mode: 'new' }),
    onSearch: () => { 
      const el = document.querySelector('input[placeholder*="Search"]') as HTMLElement
      el?.focus() 
    },
    onCommandPalette: () => setCmdPaletteOpen(true),
    onArchive: () => {}, // Handled in detail page now
    onTrash: () => {}, // Handled in detail page now
    activeThreadId: null,
  })

  const executeCommand = (cmdId: string) => {
    if (cmdId === 'compose') openCompose({ mode: 'new' })
    if (cmdId === 'inbox') setFolder('inbox')
    if (cmdId === 'starred') setFolder('starred')
    if (cmdId === 'sent') setFolder('sent')
  }

  return (
    <div className="fixed top-14 bottom-0 left-0 md:left-56 right-0 flex flex-col bg-[#08080c] text-white overflow-hidden">
      <MailTopbar 
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        searchQ={searchQ}
        onSearchChange={setSearchQ}
        onToggleCoco={() => setCocoOpen(v => !v)}
        cocoOpen={cocoOpen}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {!sidebarCollapsed && (
          <MailSidebar
            activeFolder={folder}
            onFolderChange={(f) => setFolder(f)}
            onComposeClick={() => openCompose({ mode: 'new' })}
          />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <MailTabs 
            activeTab={activeTab} 
            onTabChange={(t) => setActiveTab(t)} 
          />
          <AdvancedFilterBar filters={filters} onChange={setFilters} />
          
          <div className="flex-1 flex overflow-hidden min-h-0">
            <ThreadList
              key={refreshKey + '-' + folder + '-' + activeTab + '-' + JSON.stringify(filters)}
              activeFolder={folder}
              activeTab={activeTab}
              searchQ={searchQ}
              filters={filters}
              selectedThreadId={null}
              onSelectThread={() => {}}
            />
          </div>
        </div>

        <CocoSidebar 
          open={cocoOpen} 
          onClose={() => setCocoOpen(false)} 
          activeThreadId={null} 
        />
      </div>

      <MailCommandPalette 
        isOpen={cmdPaletteOpen} 
        onClose={() => setCmdPaletteOpen(false)} 
        onSelectAction={executeCommand} 
      />
    </div>
  )
}