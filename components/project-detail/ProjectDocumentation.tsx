'use client'

import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BookOpen, Plus, PencilSimple, Trash, Check, X, List, EyeSlash, Eye } from '@phosphor-icons/react'
import { MarkdownEditor } from './MarkdownEditor'

interface DocSection {
  id: string
  title: string
  content: string
  position: number
  is_published: boolean
  updated_at: string
}

interface Props {
  slug: string
  project: any
  isOwner: boolean
}

export function ProjectDocumentation({ slug, project, isOwner }: Props) {
  const [sections, setSections] = useState<DocSection[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/projects/' + slug + '/documentation')
      const json = await res.json()
      const list: DocSection[] = json.sections || []
      setSections(list)
      if (list.length > 0 && !activeSectionId) setActiveSectionId(list[0].id)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [slug, activeSectionId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const activeSection = sections.find(s => s.id === activeSectionId) || null

  const createSection = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/projects/' + slug + '/documentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New section', content: '' }),
      })
      const json = await res.json()
      if (res.ok) {
        await fetchDocs()
        setActiveSectionId(json.section.id)
        setDraftTitle(json.section.title)
        setDraftContent(json.section.content)
        setEditing(true)
      }
    } finally { setSaving(false) }
  }

  const startEdit = () => {
    if (!activeSection) return
    setDraftTitle(activeSection.title)
    setDraftContent(activeSection.content)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setDraftTitle('')
    setDraftContent('')
  }

  const saveSection = async () => {
    if (!activeSection) return
    setSaving(true)
    try {
      const res = await fetch('/api/projects/' + slug + '/documentation/' + activeSection.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draftTitle.trim() || 'Untitled',
          content: draftContent,
        }),
      })
      if (res.ok) {
        await fetchDocs()
        setEditing(false)
      }
    } finally { setSaving(false) }
  }

  const togglePublish = async () => {
    if (!activeSection) return
    try {
      await fetch('/api/projects/' + slug + '/documentation/' + activeSection.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !activeSection.is_published }),
      })
      await fetchDocs()
    } catch (e) { console.error(e) }
  }

  const deleteSection = async () => {
    if (!activeSection) return
    if (!confirm('Delete "' + activeSection.title + '"?')) return
    try {
      await fetch('/api/projects/' + slug + '/documentation/' + activeSection.id, { method: 'DELETE' })
      const idx = sections.findIndex(s => s.id === activeSection.id)
      const next = sections[idx + 1] || sections[idx - 1]
      setActiveSectionId(next?.id || null)
      await fetchDocs()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-[18px] font-semibold text-white flex items-center gap-2">
            <BookOpen size={17} /> Documentation
          </h2>
          <p className="text-[12px] text-white/45 mt-0.5">Technical guides, API references, tutorials</p>
        </div>
        {isOwner && (
          <button
            onClick={createSection}
            disabled={saving}
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-white text-black hover:bg-white/90 px-3.5 h-8 rounded-md disabled:opacity-50"
          >
            <Plus size={12} weight="bold" /> New section
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-10 text-center text-[13px] text-white/45">Loading...</div>
      ) : sections.length === 0 ? (
        <div className="p-16 text-center">
          <BookOpen size={36} className="mx-auto mb-4 text-white/20" />
          <p className="text-[14px] text-white/50 mb-1">No documentation yet</p>
          <p className="text-[12px] text-white/30 mb-4">
            {isOwner ? 'Start documenting your project for others.' : 'This project has no documentation.'}
          </p>
          {isOwner && (
            <button
              onClick={createSection}
              className="text-[13px] font-medium text-white/85 hover:text-white underline underline-offset-2"
            >
              + Create first section
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[220px_1fr] min-h-[500px]">
          {/* Sidebar list */}
          <div className="border-r border-white/[0.06] py-2">
            <div className="px-4 py-2 flex items-center gap-1.5 text-[11px] text-white/40 uppercase tracking-wider font-semibold">
              <List size={11} /> Sections
            </div>
            <div className="space-y-0.5">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSectionId(s.id); setEditing(false) }}
                  className={
                    'w-full text-left px-4 py-2 text-[13px] transition-colors flex items-center justify-between gap-2 ' +
                    (activeSectionId === s.id
                      ? 'bg-white/[0.06] text-white border-l-2 border-white'
                      : 'text-white/60 hover:bg-white/[0.03] hover:text-white border-l-2 border-transparent')
                  }
                >
                  <span className="truncate">{s.title}</span>
                  {!s.is_published && <EyeSlash size={10} className="text-white/30 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="p-6">
            {activeSection ? (
              editing ? (
                <>
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value.slice(0, 200))}
                    placeholder="Section title"
                    className="w-full text-[22px] font-bold text-white bg-transparent border-b border-white/[0.1] outline-none focus:border-white/30 pb-2 mb-4"
                  />
                  <MarkdownEditor
                    value={draftContent}
                    onChange={setDraftContent}
                    placeholder="Write your documentation. Use headings, code blocks, lists..."
                    minHeight={400}
                    maxLength={100000}
                  />
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="px-4 h-9 text-[13px] text-white/70 hover:text-white border border-white/[0.1] rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveSection}
                      disabled={saving}
                      className="px-5 h-9 text-[13px] font-semibold bg-white text-black hover:bg-white/90 rounded-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : (<><Check size={13} weight="bold" /> Save</>)}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-white/[0.06]">
                    <div className="min-w-0">
                      <h1 className="text-[22px] font-bold text-white leading-tight">{activeSection.title}</h1>
                      <p className="text-[12px] text-white/40 mt-1">
                        Updated {new Date(activeSection.updated_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {!activeSection.is_published && <span className="ml-2 text-yellow-400/80">· Draft</span>}
                      </p>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={togglePublish}
                          className="w-8 h-8 rounded-md hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center"
                          title={activeSection.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {activeSection.is_published ? <Eye size={14} /> : <EyeSlash size={14} />}
                        </button>
                        <button
                          onClick={startEdit}
                          className="flex items-center gap-1.5 text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] px-3 h-8 rounded-md"
                        >
                          <PencilSimple size={12} /> Edit
                        </button>
                        <button
                          onClick={deleteSection}
                          className="w-8 h-8 rounded-md hover:bg-red-500/10 text-white/50 hover:text-red-400 flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {activeSection.content ? (
                    <div className="prose prose-invert prose-sm max-w-none text-[14px] text-white/85 leading-relaxed prose-headings:text-white prose-headings:font-semibold prose-a:text-purple-300 prose-strong:text-white prose-code:text-purple-200 prose-code:bg-white/[0.06] prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/[0.08]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSection.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-[14px] text-white/45 mb-2">This section is empty</p>
                      {isOwner && (
                        <button
                          onClick={startEdit}
                          className="text-[13px] font-medium text-white/85 hover:text-white underline underline-offset-2"
                        >
                          Add content
                        </button>
                      )}
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="py-10 text-center text-[14px] text-white/45">Select a section</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
