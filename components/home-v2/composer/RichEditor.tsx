'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useComposer } from './ComposerContext'
import {
  TextB, TextItalic, TextUnderline, TextStrikethrough,
  TextHOne, TextHTwo, TextHThree,
  ListBullets, ListNumbers, ListChecks,
  Quotes, Code, Minus, LinkSimple, TextT,
} from '@phosphor-icons/react'

export function RichEditor() {
  const composer = useComposer()
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && !editorRef.current.textContent && composer.content) {
      editorRef.current.innerHTML = composer.content
    }
  }, [])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      composer.setContent(editorRef.current.textContent || '')
    }
  }, [composer])

  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
    handleInput()
  }, [handleInput])

  const insertHeading = useCallback((level: string) => {
    editorRef.current?.focus()
    document.execCommand('formatBlock', false, level)
    handleInput()
  }, [handleInput])

  const insertLink = useCallback(() => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editorRef.current?.focus()
      document.execCommand('createLink', false, url)
      handleInput()
    }
  }, [handleInput])

  const placeholder = getPlaceholder(composer.postType)

  return (
    <div className="space-y-0">
      {/* ═══ FIXED TOOLBAR ═══ */}
      <div className={
        'flex items-center gap-0.5 px-2 py-1.5 rounded-t-lg border border-b-0 border-zinc-800 ' +
        'bg-zinc-950/80 overflow-x-auto scrollbar-hide flex-wrap'
      }>
        {/* Text style group */}
        <ToolbarGroup>
          <ToolBtn Icon={TextT} label="Normal text" onClick={() => insertHeading('p')} />
          <ToolBtn Icon={TextHOne} label="Heading 1" onClick={() => insertHeading('h1')} />
          <ToolBtn Icon={TextHTwo} label="Heading 2" onClick={() => insertHeading('h2')} />
          <ToolBtn Icon={TextHThree} label="Heading 3" onClick={() => insertHeading('h3')} />
        </ToolbarGroup>

        <Divider />

        {/* Format group */}
        <ToolbarGroup>
          <ToolBtn Icon={TextB} label="Bold (Ctrl+B)" onClick={() => exec('bold')} />
          <ToolBtn Icon={TextItalic} label="Italic (Ctrl+I)" onClick={() => exec('italic')} />
          <ToolBtn Icon={TextUnderline} label="Underline (Ctrl+U)" onClick={() => exec('underline')} />
          <ToolBtn Icon={TextStrikethrough} label="Strikethrough" onClick={() => exec('strikeThrough')} />
        </ToolbarGroup>

        <Divider />

        {/* List group */}
        <ToolbarGroup>
          <ToolBtn Icon={ListBullets} label="Bullet list" onClick={() => exec('insertUnorderedList')} />
          <ToolBtn Icon={ListNumbers} label="Numbered list" onClick={() => exec('insertOrderedList')} />
        </ToolbarGroup>

        <Divider />

        {/* Block group */}
        <ToolbarGroup>
          <ToolBtn Icon={Quotes} label="Quote" onClick={() => insertHeading('blockquote')} />
          <ToolBtn Icon={Code} label="Code" onClick={() => insertHeading('pre')} />
          <ToolBtn Icon={Minus} label="Divider" onClick={() => exec('insertHorizontalRule')} />
          <ToolBtn Icon={LinkSimple} label="Link (Ctrl+K)" onClick={insertLink} />
        </ToolbarGroup>
      </div>

      {/* ═══ TITLE (optional) ═══ */}
      {['article', 'milestone', 'launch', 'looking_for', 'discussion'].includes(composer.postType) && (
        <input
          type="text"
          value={composer.title}
          onChange={(e) => composer.setTitle(e.target.value)}
          placeholder="Add a title (optional)"
          maxLength={200}
          data-field="title"
          className="w-full bg-zinc-950/60 border border-b-0 border-zinc-800 px-4 py-3 text-[18px] font-bold text-white placeholder:text-zinc-700 focus:outline-none"
        />
      )}

      {/* ═══ EDITOR ═══ */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); exec('bold') }
          if ((e.metaKey || e.ctrlKey) && e.key === 'i') { e.preventDefault(); exec('italic') }
          if ((e.metaKey || e.ctrlKey) && e.key === 'u') { e.preventDefault(); exec('underline') }
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); insertLink() }
        }}
        data-placeholder={placeholder}
        className={
          'w-full min-h-[180px] max-h-[420px] overflow-y-auto ' +
          'px-4 py-4 ' +
          'border border-zinc-800 rounded-b-lg ' +
          'bg-zinc-950/40 ' +
          'text-[15px] text-zinc-100 leading-[1.7] ' +
          'focus:outline-none focus:border-zinc-700 transition-colors ' +
          'prose prose-invert prose-sm max-w-none ' +
          '[&_h1]:text-[24px] [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 ' +
          '[&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 ' +
          '[&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 ' +
          '[&_blockquote]:border-l-2 [&_blockquote]:border-zinc-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-400 [&_blockquote]:my-2 ' +
          '[&_pre]:bg-zinc-950 [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:text-[13px] [&_pre]:font-mono [&_pre]:text-emerald-400 [&_pre]:my-2 ' +
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 ' +
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 ' +
          '[&_a]:text-blue-400 [&_a]:underline ' +
          '[&_hr]:border-zinc-700 [&_hr]:my-3'
        }
      />
    </div>
  )
}

function getPlaceholder(type: string): string {
  const map: Record<string, string> = {
    update: "What's happening in DSRT?",
    idea: "Share an idea you've been thinking about...",
    build_log: 'What did you ship today? What did you learn?',
    milestone: 'What did you just achieve? Tell the community.',
    launch: 'What did you just launch? Drop the link.',
    looking_for: 'Who or what are you looking for? Be specific.',
    discussion: 'Start a discussion. Ask a question. Share an opinion.',
    poll: 'Ask your question here...',
    event: 'Describe the event...',
  }
  return map[type] || map.update
}

// ─── Toolbar sub-components ───

function ToolBtn({ Icon, label, onClick }: { Icon: any; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={label}
      className={
        'w-7 h-7 rounded flex items-center justify-center ' +
        'text-zinc-400 hover:text-white hover:bg-zinc-800 ' +
        'transition-colors'
      }
    >
      <Icon size={13} weight="regular" />
    </button>
  )
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0">{children}</div>
}

function Divider() {
  return <div className="w-px h-5 bg-zinc-800 mx-1.5 shrink-0" />
}