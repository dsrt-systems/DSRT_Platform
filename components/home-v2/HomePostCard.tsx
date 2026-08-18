'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Heart, ChatCircle, ArrowsClockwise, BookmarkSimple, ShareNetwork,
  CheckCircle, DotsThree, ThumbsUp, Lightbulb, Confetti, HandsClapping, Question,
} from '@phosphor-icons/react'
import { ReactionPicker, REACTIONS } from './interactions/ReactionPicker'
import { RepostMenu } from './interactions/RepostMenu'
import { ShareModal } from './interactions/ShareModal'
import { QuotePostModal } from './interactions/QuotePostModal'
import { CommentPanel } from './interactions/CommentPanel'
import { PostMoreMenu } from './PostMoreMenu'

interface Props {
  post: any
  currentUser: any
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  update:      { label: 'Update',      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  milestone:   { label: 'Milestone',   color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  idea:        { label: 'Idea',        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  looking_for: { label: 'Looking For', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  build_log:   { label: 'Build Log',   color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  launch:      { label: 'Launch',      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  discussion:  { label: 'Discussion',  color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  question:    { label: 'Question',    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  problem:     { label: 'Problem',     color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

const REACTION_ICON: Record<string, any> = {
  like: ThumbsUp, love: Heart, insightful: Lightbulb,
  celebrate: Confetti, support: HandsClapping, curious: Question,
}

const REACTION_COLOR: Record<string, string> = {
  like: 'text-blue-400',
  love: 'text-pink-500',
  insightful: 'text-amber-400',
  celebrate: 'text-purple-400',
  support: 'text-emerald-400',
  curious: 'text-cyan-400',
}

export function HomePostCard({ post, currentUser }: Props) {
  const [reactionType, setReactionType] = useState<string | null>(post.is_reacted ? 'like' : null)
  const [reactionCount, setReactionCount] = useState(post.reaction_count ?? post.like_count ?? 0)
  const [commentCount, setCommentCount] = useState(post.comment_count || 0)
  const [repostCount, setRepostCount] = useState(post.repost_count || 0)
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked || false)
  const [reposted, setReposted] = useState(post.is_reposted || false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showRepostMenu, setShowRepostMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)

  const publisher = post.publisher
  if (!publisher) return null

  const publisherHref = publisher.type === 'venture'
    ? `/ventures/${publisher.slug}`
    : publisher.type === 'project'
    ? `/projects/${publisher.slug}`
    : publisher.type === 'community'
    ? `/community/${publisher.slug}`
    : `/profile/${publisher.handle}`

  const typeMeta = TYPE_LABELS[post.type]

  const handleReaction = async (type: string) => {
    setShowReactionPicker(false)
    const wasReacted = !!reactionType
    const wasSameType = reactionType === type

    if (wasSameType) {
      // Undo
      setReactionType(null)
      setReactionCount((n: number) => Math.max(0, n - 1))
      try {
        await fetch(`/api/posts/${post.id}/react`, { method: 'DELETE' })
      } catch {
        setReactionType(type)
        setReactionCount((n: number) => n + 1)
      }
    } else {
      setReactionType(type)
      if (!wasReacted) setReactionCount((n: number) => n + 1)
      try {
        await fetch(`/api/posts/${post.id}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction_type: type }),
        })
      } catch {
        setReactionType(wasReacted ? 'like' : null)
        if (!wasReacted) setReactionCount((n: number) => n - 1)
      }
    }
  }

  const handleQuickReaction = async () => {
    if (reactionType) {
      handleReaction(reactionType) // toggle off
    } else {
      handleReaction('like')
    }
  }

  const startHoverTimer = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setShowReactionPicker(true), 500)
  }

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
  }

  const handleBookmark = async () => {
    const was = bookmarked
    setBookmarked(!was)
    try {
      await fetch(`/api/posts/${post.id}/bookmark`, {
        method: was ? 'DELETE' : 'POST',
      })
    } catch {
      setBookmarked(was)
    }
  }

  const handleRepost = async () => {
    setShowRepostMenu(false)
    const was = reposted
    setReposted(!was)
    setRepostCount((n: number) => was ? n - 1 : n + 1)

    try {
      if (was) {
        await fetch(
          `/api/posts/${post.id}/repost?publisher_type=person&publisher_id=${currentUser.id}`,
          { method: 'DELETE' }
        )
      } else {
        await fetch(`/api/posts/${post.id}/repost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publisher_type: 'person',
            publisher_id: currentUser.id,
          }),
        })
      }
    } catch {
      setReposted(was)
      setRepostCount((n: number) => was ? n + 1 : n - 1)
    }
  }

  const timeAgo = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: false })
    : ''

  const ActiveReactionIcon = reactionType ? REACTION_ICON[reactionType] : Heart
  const activeColorClass = reactionType ? REACTION_COLOR[reactionType] : ''

  return (
    <>
      <article
        className={
          'group rounded-xl border border-zinc-800/60 transition-all ' +
          'bg-gradient-to-b from-zinc-900/40 via-zinc-950/40 to-zinc-950/60 ' +
          'hover:border-zinc-700/80 ' +
          'shadow-[0_1px_0_rgba(255,255,255,0.025)_inset,0_2px_10px_rgba(0,0,0,0.25)]'
        }
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Link href={publisherHref} className="shrink-0">
              <div className={
                'w-12 h-12 overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all group-hover:border-zinc-700 ' +
                (publisher.type === 'venture' || publisher.type === 'project' ? 'rounded-xl' : 'rounded-full')
              }>
                {publisher.avatar_url ? (
                  <img src={publisher.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : publisher.icon ? (
                  <span className="text-lg">{publisher.icon}</span>
                ) : (
                  <span className="text-[15px] font-bold text-zinc-400">
                    {publisher.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={publisherHref}
                  className="text-[15px] font-bold text-white hover:underline truncate max-w-[240px] tracking-tight"
                >
                  {publisher.name}
                </Link>
                {publisher.is_verified && <CheckCircle size={13} weight="fill" className="text-blue-400 shrink-0" />}
                {publisher.type === 'venture' && (
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] px-1.5 py-[1px] rounded border border-zinc-700/60 text-zinc-400 bg-zinc-900/60">
                    VENTURE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[12.5px] text-zinc-500 mt-0.5">
                <span>@{publisher.handle}</span>
                <span className="text-zinc-700">·</span>
                <span>{timeAgo}</span>
                {publisher.tagline && (
                  <>
                    <span className="text-zinc-700 hidden sm:inline">·</span>
                    <span className="truncate hidden sm:inline">{publisher.tagline}</span>
                  </>
                )}
              </div>
            </div>

                      <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu) }}
              className="w-8 h-8 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/60 flex items-center justify-center shrink-0 transition-colors"
            >
              <DotsThree size={16} weight="bold" />
            </button>
            {showMoreMenu && (
              <PostMoreMenu
                post={post}
                isOwn={currentUser?.id === post.user_id}
                onClose={() => setShowMoreMenu(false)}
                onDeleted={() => window.location.reload()}
              />
            )}
          </div>
          </div>

          {/* Type badge + Title */}
          {(typeMeta || post.title) && (
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              {typeMeta && (
                <span className={
                  'inline-flex items-center h-[22px] px-2 rounded-md text-[10px] font-bold uppercase tracking-[0.08em] border ' +
                  typeMeta.color
                }>
                  {typeMeta.label}
                </span>
              )}
              {post.title && (
                <h2 className="text-[17px] font-bold text-white leading-snug tracking-tight">
                  {post.title}
                </h2>
              )}
            </div>
          )}

          {/* Content */}
          {post.content && (
            <div className="text-[15px] text-zinc-200 leading-[1.65] whitespace-pre-wrap mb-3 font-normal">
              {post.content}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
              {post.tags.slice(0, 6).map((tag: string) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent('#' + tag)}`}
                  className="text-[12.5px] font-medium text-blue-400 hover:text-blue-300 hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Media */}
          {(post.image_urls?.length > 0 || post.media_urls?.length > 0) && (
            <PostMedia urls={post.image_urls?.length ? post.image_urls : post.media_urls} />
          )}

          {post.video_url && (
            <div className="rounded-xl overflow-hidden border border-zinc-800 mb-3 bg-zinc-950">
              <video src={post.video_url} controls className="w-full max-h-[500px]" />
            </div>
          )}

          {post.link_url && post.link_title && !post.image_urls?.length && (
            <LinkPreview post={post} />
          )}

          {/* Interaction bar */}
          <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center gap-1">
            {/* React button with picker */}
            <div
              className="relative"
              onMouseEnter={startHoverTimer}
              onMouseLeave={clearHoverTimer}
            >
              <button
                onClick={handleQuickReaction}
                className={
                  'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-semibold transition-all ' +
                  (reactionType
                    ? `${activeColorClass} bg-zinc-800/60`
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60')
                }
              >
                <ActiveReactionIcon size={14} weight={reactionType ? 'fill' : 'regular'} />
                {reactionCount > 0 && <span className="tabular-nums">{reactionCount.toLocaleString()}</span>}
              </button>

              {showReactionPicker && (
                <ReactionPicker
                  currentReaction={reactionType}
                  onSelect={handleReaction}
                  onClose={() => setShowReactionPicker(false)}
                />
              )}
            </div>

            {/* Comment button */}
            <button
              onClick={() => setShowComments(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-semibold text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-all"
            >
              <ChatCircle size={14} weight="regular" />
              {commentCount > 0 && <span className="tabular-nums">{commentCount.toLocaleString()}</span>}
            </button>

            {/* Repost button with menu */}
            <div className="relative">
              <button
                onClick={() => setShowRepostMenu(true)}
                className={
                  'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-semibold transition-all ' +
                  (reposted
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60')
                }
              >
                <ArrowsClockwise size={14} weight={reposted ? 'fill' : 'regular'} />
                {repostCount > 0 && <span className="tabular-nums">{repostCount.toLocaleString()}</span>}
              </button>

              {showRepostMenu && (
                <RepostMenu
                  hasReposted={reposted}
                  onRepost={handleRepost}
                  onQuote={() => { setShowRepostMenu(false); setShowQuoteModal(true) }}
                  onClose={() => setShowRepostMenu(false)}
                />
              )}
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handleBookmark}
                className={
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-all ' +
                  (bookmarked
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60')
                }
                aria-label="Bookmark"
              >
                <BookmarkSimple size={14} weight={bookmarked ? 'fill' : 'regular'} />
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-all"
                aria-label="Share"
              >
                <ShareNetwork size={14} weight="regular" />
              </button>
            </div>
          </div>
        </div>
      </article>

      {showShareModal && (
        <ShareModal post={post} onClose={() => setShowShareModal(false)} />
      )}

      {showQuoteModal && (
        <QuotePostModal
          post={post}
          currentUser={currentUser}
          onClose={() => setShowQuoteModal(false)}
          onSuccess={() => {
            setShowQuoteModal(false)
            setRepostCount((n: number) => n + 1)
          }}
        />
      )}

      {showComments && (
        <CommentPanel
          postId={post.id}
          currentUser={currentUser}
          onClose={() => setShowComments(false)}
          onCommentCountChange={(delta) => setCommentCount((n: number) => Math.max(0, n + delta))}
        />
      )}
    </>
  )
}

function PostMedia({ urls }: { urls: string[] }) {
  const displayUrls = urls.slice(0, 4)
  if (displayUrls.length === 1) {
    return (
      <div className="rounded-xl overflow-hidden border border-zinc-800 mb-3 max-h-[560px] bg-zinc-950">
        <img src={displayUrls[0]} alt="" className="w-full object-cover" />
      </div>
    )
  }
  return (
    <div className={
      'grid gap-1 rounded-xl overflow-hidden border border-zinc-800 mb-3 bg-zinc-950 ' +
      (displayUrls.length === 2 ? 'grid-cols-2 max-h-[320px]' :
       displayUrls.length === 3 ? 'grid-cols-2 grid-rows-2 max-h-[420px]' :
       'grid-cols-2 max-h-[420px]')
    }>
      {displayUrls.map((url, i) => (
        <div key={i} className={'overflow-hidden bg-zinc-900 ' + (displayUrls.length === 3 && i === 0 ? 'row-span-2' : '')}>
          <img src={url} alt="" className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  )
}

function LinkPreview({ post }: { post: any }) {
  let hostname = ''
  try { hostname = new URL(post.link_url).hostname.replace('www.', '') } catch {}
  return (
    <a href={post.link_url} target="_blank" rel="noopener noreferrer"
       className="block rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors mb-3 bg-zinc-950/40">
      {post.link_image && (
        <div className="aspect-[16/9] overflow-hidden bg-zinc-900">
          <img src={post.link_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3.5">
        <div className="text-[10.5px] uppercase tracking-[0.08em] font-bold text-zinc-500 mb-1">{hostname}</div>
        <div className="text-[14px] font-bold text-white line-clamp-2 mb-1 tracking-tight">{post.link_title}</div>
        {post.link_description && (
          <p className="text-[12px] text-zinc-500 line-clamp-2 leading-relaxed">{post.link_description}</p>
        )}
      </div>
    </a>
  )
}