'use client'

import { useState, useRef } from 'react'
import { Plus, Trash, DotsSixVertical } from '@phosphor-icons/react'

export interface BlockData {
  id: string
  type: 'paragraph' | 'heading1' | 'heading2' | 'bullet' | 'callout' | 'quote' | 'code'
  content: string
}

interface Props {
  block: BlockData
  isOwner: boolean
  onUpdate: (content: string, type?: BlockData['type']) => void
  onAddAfter: (type?: BlockData['type']) => void
  onDelete: () => void
}

export function DocumentBlockItem({ block, isOwner, onUpdate, onAddAfter, onDelete }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onAddAfter('paragraph')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (val.startsWith('/')) {
      const command = val.substring(1).toLowerCase()
      if (command === 'h1') { onUpdate('', 'heading1'); return; }
      if (command === 'h2') { onUpdate('', 'heading2'); return; }
      if (command === 'bullet' || command === 'ul') { onUpdate('', 'bullet'); return; }
      if (command === 'callout') { onUpdate('', 'callout'); return; }
      if (command === 'quote') { onUpdate('', 'quote'); return; }
      if (command === 'code') { onUpdate('', 'code'); return; }
    }
    onUpdate(val)
  }

  return (
    <div className="group relative flex items-start gap-2 -ml-8">
      
      {/* Controls (Owner) */}
      {isOwner && (
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 mt-1 transition-opacity">
          <button
            onClick={() => onAddAfter()}
            className="w-5 h-5 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white"
            title="Add Block Below"
          >
            <Plus size={11} weight="bold" />
          </button>
          <button
            onClick={onDelete}
            className="w-5 h-5 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400"
            title="Delete Block"
          >
            <Trash size={11} />
          </button>
        </div>
      )}

      {/* Block Content Renderers */}
      <div className="flex-1 min-w-0">
        {block.type === 'heading1' && (
          <textarea
            ref={inputRef}
            value={block.content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            readOnly={!isOwner}
            placeholder="Heading 1"
            rows={1}
            className="w-full bg-transparent text-[22px] font-bold text-white placeholder:text-zinc-700 focus:outline-none resize-none leading-tight"
          />
        )}

        {block.type === 'heading2' && (
          <textarea
            ref={inputRef}
            value={block.content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            readOnly={!isOwner}
            placeholder="Heading 2"
            rows={1}
            className="w-full bg-transparent text-[18px] font-bold text-white placeholder:text-zinc-700 focus:outline-none resize-none leading-tight"
          />
        )}

        {block.type === 'paragraph' && (
          <textarea
            ref={inputRef}
            value={block.content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            readOnly={!isOwner}
            placeholder="Type text or press / for commands..."
            rows={1}
            className="w-full bg-transparent text-[14px] text-zinc-200 placeholder:text-zinc-700 focus:outline-none resize-none leading-relaxed"
          />
        )}

        {block.type === 'bullet' && (
          <div className="flex items-start gap-2">
            <span className="text-zinc-500 mt-1">•</span>
            <textarea
              ref={inputRef}
              value={block.content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              readOnly={!isOwner}
              placeholder="List item..."
              rows={1}
              className="w-full bg-transparent text-[14px] text-zinc-200 placeholder:text-zinc-700 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        )}

        {block.type === 'callout' && (
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-start gap-2.5">
            <span className="text-sm">💡</span>
            <textarea
              ref={inputRef}
              value={block.content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              readOnly={!isOwner}
              placeholder="Callout text..."
              rows={2}
              className="w-full bg-transparent text-[13.5px] text-zinc-200 placeholder:text-zinc-700 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        )}

        {block.type === 'quote' && (
          <div className="pl-3 border-l-2 border-zinc-700 italic">
            <textarea
              ref={inputRef}
              value={block.content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              readOnly={!isOwner}
              placeholder="Quote..."
              rows={2}
              className="w-full bg-transparent text-[14px] text-zinc-400 placeholder:text-zinc-700 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        )}

        {block.type === 'code' && (
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg font-mono">
            <textarea
              ref={inputRef}
              value={block.content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              readOnly={!isOwner}
              placeholder="// Code block"
              rows={3}
              className="w-full bg-transparent text-[12.5px] text-emerald-400 placeholder:text-zinc-700 focus:outline-none resize-none leading-normal font-mono"
            />
          </div>
        )}
      </div>

    </div>
  )
}