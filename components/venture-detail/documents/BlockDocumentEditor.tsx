'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  PushPin, Eye, Check, CircleNotch, Plus
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { DocumentBlockItem, BlockData } from './DocumentBlockItem'

interface Props {
  slug: string
  document: any
  isOwner: boolean
  onDocUpdated: (updated: any) => void
}

const CATEGORIES = ['General', 'Product', 'Technology', 'Research', 'Roadmap', 'Other']

export function BlockDocumentEditor({ slug, document: initialDoc, isOwner, onDocUpdated }: Props) {
  const [doc, setDoc] = useState(initialDoc)
  const [title, setTitle] = useState(initialDoc.title || '')
  const [icon, setIcon] = useState(initialDoc.icon || '📄')
  const [category, setCategory] = useState(initialDoc.category || 'General')
  const [visibility, setVisibility] = useState(initialDoc.visibility || 'venture_members')
  const [isPinned, setIsPinned] = useState(!!initialDoc.is_pinned)
  const [blocks, setBlocks] = useState<BlockData[]>(
    Array.isArray(initialDoc.content_blocks) && initialDoc.content_blocks.length > 0
      ? initialDoc.content_blocks
      : [{ id: 'blk_1', type: 'paragraph', content: '' }]
  )

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync state if initialDoc prop changes
  useEffect(() => {
    setDoc(initialDoc)
    setTitle(initialDoc.title || '')
    setIcon(initialDoc.icon || '📄')
    setCategory(initialDoc.category || 'General')
    setVisibility(initialDoc.visibility || 'venture_members')
    setIsPinned(!!initialDoc.is_pinned)
    if (Array.isArray(initialDoc.content_blocks) && initialDoc.content_blocks.length > 0) {
      setBlocks(initialDoc.content_blocks)
    }
  }, [initialDoc])

  // Save handler
  const saveDocument = useCallback(async (patchData?: Record<string, any>) => {
    if (!isOwner) return
    setSaving(true)

    const payload = {
      title,
      icon,
      category,
      visibility,
      is_pinned: isPinned,
      content_blocks: blocks,
      ...patchData,
    }

    try {
      const res = await fetch(`/api/ventures/${slug}/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Autosave failed')

      setLastSaved(new Date())
      onDocUpdated(json.document)
    } catch (e: any) {
      console.error('Doc save error:', e)
    } finally {
      setSaving(false)
    }
  }, [isOwner, title, icon, category, visibility, isPinned, blocks, slug, doc.id, onDocUpdated])

  // Trigger debounced autosave on block or header change
  const triggerAutosave = useCallback(() => {
    if (!isOwner) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      saveDocument()
    }, 1200)
  }, [isOwner, saveDocument])

  // Block modifications
  const handleUpdateBlock = (id: string, newContent: string, newType?: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: newContent, type: (newType || b.type) as any } : b))
    triggerAutosave()
  }

  const handleAddBlock = (afterId?: string, type: BlockData['type'] = 'paragraph') => {
    const newBlock: BlockData = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      content: ''
    }
    setBlocks(prev => {
      if (!afterId) return [...prev, newBlock]
      const idx = prev.findIndex(b => b.id === afterId)
      if (idx === -1) return [...prev, newBlock]
      const next = [...prev]
      next.splice(idx + 1, 0, newBlock)
      return next
    })
    triggerAutosave()
  }

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) return // Keep at least one block
    setBlocks(prev => prev.filter(b => b.id !== id))
    triggerAutosave()
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      
      {/* Editor Header Bar */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        
        <div className="flex items-center gap-3">
          {/* Icon Picker (simple emoji toggle) */}
          <button
            onClick={() => {
              const icons = ['📄', '📘', '🚀', '🔬', '⚙️', '💡', '🛡️', '📊']
              const nextIcon = icons[(icons.indexOf(icon) + 1) % icons.length]
              setIcon(nextIcon)
              triggerAutosave()
            }}
            disabled={!isOwner}
            className="text-xl p-1 rounded hover:bg-zinc-800 transition-colors"
            title="Click to change icon"
          >
            {icon}
          </button>

          {/* Category Dropdown */}
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); triggerAutosave(); }}
            disabled={!isOwner}
            className="bg-zinc-900 border border-zinc-800 text-[11.5px] font-semibold text-zinc-300 rounded px-2.5 py-1 focus:outline-none"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Visibility */}
          <select
            value={visibility}
            onChange={e => { setVisibility(e.target.value); triggerAutosave(); }}
            disabled={!isOwner}
            className="bg-zinc-900 border border-zinc-800 text-[11.5px] font-semibold text-zinc-300 rounded px-2.5 py-1 focus:outline-none"
          >
            <option value="public">Public</option>
            <option value="venture_members">Team Only</option>
            <option value="creator_only">Private</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-[11.5px] text-zinc-500">
          {saving ? (
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <CircleNotch size={11} className="animate-spin" /> Saving…
            </span>
          ) : lastSaved ? (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Check size={11} weight="bold" /> Saved
            </span>
          ) : null}

          {isOwner && (
            <button
              onClick={() => { setIsPinned(!isPinned); triggerAutosave(); }}
              className={
                'p-1.5 rounded border transition-colors ' +
                (isPinned ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'border-zinc-800 text-zinc-500 hover:text-white')
              }
              title={isPinned ? 'Unpin Document' : 'Pin Document'}
            >
              <PushPin size={13} weight={isPinned ? 'fill' : 'regular'} />
            </button>
          )}
        </div>

      </div>

      {/* Main Document Body Canvas */}
      <div className="max-w-3xl w-full mx-auto px-6 py-10 space-y-6">
        
        {/* Title Input */}
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); triggerAutosave(); }}
          readOnly={!isOwner}
          placeholder="Untitled Document"
          className="w-full bg-transparent text-[32px] font-bold text-white placeholder:text-zinc-700 focus:outline-none tracking-tight leading-tight"
        />

        {/* Block Stack */}
        <div className="space-y-2">
          {blocks.map((block) => (
            <DocumentBlockItem
              key={block.id}
              block={block}
              isOwner={isOwner}
              onUpdate={(content, type) => handleUpdateBlock(block.id, content, type)}
              onAddAfter={(type) => handleAddBlock(block.id, type)}
              onDelete={() => handleDeleteBlock(block.id)}
            />
          ))}
        </div>

        {/* Add Block Footer Button */}
        {isOwner && (
          <div className="pt-4 border-t border-zinc-800/60">
            <button
              onClick={() => handleAddBlock()}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500 hover:text-white transition-colors"
            >
              <Plus size={13} weight="bold" /> Add block or type /
            </button>
          </div>
        )}

      </div>

    </div>
  )
}