'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EditorTopBar } from './EditorTopBar'
import { EditorTabs, type EditorTab } from './EditorTabs'
import { TemplateEditor } from './TemplateEditor'
import { MediaPanel } from './MediaPanel'
import { ConfigurationPanel } from './ConfigurationPanel'
import { PosterAboutPanel } from './PosterAboutPanel'
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel'
import { PreviewModal } from './PreviewModal'
import { PublishValidator } from './PublishValidator'
import { useDraft } from './hooks/useDraft'
import { useAutosave } from './hooks/useAutosave'

export function CreateOpportunityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [tab, setTab] = useState<EditorTab>('opportunity')
  const [showPreview, setShowPreview] = useState(false)
  const [showValidator, setShowValidator] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const { draft, loading, updateDraft, resetDraft } = useDraft(editId)
  const { saveStatus, lastSavedAt } = useAutosave(draft)

  const handlePublish = async () => {
    if (!draft?.id) return
    setPublishing(true)
    try {
      const res = await fetch('/api/opportunities/' + draft.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to publish')

      // Navigate to detail page
      router.push('/looking-for/' + (json.opportunity?.slug || draft.id))
    } catch (e: any) {
      alert(e?.message || 'Failed to publish')
    } finally {
      setPublishing(false)
      setShowValidator(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[13px] text-zinc-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col">
      {/* Sticky top bar */}
      <EditorTopBar
        draft={draft}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onUpdate={updateDraft}
        onPreview={() => setShowPreview(true)}
        onPublish={() => setShowValidator(true)}
        onBack={() => router.push('/looking-for')}
      />

      {/* Tabs */}
      <div className="border-b border-zinc-800 bg-[#0a0a0a] sticky top-[64px] z-20">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
          <EditorTabs active={tab} onChange={setTab} />
        </div>
      </div>

      {/* Main workspace */}
      <main className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
          {tab === 'opportunity' && (
            <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_320px] gap-6">
              {/* Left: Media */}
              <aside className="order-3 lg:order-1">
                <MediaPanel
                  draft={draft}
                  onUpdate={updateDraft}
                />
              </aside>

              {/* Center: Editor */}
              <div className="min-w-0 order-1 lg:order-2">
                <TemplateEditor
                  draft={draft}
                  onUpdate={updateDraft}
                />
              </div>

              {/* Right: Configuration */}
              <aside className="order-2 lg:order-3">
                <ConfigurationPanel
                  draft={draft}
                  onUpdate={updateDraft}
                />
              </aside>
            </div>
          )}

          {tab === 'poster' && (
            <div className="max-w-3xl mx-auto">
              <PosterAboutPanel
                draft={draft}
                onUpdate={updateDraft}
              />
            </div>
          )}

          {tab === 'settings' && (
            <div className="max-w-3xl mx-auto">
              <AdvancedSettingsPanel
                draft={draft}
                onUpdate={updateDraft}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showPreview && draft && (
        <PreviewModal
          draft={draft}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showValidator && draft && (
        <PublishValidator
          draft={draft}
          publishing={publishing}
          onPublish={handlePublish}
          onClose={() => setShowValidator(false)}
          onGoToField={(field) => {
            setShowValidator(false)
            // Scroll to field
            const el = document.querySelector(`[data-field="${field}"]`) as HTMLElement
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              setTimeout(() => el.focus?.(), 400)
            }
          }}
        />
      )}
    </div>
  )
}