'use client'

import { useState, useEffect, useRef } from 'react'
import { useStudio } from '../../StudioContext'
import { TextB, TextItalic, ListBullets, ListNumbers } from '@phosphor-icons/react'

export function StudioRichEditor() {
  const { draft, updateField } = useStudio()
  
  // Initialize local state with DB value ONCE
  const [text, setText] = useState(
    draft.opportunity.content_text || draft.opportunity.description || ''
  )
  
  // Track if we've seeded the editor so we don't accidentally overwrite typing
  const seeded = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!seeded.current) {
      const initialValue = draft.opportunity.content_text || draft.opportunity.description || ''
      if (initialValue) {
        setText(initialValue)
      }
      seeded.current = true
    }
  }, [draft.opportunity.content_text, draft.opportunity.description])

  const handleChange = (val: string) => {
    setText(val)
    // Send state to context (which debounces the API save automatically)
    updateField({ content_text: val, description: val.substring(0, 300) })
  }

  // Handle advanced Markdown insertions correctly by preserving cursor position
  const insertText = (before: string, after: string = '') => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selectedText = text.substring(start, end)
    
    // For bullets/lists: if they click bullet on an empty line, just add the dash
    // If they highlight text, wrap/prefix it.
    let newText = ''
    let newCursorPos = 0

    if (before === '- ' || before === '1. ') {
      // List handling: prefix each selected line, or just insert at cursor
      if (selectedText.length > 0) {
        const lines = selectedText.split('\n')
        const bulleted = lines.map((line: string) => `${before}${line}`).join('\n')
        newText = text.substring(0, start) + bulleted + text.substring(end)
        newCursorPos = start + bulleted.length
      } else {
        // Find if we are at start of line
        const textBeforeCursor = text.substring(0, start)
        const isStartOfLine = start === 0 || textBeforeCursor.endsWith('\n')
        
        const insertion = isStartOfLine ? before : `\n${before}`
        newText = text.substring(0, start) + insertion + text.substring(end)
        newCursorPos = start + insertion.length
      }
    } else {
      // Standard wrap (bold, italic)
      newText = text.substring(0, start) + before + selectedText + after + text.substring(end)
      newCursorPos = start + before.length + selectedText.length
    }

    setText(newText)
    updateField({ content_text: newText, description: newText.substring(0, 300) })
    
    // Restore focus and cursor position after React re-renders
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Support typical editor keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      insertText('**', '**')
    }
    if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      insertText('*', '*')
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0c0c0e] overflow-hidden focus-within:border-zinc-600 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800/80 bg-zinc-950/50">
        <ToolBtn icon={TextB} title="Bold (Cmd+B)" onClick={() => insertText('**', '**')} />
        <ToolBtn icon={TextItalic} title="Italic (Cmd+I)" onClick={() => insertText('*', '*')} />
        <div className="w-px h-4 bg-zinc-800 mx-1" />
        <ToolBtn icon={ListBullets} title="Bullet List" onClick={() => insertText('- ')} />
        <ToolBtn icon={ListNumbers} title="Numbered List" onClick={() => insertText('1. ')} />
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the opportunity in detail. What will they do? What is the goal?..."
        className="w-full min-h-[300px] p-5 bg-transparent text-[14px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-y leading-relaxed"
      />
    </div>
  )
}

function ToolBtn({
  icon: Icon,
  title,
  onClick,
}: {
  icon: any
  title?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
    >
      <Icon size={14} weight="bold" />
    </button>
  )
}