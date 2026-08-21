'use client'

import { useRef, useEffect, useState } from 'react'
import {
  TextB, TextItalic, TextUnderline, TextStrikethrough,
  ListBullets, ListNumbers, Quotes, Code, Link as LinkIcon,
  TextAlignLeft, TextAlignCenter, TextAlignRight,
  ArrowUUpLeft, ArrowUUpRight
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichEditor({ 
  value, 
  onChange, 
  placeholder = "Write your message...", 
  minHeight = '280px' 
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showPlaceholder, setShowPlaceholder] = useState(!value)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
      setShowPlaceholder(!value)
    }
  }, [value])

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg)
    editorRef.current?.focus()
    handleInput()
  }

  const handleInput = () => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    const isEmpty = !html || html === '<br>' || html === '<div><br></div>' || html === '<p></p>'
    setShowPlaceholder(isEmpty)
    onChange(isEmpty ? '' : html)
  }

  const handleLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) exec('createLink', url)
  }

  const ToolbarBtn = ({ 
    onClick, icon: Icon, title 
  }: { 
    onClick: () => void
    icon: any
    title: string 
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-md hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center transition-colors"
    >
      <Icon className="w-3.5 h-3.5" weight="bold" />
    </button>
  )

  const Divider = () => <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-white/[0.05] bg-white/[0.01] flex-wrap flex-shrink-0">
        <ToolbarBtn onClick={() => exec('undo')} icon={ArrowUUpLeft} title="Undo (⌘Z)" />
        <ToolbarBtn onClick={() => exec('redo')} icon={ArrowUUpRight} title="Redo (⌘⇧Z)" />
        <Divider />
        <select
          onChange={(e) => { exec('formatBlock', e.target.value); e.target.value = '' }}
          className="h-7 px-2 bg-transparent hover:bg-white/[0.06] rounded-md text-[11.5px] text-white/70 font-semibold border-none focus:outline-none cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>Format</option>
          <option value="p" className="bg-[#141419]">Paragraph</option>
          <option value="h1" className="bg-[#141419]">Heading 1</option>
          <option value="h2" className="bg-[#141419]">Heading 2</option>
          <option value="h3" className="bg-[#141419]">Heading 3</option>
        </select>
        <Divider />
        <ToolbarBtn onClick={() => exec('bold')} icon={TextB} title="Bold (⌘B)" />
        <ToolbarBtn onClick={() => exec('italic')} icon={TextItalic} title="Italic (⌘I)" />
        <ToolbarBtn onClick={() => exec('underline')} icon={TextUnderline} title="Underline (⌘U)" />
        <ToolbarBtn onClick={() => exec('strikeThrough')} icon={TextStrikethrough} title="Strikethrough" />
        <Divider />
        <ToolbarBtn onClick={() => exec('insertUnorderedList')} icon={ListBullets} title="Bullet list" />
        <ToolbarBtn onClick={() => exec('insertOrderedList')} icon={ListNumbers} title="Numbered list" />
        <ToolbarBtn onClick={() => exec('formatBlock', 'blockquote')} icon={Quotes} title="Quote" />
        <ToolbarBtn onClick={() => exec('formatBlock', 'pre')} icon={Code} title="Code block" />
        <Divider />
        <ToolbarBtn onClick={handleLink} icon={LinkIcon} title="Insert link (⌘K)" />
        <Divider />
        <ToolbarBtn onClick={() => exec('justifyLeft')} icon={TextAlignLeft} title="Align left" />
        <ToolbarBtn onClick={() => exec('justifyCenter')} icon={TextAlignCenter} title="Align center" />
        <ToolbarBtn onClick={() => exec('justifyRight')} icon={TextAlignRight} title="Align right" />
      </div>

      {/* Editor — LARGE BODY */}
      <div className="relative flex-1 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          suppressContentEditableWarning
          className={cn(
            "w-full px-5 py-4 text-[14px] text-white/90 leading-relaxed focus:outline-none",
            "prose prose-invert prose-sm max-w-none",
            "prose-headings:tracking-tight prose-headings:font-bold",
            "prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline",
            "prose-blockquote:border-l-white/20 prose-blockquote:text-white/70 prose-blockquote:not-italic",
            "prose-code:text-violet-300 prose-code:bg-white/[0.05] prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
            "prose-strong:text-white prose-strong:font-bold",
            "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5"
          )}
          style={{ minHeight }}
        />
        {showPlaceholder && (
          <div className="absolute top-4 left-5 text-[14px] text-white/25 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}