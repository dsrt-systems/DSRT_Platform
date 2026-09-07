'use client'

import Link from 'next/link'
import { useState, useRef, useLayoutEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Heart, ChatCircle, ArrowsClockwise, BookmarkSimple, ShareNetwork,
  CheckCircle, DotsThree, ThumbsUp, Lightbulb, Confetti, HandsClapping, Question,
} from '@phosphor-icons/react'
import { ReactionPicker } from './interactions/ReactionPicker'
import { RepostMenu } from './interactions/RepostMenu'
import { ShareModal } from './interactions/ShareModal'
import { QuotePostModal } from './interactions/QuotePostModal'
import { CommentPanel } from './interactions/CommentPanel'
import { PostMoreMenu } from './PostMoreMenu'
import { usePostDwellTracker } from '@/hooks/useTracking'
import { DsrtPanel, DsrtAvatar } from '@/components/dsrt'

function sanitizePostHTML(html: string): string {
  if (!html) return ''
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html
      .split('\n')
      .map(line => (line.trim() ? `<p>${escapeHTML(line)}</p>` : '<br/>'))
      .join('')
  }
  let clean = html
    .replace(/<\?xml[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s+style="[^"]*"/gi, '')
    .replace(/\s+class="[^"]*"/gi, '')
    .replace(/<span[^>]*>/gi, '<span>')
    .replace(/\s{2,}/g, ' ')
  return clean.trim()
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

interface Props {
  post: any
  currentUser: any
}

// ═══════════════════════════════════════════════════════════
// SOLID FILLED BADGES — Classic professional look
// ═══════════════════════════════════════════════════════════
const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  update:      { label: 'Update',      color: 'text-white bg-blue-600 border-blue-500' },
  milestone:   { label: 'Milestone',   color: 'text-white bg-amber-600 border-amber-500' },
  idea:        { label: 'Idea',        color: 'text-white bg-purple-600 border-purple-500' },
  looking_for: { label: 'Looking For', color: 'text-white bg-emerald-600 border-emerald-500' },
  build_log:   { label: 'Build Log',   color: 'text-white bg-cyan-600 border-cyan-500' },
  launch:      { label: 'Launch',      color: 'text-white bg-orange-600 border-orange-500' },
  discussion:  { label: 'Discussion',  color: 'text-white bg-indigo-600 border-indigo-500' },
  question:    { label: 'Question',    color: 'text-white bg-pink-600 border-pink-500' },
  problem:     { label: 'Problem',     color: 'text-white bg-red-600 border-red-500' },
}

const REACTION_ICON: Record<string, any> = {
  like: ThumbsUp, love: Heart, insightful: Lightbulb, celebrate: Confetti, support: HandsClapping, curious: Question,
}

const REACTION_COLOR: Record<string, string> = {
  like: 'text-blue-400', love: 'text-pink-400', insightful: 'text-amber-400', celebrate: 'text-purple-400', support: 'text-emerald-400', curious: 'text-cyan-400',
}

const MAX_CONTENT_HEIGHT = 280

export function HomePostCard({ post, currentUser }: Props) {
  const postRef = usePostDwellTracker(post.id, post.tags || [])
  const contentWrapperRef = useRef<HTMLDivElement>(null)

  const [isHidden, setIsHidden] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useLayoutEffect(() => {
    if (contentWrapperRef.current && contentWrapperRef.current.scrollHeight > MAX_CONTENT_HEIGHT) {
      setIsOverflowing(true)
    }
  }, [post.content])

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

  if (isHidden) return null
  const publisher = post.publisher
  if (!publisher) return null

  const publisherHref =
    publisher.type === 'venture'
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
    if (reactionType === type) {
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

  const handleQuickReaction = async () =>
    reactionType ? handleReaction(reactionType) : handleReaction('like')

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
      await fetch(`/api/posts/${post.id}/bookmark`, { method: was ? 'DELETE' : 'POST' })
    } catch {
      setBookmarked(was)
    }
  }

  const handleRepost = async () => {
    setShowRepostMenu(false)
    const was = reposted
    setReposted(!was)
    setRepostCount((n: number) => (was ? n - 1 : n + 1))
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
          body: JSON.stringify({ publisher_type: 'person', publisher_id: currentUser.id }),
        })
      }
    } catch {
      setReposted(was)
      setRepostCount((n: number) => (was ? n + 1 : n - 1))
    }
  }

  const timeAgo = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: false })
    : ''
  const ActiveReactionIcon = reactionType ? REACTION_ICON[reactionType] : Heart
  const activeColorClass = reactionType ? REACTION_COLOR[reactionType] : ''

  return (
    <>
      <DsrtPanel
        ref={postRef as any}
        variant="default"
        padding="md"
        className="group w-full max-w-full overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 mb-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href={publisherHref} className="shrink-0">
              <DsrtAvatar
                src={publisher.avatar_url}
                name={publisher.name}
                size="md"
                className={publisher.type !== 'person' ? 'rounded-xl' : 'rounded-full'}
              />
            </Link>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  href={publisherHref}
                  className="text-[14px] sm:text-[15px] font-bold text-white hover:underline truncate tracking-tight min-w-0 font-sans"
                >
                  {publisher.name}
                </Link>
                {publisher.is_verified && (
                  <CheckCircle size={14} weight="fill" className="text-blue-400 shrink-0" />
                )}
                {publisher.type === 'venture' && (
                  <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/50 border border-white/[0.08] shrink-0">
                    Venture
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-white/50 mt-0.5 min-w-0 font-sans">
                <span className="truncate">@{publisher.handle}</span>
                <span className="shrink-0">·</span>
                <span className="shrink-0">{timeAgo}</span>
                {publisher.tagline && (
                  <>
                    <span className="hidden sm:inline shrink-0">·</span>
                    <span className="truncate hidden sm:inline min-w-0">{publisher.tagline}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMoreMenu(!showMoreMenu)
              }}
              className="w-8 h-8 rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors"
            >
              <DotsThree size={20} weight="bold" />
            </button>
            {showMoreMenu && (
              <PostMoreMenu
                post={post}
                currentUser={currentUser}
                onClose={() => setShowMoreMenu(false)}
                onHide={() => setIsHidden(true)}
              />
            )}
          </div>
        </div>

        {/* Solid Filled Badges + Title */}
        {(typeMeta || post.title) && (
          <div className="mb-3 flex flex-col gap-2 min-w-0">
            {typeMeta && (
              <span
                className={cn(
                  'inline-flex w-fit items-center h-[24px] px-2.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider border shadow-sm',
                  typeMeta.color
                )}
              >
                {typeMeta.label}
              </span>
            )}
            {post.title && (
              <h2 className="text-[17px] sm:text-[19px] font-bold text-white tracking-tight leading-snug break-words [word-break:break-word] font-sans">
                {post.title}
              </h2>
            )}
          </div>
        )}

        {/* Clean, classic body text — sans-serif, easy to read */}
        {post.content && (
          <div className="relative mb-4 min-w-0 max-w-full overflow-hidden">
            <div
              ref={contentWrapperRef}
              className={cn(
                'min-w-0 max-w-full overflow-hidden font-sans',
                'text-[14.5px] sm:text-[15px] text-white/85 leading-[1.65]',
                'break-words [word-break:break-word]',
                '[&_p]:mb-3 [&_p]:last:mb-0',
                '[&_h1]:text-[20px] [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:tracking-tight',
                '[&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:tracking-tight',
                '[&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-3 [&_h3]:mb-1.5',
                '[&_strong]:font-semibold [&_strong]:text-white',
                '[&_em]:italic',
                '[&_a]:text-blue-400 [&_a]:underline [&_a]:break-all hover:[&_a]:text-blue-300',
                '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-1',
                '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_ol]:space-y-1',
                '[&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-white/70 [&_blockquote]:my-3',
                '[&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono [&_code]:text-white/90 [&_code]:break-words',
                '[&_pre]:bg-black/40 [&_pre]:border [&_pre]:border-white/[0.08] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:text-[13px]',
                '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
                '[&_hr]:border-white/[0.08] [&_hr]:my-4',
                '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3',
                '[&_*]:max-w-full [&_*]:break-words',
                !isExpanded && isOverflowing ? 'max-h-[280px] overflow-hidden' : ''
              )}
              dangerouslySetInnerHTML={{ __html: sanitizePostHTML(post.content) }}
            />
            {!isExpanded && isOverflowing && (
              <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent flex items-end justify-start">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-[13px] font-semibold text-blue-400 hover:text-blue-300 pb-1"
                >
                  Read more
                </button>
              </div>
            )}
            {isExpanded && isOverflowing && (
              <button
                onClick={() => setIsExpanded(false)}
                className="text-[12px] font-medium text-white/50 hover:text-white/80 mt-2"
              >
                Show less
              </button>
            )}
          </div>
        )}

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 min-w-0">
            {post.tags.slice(0, 6).map((tag: string) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent('#' + tag)}`}
                className="text-[12.5px] font-medium text-blue-400 hover:text-blue-300 hover:underline break-all max-w-full font-sans"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {(post.image_urls?.length > 0 || post.media_urls?.length > 0) && (
          <PostMedia urls={post.image_urls?.length ? post.image_urls : post.media_urls} />
        )}
        {post.video_url && (
          <div className="rounded-xl overflow-hidden border border-white/[0.08] mb-4 bg-black max-w-full">
            <video src={post.video_url} controls className="w-full max-h-[500px]" />
          </div>
        )}
        {post.link_url && post.link_title && !post.image_urls?.length && (
          <LinkPreview post={post} />
        )}

        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1 sm:gap-2 min-w-0">
          <div
            className="relative"
            onMouseEnter={startHoverTimer}
            onMouseLeave={clearHoverTimer}
          >
            <button
              onClick={handleQuickReaction}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-[13px] font-medium transition-colors',
                reactionType
                  ? `${activeColorClass} bg-white/[0.06]`
                  : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
              )}
            >
              <ActiveReactionIcon size={18} weight={reactionType ? 'fill' : 'regular'} />
              {reactionCount > 0 && (
                <span className="tabular-nums">{reactionCount.toLocaleString()}</span>
              )}
            </button>
            {showReactionPicker && (
              <ReactionPicker
                currentReaction={reactionType}
                onSelect={handleReaction}
                onClose={() => setShowReactionPicker(false)}
              />
            )}
          </div>

          <button
            onClick={() => setShowComments(true)}
            className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-[13px] font-medium text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <ChatCircle size={18} weight="regular" />
            {commentCount > 0 && (
              <span className="tabular-nums">{commentCount.toLocaleString()}</span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowRepostMenu(true)}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-[13px] font-medium transition-colors',
                reposted
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
              )}
            >
              <ArrowsClockwise size={18} weight={reposted ? 'bold' : 'regular'} />
              {repostCount > 0 && (
                <span className="tabular-nums">{repostCount.toLocaleString()}</span>
              )}
            </button>
            {showRepostMenu && (
              <RepostMenu
                hasReposted={reposted}
                onRepost={handleRepost}
                onQuote={() => {
                  setShowRepostMenu(false)
                  setShowQuoteModal(true)
                }}
                onClose={() => setShowRepostMenu(false)}
              />
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 shrink-0">
            <button
              onClick={handleBookmark}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                bookmarked
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
              )}
              aria-label="Bookmark"
            >
              <BookmarkSimple size={18} weight={bookmarked ? 'fill' : 'regular'} />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Share"
            >
              <ShareNetwork size={18} weight="regular" />
            </button>
          </div>
        </div>
      </DsrtPanel>

      {showShareModal && <ShareModal post={post} onClose={() => setShowShareModal(false)} />}
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
          onCommentCountChange={(delta) =>
            setCommentCount((n: number) => Math.max(0, n + delta))
          }
        />
      )}
    </>
  )
}

function PostMedia({ urls }: { urls: string[] }) {
  const displayUrls = urls.slice(0, 4)
  if (displayUrls.length === 1) {
    return (
      <div className="rounded-xl overflow-hidden border border-white/[0.08] mb-4 bg-black max-w-full">
        <img
          src={displayUrls[0]}
          alt=""
          className="w-full max-w-full object-cover max-h-[560px]"
          loading="lazy"
        />
      </div>
    )
  }
  return (
    <div
      className={cn(
        'grid gap-1 rounded-xl overflow-hidden border border-white/[0.08] mb-4 bg-black max-w-full',
        displayUrls.length === 2
          ? 'grid-cols-2 max-h-[320px]'
          : displayUrls.length === 3
            ? 'grid-cols-2 grid-rows-2 max-h-[420px]'
            : 'grid-cols-2 max-h-[420px]'
      )}
    >
      {displayUrls.map((url, i) => (
        <div
          key={i}
          className={cn(
            'overflow-hidden bg-white/[0.04] min-w-0',
            displayUrls.length === 3 && i === 0 && 'row-span-2'
          )}
        >
          <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  )
}

function LinkPreview({ post }: { post: any }) {
  let hostname = ''
  try {
    hostname = new URL(post.link_url).hostname.replace('www.', '')
  } catch {}
  return (
    <a
      href={post.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden border border-white/[0.08] hover:border-white/[0.12] transition-colors mb-4 bg-white/[0.02] max-w-full"
    >
      {post.link_image && (
        <div className="aspect-[21/9] overflow-hidden bg-black">
          <img
            src={post.link_image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4 min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1 truncate">
          {hostname}
        </div>
        <div className="text-[14px] font-medium text-white line-clamp-2 mb-1 leading-tight break-words [word-break:break-word]">
          {post.link_title}
        </div>
        {post.link_description && (
          <p className="text-[12px] text-white/50 line-clamp-2 leading-relaxed break-words [word-break:break-word]">
            {post.link_description}
          </p>
        )}
      </div>
    </a>
  )
}