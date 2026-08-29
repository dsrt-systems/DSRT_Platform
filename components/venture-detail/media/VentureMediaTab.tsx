'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Image as ImageIcon, VideoCamera, FileText, Star, Plus,
  CircleNotch, Eye, PencilSimple, Play, Trash
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { MediaUploadStudioModal } from './MediaUploadStudioModal'
import { MediaEditorModal } from './MediaEditorModal'

interface Props {
  slug: string
  isOwner: boolean
}

type TabType = 'all' | 'image' | 'video' | 'featured'

export function VentureMediaTab({ slug, isOwner }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any | null>(null)
  const [previewAsset, setPreviewAsset] = useState<any | null>(null)

  const loadMedia = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/api/ventures/${slug}/media`
      const params = new URLSearchParams()
      if (activeTab === 'featured') params.set('featured', '1')
      else if (activeTab !== 'all') params.set('type', activeTab)

      if (params.toString()) url += `?${params.toString()}`

      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load media')
      setItems(json.media || [])
    } catch (e: any) {
      toast.error(e.message || 'Could not load media library')
    } finally {
      setLoading(false)
    }
  }, [slug, activeTab])

  useEffect(() => { loadMedia() }, [loadMedia])

  const toggleFeatured = async (asset: any, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/ventures/${slug}/media/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !asset.featured })
      })
      if (!res.ok) throw new Error()
      toast.success(asset.featured ? 'Unfeatured' : 'Added to featured')
      loadMedia()
    } catch {
      toast.error('Failed to update featured status')
    }
  }

  const handleDelete = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Move this item to trash?')) return
    try {
      const res = await fetch(`/api/ventures/${slug}/media/${assetId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Media removed')
      loadMedia()
    } catch {
      toast.error('Failed to delete media')
    }
  }

  return (
    <div className="space-y-6">

      {/* Top Bar */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[20px] font-bold text-white">Media Library</h2>
          <p className="text-[12.5px] text-white/50 mt-0.5">
            Photos, pitch videos, and brand assets for this venture
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white text-black font-bold text-[12.5px] hover:bg-zinc-100 transition-colors shadow-md"
            >
              <Plus size={14} weight="bold" /> Add Media
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] pb-3 overflow-x-auto scrollbar-hide">
        {[
          { id: 'all', label: 'All Media', icon: ImageIcon },
          { id: 'image', label: 'Images', icon: ImageIcon },
          { id: 'video', label: 'Videos', icon: VideoCamera },
          { id: 'featured', label: 'Featured', icon: Star },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={
                'flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 h-8 rounded-lg transition-colors whitespace-nowrap ' +
                (active
                  ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]')
              }
            >
              <Icon size={14} weight={active ? 'fill' : 'regular'} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="h-64 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/50 text-xs">
          <CircleNotch size={18} className="animate-spin mr-2" /> Loading media library…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-16 text-center">
          <ImageIcon size={32} className="text-white/20 mx-auto mb-3" />
          <h3 className="text-[15px] font-bold text-white mb-1">No media assets found</h3>
          <p className="text-[12.5px] text-white/45 max-w-sm mx-auto mb-6">
            {isOwner
              ? 'Upload product screenshots, team photos, or pitch videos.'
              : 'This venture has not published media assets yet.'}
          </p>
          {isOwner && (
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white text-black text-[12.5px] font-bold"
            >
              <Plus size={13} weight="bold" /> Upload first asset
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setPreviewAsset(asset)}
              className="group relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.08] hover:border-white/[0.2] transition-all cursor-pointer"
            >
              {asset.media_type === 'image' ? (
                <img
                  src={asset.asset_url}
                  alt={asset.alt_text || asset.title || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : asset.media_type === 'video' ? (
                <div className="w-full h-full relative flex items-center justify-center bg-zinc-950">
                  <video src={asset.asset_url} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute w-10 h-10 rounded-full bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-white">
                    <Play size={16} weight="fill" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-900">
                  <FileText size={24} className="text-white/40 mb-1" />
                  <span className="text-[11px] font-semibold text-white/70 truncate w-full">{asset.title}</span>
                </div>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                {asset.featured && (
                  <span className="p-1 rounded bg-amber-500/80 text-black shadow" title="Featured">
                    <Star size={10} weight="fill" />
                  </span>
                )}
              </div>

              {/* Hover Actions (Owner) */}
              {isOwner && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 z-20">
                  <button
                    onClick={(e) => toggleFeatured(asset, e)}
                    className={
                      'p-2 rounded-lg border text-white transition-colors ' +
                      (asset.featured ? 'bg-amber-500/30 border-amber-400 text-amber-300' : 'bg-black/60 border-white/20 hover:bg-black')
                    }
                    title={asset.featured ? 'Unfeature' : 'Feature'}
                  >
                    <Star size={14} weight={asset.featured ? 'fill' : 'regular'} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingAsset(asset); }}
                    className="p-2 rounded-lg bg-black/60 border border-white/20 hover:bg-black text-white transition-colors"
                    title="Edit metadata / crop"
                  >
                    <PencilSimple size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(asset.id, e)}
                    className="p-2 rounded-lg bg-black/60 border border-white/20 hover:bg-red-500/40 text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <MediaUploadStudioModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        slug={slug}
        onSuccess={loadMedia}
      />

      {editingAsset && (
        <MediaEditorModal
          open={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          slug={slug}
          asset={editingAsset}
          onSuccess={loadMedia}
        />
      )}

      {/* Lightbox Preview */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewAsset(null)}
        >
          <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {previewAsset.media_type === 'image' ? (
              <img src={previewAsset.asset_url} alt="" className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl" />
            ) : previewAsset.media_type === 'video' ? (
              <video src={previewAsset.asset_url} controls autoPlay className="max-w-full max-h-[75vh] rounded-xl shadow-2xl" />
            ) : (
              <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
                <p className="text-white font-bold mb-2">{previewAsset.title}</p>
                <a href={previewAsset.asset_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                  Download / View file →
                </a>
              </div>
            )}
            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-white">{previewAsset.title}</p>
              {previewAsset.description && <p className="text-xs text-zinc-400 mt-1 max-w-lg">{previewAsset.description}</p>}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}