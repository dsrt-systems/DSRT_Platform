'use client'

import { useState, useEffect } from 'react'
import { useStudio } from '../../StudioContext'
import { TextB, TextItalic, ListBullets, ListNumbers } from '@phosphor-icons/react'

export function StudioRichEditor() {
  const { draft, updateField } = useStudio()
  const [text, setText] = useState(
    draft.opportunity.content_text || draft.opportunity.description || ''
  )

  useEffect(() => {
    setText(draft.opportunity.content_text || draft.opportunity.description || '')
  }, [draft.opportunity.content_text, draft.opportunity.description])

  const handleChange = (val: string) => {
    setText(val)
    updateField({ content_text: val, description: val.substring(0, 300) })
  }

  const insertText = (before: string, after: string = '') => {
    const el = document.getElementById('studio-editor') as HTMLTextAreaElement
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selectedText = text.substring(start, end)
    const newText =
      text.substring(0, start) + before + selectedText + after + text.substring(end)
    handleChange(newText)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0c0c0e] overflow-hidden focus-within:border-zinc-600 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800/80 bg-zinc-950/50">
        <ToolBtn icon={TextB} onClick={() => insertText('**', '**')} />
        <ToolBtn icon={TextItalic} onClick={() => insertText('*', '*')} />
        <div className="w-px h-4 bg-zinc-800 mx-1" />
        <ToolBtn icon={ListBullets} onClick={() => insertText('- ')} />
        <ToolBtn icon={ListNumbers} onClick={() => insertText('1. ')} />
      </div>
      <textarea
        id="studio-editor"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Describe the opportunity in detail. What will they do? What is the goal?..."
        className="w-full min-h-[300px] p-5 bg-transparent text-[14px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-y leading-relaxed"
      />
    </div>
  )
}

function ToolBtn({
  icon: Icon,
  onClick,
}: {
  icon: any
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
    >
      <Icon size={14} weight="bold" />
    </button>
  )
}