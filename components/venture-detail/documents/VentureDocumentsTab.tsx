'use client'

import { useState, useEffect, useCallback } from 'react'
import { CircleNotch, BookOpen, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { DocumentSidebar } from './DocumentSidebar'
import { BlockDocumentEditor } from './BlockDocumentEditor'

interface Props {
  slug: string
  isOwner: boolean
}

export function VentureDocumentsTab({ slug, isOwner }: Props) {
  const [documents, setDocuments] = useState<any[]>([])
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [activeDoc, setActiveDoc] = useState<any | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Load document list
  const loadDocuments = useCallback(async () => {
    setLoadingList(true)
    try {
      let url = `/api/ventures/${slug}/documents`
      if (selectedCategory !== 'all') url += `?category=${selectedCategory}`
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load documents')
      
      const docs = json.documents || []
      setDocuments(docs)

      // Auto-select first document if none selected
      if (!activeDocId && docs.length > 0) {
        setActiveDocId(docs[0].id)
      }
    } catch (e: any) {
      toast.error(e.message || 'Could not load documents')
    } finally {
      setLoadingList(false)
    }
  }, [slug, selectedCategory, activeDocId])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  // Load single active document details
  const loadSingleDoc = useCallback(async (docId: string) => {
    setLoadingDoc(true)
    try {
      const res = await fetch(`/api/ventures/${slug}/documents/${docId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load document')
      setActiveDoc(json.document)
    } catch (e: any) {
      toast.error(e.message || 'Could not load document details')
      setActiveDoc(null)
    } finally {
      setLoadingDoc(false)
    }
  }, [slug])

  useEffect(() => {
    if (activeDocId) loadSingleDoc(activeDocId)
    else setActiveDoc(null)
  }, [activeDocId, loadSingleDoc])

  // Create new document
  const handleCreateDocument = async (category = 'General') => {
    try {
      const res = await fetch(`/api/ventures/${slug}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled document',
          category,
          icon: '📄',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create document')

      toast.success('New document created')
      await loadDocuments()
      setActiveDocId(json.document.id)
    } catch (e: any) {
      toast.error(e.message || 'Could not create document')
    }
  }

  // Delete document
  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      const res = await fetch(`/api/ventures/${slug}/documents/${docId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')

      toast.success('Document deleted')
      if (activeDocId === docId) {
        setActiveDocId(null)
        setActiveDoc(null)
      }
      loadDocuments()
    } catch {
      toast.error('Could not delete document')
    }
  }

  return (
    <div className="bg-[#121215] border border-white/[0.06] rounded-2xl overflow-hidden min-h-[650px] grid grid-cols-1 lg:grid-cols-[280px_1fr]">
      
      {/* LEFT: Sidebar Navigation & Tree */}
      <DocumentSidebar
        documents={documents}
        activeDocId={activeDocId}
        loading={loadingList}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onSelectDoc={setActiveDocId}
        onCreateDoc={handleCreateDocument}
        onDeleteDoc={handleDeleteDocument}
        isOwner={isOwner}
      />

      {/* RIGHT: Document Workspace Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#09090b]">
        {loadingDoc ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs gap-2">
            <CircleNotch size={18} className="animate-spin" /> Loading workspace…
          </div>
        ) : activeDoc ? (
          <BlockDocumentEditor
            key={activeDoc.id}
            slug={slug}
            document={activeDoc}
            isOwner={isOwner}
            onDocUpdated={(updated) => {
              setActiveDoc(updated)
              setDocuments(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d))
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-400">
              <BookOpen size={24} />
            </div>
            <h3 className="text-[15px] font-bold text-white mb-1">No Document Selected</h3>
            <p className="text-[12.5px] text-zinc-400 max-w-sm mb-6">
              Select a document from the sidebar to view or edit knowledge base articles.
            </p>
            {isOwner && (
              <button
                onClick={() => handleCreateDocument()}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white text-black font-bold text-[12.5px] hover:bg-zinc-200 transition-colors shadow"
              >
                <Plus size={13} weight="bold" /> Create New Document
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  )
}