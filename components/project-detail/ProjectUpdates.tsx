'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Heart, ChatCircle, BookmarkSimple, ShareNetwork, Plus, PushPin, PushPinSlash,
  DotsThree, Trash, PencilSimple, Certificate, PaperPlaneRight, Flag,
  LinkSimple, Paperclip, Rocket, Hammer, TestTube, ChartLineUp, Bug,
  Megaphone, Handshake, Lightbulb, Circle, ChatCircleDots, ArrowSquareOut,
  Prohibit, Play
} from '@phosphor-icons/react'
import { ProjectUpdateComposer } from './ProjectUpdateComposer'
import { MediaLightbox } from './MediaLightbox'

interface Update {
  id: string
  content: string
  title: string | null
  update_type: string
  media_urls: string[]
  image_urls: string[]
  attachments: any[]
  tags: string[]
  like_count: number
  comment_count: number
  bookmark_count: number
  is_pinned: boolean
  pinned_at: string | null
  comments_disabled: boolean
  milestone_from: string | null
  milestone_to: string | null
  resource_url: string | null
  resource_label: string | null
  created_at: string
  edited_at: string | null
  user_id: string
  author_role?: string
  user_liked?: boolean
  user_bookmarked?: boolean
  user: {
    id: string
    full_name: string
    username: string
    avatar_url: string | null
    is_verified: boolean
  }
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  user: {
    id: string
    full_name: string
    username: string
    avatar_url: string | null
    is_verified: boolean
  }
}

interface Props {
  slug: string
  projectId: string
  projectStage: string
  isOwner: boolean
  isMember: boolean
  currentUserId: string | null
  onUploadFile: (file: File, kind: 'update') => Promise<string | null>
}

const UPDATE_TYPES: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  general:       { label: 'Update',        icon: Circle,      color: 'text-white/70',   bg: 'bg-white/[0.06]',      border: 'border-white/[0.12]' },
  release:       { label: 'Release',       icon: Rocket,      color: 'text-purple-300', bg: 'bg-purple-500/12',     border: 'border-purple-500/25' },
  building:      { label: 'Building',      icon: Hammer,      color: 'text-orange-300', bg: 'bg-orange-500/12',     border: 'border-orange-500/25' },
  experiment:    { label: 'Experiment',    icon: TestTube,    color: 'text-cyan-300',   bg: 'bg-cyan-500/12',       border: 'border-cyan-500/25' },
  progress:      { label: 'Progress',      icon: ChartLineUp, color: 'text-emerald-300', bg: 'bg-emerald-500/12',   border: 'border-emerald-500/25' },
  fix:           { label: 'Fix',           icon: Bug,         color: 'text-red-300',    bg: 'bg-red-500/12',        border: 'border-red-500/25' },
  announcement:  { label: 'Announcement',  icon: Megaphone,   color: 'text-yellow-300', bg: 'bg-yellow-500/12',     border: 'border-yellow-500/25' },
  collaboration: { label: 'Collaboration', icon: Handshake,   color: 'text-blue-300',   bg: 'bg-blue-500/12',       border: 'border-blue-500/25' },
  insight:       { label: 'Insight',       icon: Lightbulb,   color: 'text-pink-300',   bg: 'bg-pink-500/12',       border: 'border-pink-500/25' },
}

const FILTER_TABS = [
  { id: 'all',          label: 'All' },
  { id: 'release',      label: 'Releases' },
  { id: 'building',     label: 'Building' },
  { id: 'experiment',   label: 'Experiments' },
  { id: 'announcement', label: 'Announcements' },
  { id: 'discussion',   label: 'Discussions' },
]

const SORT_OPTIONS = [
  { id: 'newest',         label: 'Newest' },
  { id: 'most_discussed', label: 'Most discussed' },
  { id: 'most_saved',     label: 'Most saved' },
]

const STAGE_LABELS: Record<string, string> = {
  idea:'Idea', research:'Research', planning:'Planning', prototype:'Prototype',
  mvp:'MVP', beta:'Beta', production:'Production', scaling:'Scaling',
  completed:'Completed', 'on-hold':'On Hold'
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return diff + 'm ago'
  const h = Math.floor(diff / 60)
  if (h < 24) return h + 'h ago'
  const days = Math.floor(h / 24)
  if (days < 7) return days + 'd ago'
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

export function ProjectUpdates({
  slug, projectId, projectStage, isOwner, isMember, currentUserId, onUploadFile
}: Props) {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [composerOpen, setComposerOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ items: any[]; startIndex: number } | null>(null)

  const fetchUpdates = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type: filter, sort })
      const res = await fetch('/api/projects/' + slug + '/updates?' + params)
      const json = await res.json()
      setUpdates(json.updates || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [slug, filter, sort])

  useEffect(() => { fetchUpdates() }, [fetchUpdates])

  // Upload attachment helper (for composer)
  const uploadAttachment = async (file: File) => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/projects/' + slug + '/attachment-upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      return { url: json.url, name: json.name, size: json.size, type: json.type }
    } catch (e: any) {
      alert(e?.message || 'Attachment upload failed')
      return null
    }
  }

  const toggleLike = async (id: string) => {
    setUpdates(prev => prev.map(u => u.id === id ? {
      ...u,
      user_liked: !u.user_liked,
      like_count: u.like_count + (u.user_liked ? -1 : 1)
    } : u))
    try { await fetch('/api/projects/' + slug + '/updates/' + id + '/like', { method: 'POST' }) }
    catch (e) { console.error(e); fetchUpdates() }
  }

  const toggleBookmark = async (id: string) => {
    setUpdates(prev => prev.map(u => u.id === id ? {
      ...u,
      user_bookmarked: !u.user_bookmarked,
      bookmark_count: u.bookmark_count + (u.user_bookmarked ? -1 : 1)
    } : u))
    try { await fetch('/api/projects/' + slug + '/updates/' + id + '/bookmark', { method: 'POST' }) }
    catch (e) { console.error(e); fetchUpdates() }
  }

  const togglePin = async (id: string) => {
    try {
      const res = await fetch('/api/projects/' + slug + '/updates/' + id + '/pin', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { alert(json.error); return }
      await fetchUpdates()
    } catch (e) { console.error(e) }
    setMenuOpenId(null)
  }

  const deleteUpdate = async (id: string) => {
    if (!confirm('Delete this update?')) return
    try {
      await fetch('/api/projects/' + slug + '/updates/' + id, { method: 'DELETE' })
      setUpdates(prev => prev.filter(u => u.id !== id))
    } catch (e) { console.error(e) }
    setMenuOpenId(null)
  }

  const toggleCommentsDisabled = async (u: Update) => {
    try {
      await fetch('/api/projects/' + slug + '/updates/' + u.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments_disabled: !u.comments_disabled }),
      })
      await fetchUpdates()
    } catch (e) { console.error(e) }
    setMenuOpenId(null)
  }

  const shareUpdate = async (u: Update) => {
    const url = window.location.origin + '/projects/' + slug + '#update-' + u.id
    try {
      if (navigator.share) {
        await navigator.share({ title: u.title || 'Project update', url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard')
      }
    } catch {}
  }

  const openLightbox = (u: Update, index: number) => {
    const items: any[] = []
    for (const img of (u.image_urls || [])) items.push({ url: img, type: 'image' })
    for (const vid of (u.media_urls || [])) items.push({ url: vid, type: 'video' })
    setLightbox({ items, startIndex: index })
  }

  return (
    <div className="mb-5">

      {/* Header: title + post button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[20px] font-bold text-white">Updates</h2>
          <p className="text-[13px] text-white/50 mt-0.5">What the team is shipping and building</p>
        </div>
        {(isOwner || isMember) && (
          <button
            onClick={() => setComposerOpen(true)}
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-white text-black hover:bg-white/90 px-4 h-9 rounded-md transition-colors"
          >
            <Plus size={13} weight="bold" /> Post update
          </button>
        )}
      </div>

      {/* Filter + sort bar */}
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-white/[0.06]">
        <div className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={
                'px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 ' +
                (filter === t.id
                  ? 'text-white border-white'
                  : 'text-white/45 border-transparent hover:text-white/80')
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-[12px] text-white/70 hover:text-white bg-white/[0.04] border border-white/[0.1] rounded-md px-2.5 py-1.5 outline-none focus:border-white/25 mb-2 cursor-pointer"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.id} value={o.id} className="bg-[#12121a]">{o.label}</option>
          ))}
        </select>
      </div>

      {/* Updates list */}
      {loading ? (
        <div className="py-10 text-center text-[13px] text-white/45">Loading updates...</div>
      ) : updates.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-12 text-center">
          <ChatCircleDots size={32} className="mx-auto mb-3 text-white/25" />
          <p className="text-[14px] text-white/50">No updates yet</p>
          <p className="text-[12px] text-white/35 mt-1">
            {isOwner || isMember
              ? 'Post your first update to share progress with your community.'
              : 'The team hasn\u2019t posted any updates yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map(u => {
            const typeCfg = UPDATE_TYPES[u.update_type] || UPDATE_TYPES.general
            const TypeIcon = typeCfg.icon
            const isAuthor = currentUserId === u.user_id
            const canDelete = isAuthor || isOwner
            const canEdit = isAuthor
            const mediaItems: any[] = [
              ...(u.image_urls || []).map(url => ({ url, type: 'image' })),
              ...(u.media_urls || []).map(url => ({ url, type: 'video' })),
            ]
            const previewMedia = mediaItems.slice(0, 3)
            const extraCount = mediaItems.length - previewMedia.length

            return (
              <article
                key={u.id}
                id={'update-' + u.id}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden"
              >
                <div className="p-5 md:p-6">

                  {/* Author row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {u.user?.avatar_url ? (
                          <img src={u.user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[13px] font-semibold text-white/80">{(u.user?.full_name || '?').charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[14px] font-semibold text-white truncate">{u.user?.full_name || 'Unknown'}</p>
                          {u.user?.is_verified && <Certificate size={12} weight="fill" className="text-blue-400" />}
                          {u.author_role && (
                            <span className="text-[10px] font-semibold text-purple-200 bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded uppercase tracking-wide">
                              {u.author_role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-white/45 mt-0.5">
                          <span>{timeAgo(u.created_at)}</span>
                          {u.edited_at && <span className="text-white/35">· edited</span>}
                          {u.is_pinned && (
                            <span className="inline-flex items-center gap-0.5 text-purple-300 font-medium">
                              · <PushPin size={9} weight="fill" /> Pinned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isOwner && (
                        <button
                          onClick={() => togglePin(u.id)}
                          className="w-8 h-8 rounded-md text-white/50 hover:text-white hover:bg-white/[0.06] flex items-center justify-center"
                          title={u.is_pinned ? 'Unpin' : 'Pin'}
                        >
                          {u.is_pinned ? <PushPinSlash size={15} /> : <PushPin size={15} />}
                        </button>
                      )}
                      {(canDelete || canEdit) && (
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === u.id ? null : u.id)}
                            className="w-8 h-8 rounded-md text-white/50 hover:text-white hover:bg-white/[0.06] flex items-center justify-center"
                          >
                            <DotsThree size={18} weight="bold" />
                          </button>
                          {menuOpenId === u.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setMenuOpenId(null)} />
                              <div className="absolute right-0 top-9 z-30 min-w-[180px] bg-[#12121a] border border-white/[0.08] rounded-lg shadow-2xl py-1">
                                {isOwner && (
                                  <button
                                    onClick={() => toggleCommentsDisabled(u)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-white/80 hover:bg-white/[0.05]"
                                  >
                                    <Prohibit size={13} />
                                    {u.comments_disabled ? 'Enable comments' : 'Disable comments'}
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => deleteUpdate(u.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-300 hover:bg-red-500/10"
                                  >
                                    <Trash size={13} /> Delete
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type badge */}
                  <div className="mb-3">
                    <span className={
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ' +
                      typeCfg.bg + ' ' + typeCfg.border + ' ' + typeCfg.color
                    }>
                      <TypeIcon size={11} weight="fill" /> {typeCfg.label}
                    </span>
                  </div>

                  {/* Title */}
                  {u.title && (
                    <h3 className="text-[19px] font-bold text-white leading-tight mb-2">
                      {u.title}
                    </h3>
                  )}

                  {/* Body */}
                  {u.content && (
                    <div className="prose prose-invert prose-sm max-w-none text-[14px] text-white/80 leading-relaxed mb-3 prose-headings:text-white prose-a:text-purple-300 prose-strong:text-white prose-code:text-purple-200 prose-code:bg-white/[0.06] prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{u.content}</ReactMarkdown>
                    </div>
                  )}

                  {/* Media grid */}
                  {mediaItems.length > 0 && (
                    <div className={
                      'grid gap-2 mb-3 ' +
                      (previewMedia.length === 1 ? 'grid-cols-1' :
                       previewMedia.length === 2 ? 'grid-cols-2' :
                       'grid-cols-3')
                    }>
                      {previewMedia.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => openLightbox(u, i)}
                          className="relative aspect-video rounded-lg overflow-hidden bg-black/40 group border border-white/[0.06]"
                        >
                          {item.type === 'video' ? (
                            <>
                              <video src={item.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                  <Play size={20} weight="fill" className="text-black ml-0.5" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          )}
                          {i === previewMedia.length - 1 && extraCount > 0 && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                              <span className="text-[24px] font-bold">+{extraCount}</span>
                              <span className="text-[11px] text-white/70 uppercase tracking-wider mt-0.5">More</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Milestone + tags row */}
                  {((u.milestone_from && u.milestone_to) || (u.tags && u.tags.length > 0) || u.resource_url) && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {u.milestone_from && u.milestone_to && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/12 border border-emerald-500/25 text-emerald-300 px-2 py-1 rounded-md">
                          <Flag size={10} weight="fill" />
                          {STAGE_LABELS[u.milestone_from] || u.milestone_from}
                          <span className="text-emerald-300/70">→</span>
                          {STAGE_LABELS[u.milestone_to] || u.milestone_to}
                        </span>
                      )}
                      {(u.tags || []).map(t => (
                        <span key={t} className="text-[11px] text-white/70 bg-white/[0.04] border border-white/[0.08] px-2 py-1 rounded-md">
                          #{t}
                        </span>
                      ))}
                      {u.resource_url && (
                        <a
                          href={u.resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/25 hover:bg-blue-500/15 px-2 py-1 rounded-md transition-colors"
                        >
                          <LinkSimple size={11} weight="bold" />
                          {u.resource_label || 'View resource'}
                          <ArrowSquareOut size={9} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Attachments */}
                  {u.attachments && u.attachments.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {u.attachments.map((a: any, i: number) => (
                        <a
                          key={i}
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] rounded-lg transition-colors group"
                        >
                          <Paperclip size={13} className="text-white/50 flex-shrink-0" />
                          <span className="flex-1 text-[13px] text-white truncate">{a.name || 'Attachment'}</span>
                          <ArrowSquareOut size={11} className="text-white/40 group-hover:text-white" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 border-t border-white/[0.05]">
                    <button
                      onClick={() => currentUserId && toggleLike(u.id)}
                      className={
                        'flex items-center gap-1.5 px-3 h-8 rounded-md text-[13px] font-medium transition-colors ' +
                        (u.user_liked
                          ? 'text-red-400 bg-red-500/10 hover:bg-red-500/15'
                          : 'text-white/60 hover:text-red-400 hover:bg-white/[0.04]')
                      }
                    >
                      <Heart size={14} weight={u.user_liked ? 'fill' : 'regular'} />
                      {formatNumber(u.like_count)}
                    </button>

                    {!u.comments_disabled && (
                      <button
                        onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-md text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04]"
                      >
                        <ChatCircle size={14} />
                        {formatNumber(u.comment_count)}
                      </button>
                    )}

                    <button
                      onClick={() => currentUserId && toggleBookmark(u.id)}
                      className={
                        'flex items-center gap-1.5 px-3 h-8 rounded-md text-[13px] font-medium transition-colors ' +
                        (u.user_bookmarked
                          ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/15'
                          : 'text-white/60 hover:text-yellow-400 hover:bg-white/[0.04]')
                      }
                    >
                      <BookmarkSimple size={14} weight={u.user_bookmarked ? 'fill' : 'regular'} />
                      {formatNumber(u.bookmark_count)}
                    </button>

                    <button
                      onClick={() => shareUpdate(u)}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-md text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04]"
                    >
                      <ShareNetwork size={14} /> Share
                    </button>
                  </div>

                  {/* Comments panel */}
                  {expanded === u.id && !u.comments_disabled && (
                    <UpdateComments slug={slug} postId={u.id} currentUserId={currentUserId} />
                  )}

                  {u.comments_disabled && (
                    <p className="text-[12px] text-white/40 text-center pt-3 border-t border-white/[0.05]">
                      Comments have been disabled for this update
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {composerOpen && (
        <ProjectUpdateComposer
          slug={slug}
          currentStage={projectStage}
          onClose={() => setComposerOpen(false)}
          onPosted={fetchUpdates}
          onUploadImage={onUploadFile}
          onUploadAttachment={uploadAttachment}
        />
      )}

      {lightbox && (
        <MediaLightbox
          items={lightbox.items}
          startIndex={lightbox.startIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════════
function UpdateComments({ slug, postId, currentUserId }: {
  slug: string; postId: string; currentUserId: string | null
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/projects/' + slug + '/updates/' + postId + '/comments')
      .then(r => r.json())
      .then(j => { if (mounted) setComments(j.comments || []) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [slug, postId])

  const submit = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch('/api/projects/' + slug + '/updates/' + postId + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      const json = await res.json()
      if (res.ok) {
        setComments(prev => [...prev, json.comment])
        setText('')
      }
    } finally { setPosting(false) }
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.05]">
      {loading ? (
        <p className="text-[12px] text-white/40">Loading comments...</p>
      ) : (
        <>
          {comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {c.user?.avatar_url ? (
                      <img src={c.user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] font-semibold text-white/80">{(c.user?.full_name || '?').charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06]">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-[12px] font-semibold text-white">{c.user?.full_name || 'Unknown'}</p>
                        {c.user?.is_verified && <Certificate size={9} weight="fill" className="text-blue-400" />}
                        <span className="text-[10px] text-white/40">· {timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-[13px] text-white/85 leading-snug whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentUserId ? (
            <div className="flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 2000))}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
                placeholder="Add a comment..."
                className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-md h-9 px-3 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-white/25"
              />
              <button
                onClick={submit}
                disabled={posting || !text.trim()}
                className="w-9 h-9 rounded-md bg-white text-black flex items-center justify-center disabled:opacity-40"
              >
                <PaperPlaneRight size={13} weight="fill" />
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-white/40 text-center">Sign in to comment</p>
          )}
        </>
      )}
    </div>
  )
}
