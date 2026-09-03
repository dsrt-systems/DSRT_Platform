'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Pin,
  Trash2,
  MoreHorizontal,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Flag,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/sonner'
import { PollWidget } from './PollWidget'
import { ReactionBar } from './ReactionBar'
import { CommentThread } from './CommentThread'
import { ControlledReportModal } from '@/components/community-hub/moderation/ReportModal'
import { ConfirmDialog } from '@/components/ui/reason-prompt-dialog'

interface Props {
  post: any
  slug: string
  currentUserId?: string | null
  canModerate?: boolean
  canPost?: boolean
  onDeleted?: (id: string) => void
}

export function PostCard({
  post,
  slug,
  currentUserId,
  canModerate,
  canPost,
  onDeleted,
}: Props) {
  const [showComments, setShowComments] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const author = post.author

  const isOwn = !!currentUserId && post.author_identity_id === currentUserId
  const canDelete = isOwn || !!canModerate
  const isPinned = !!post.pinned_at

  const del = async () => {
    const res = await fetch(`/api/v1/community/posts/${post.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Delete failed')
      throw new Error('delete failed')
    }
    toast.success('Post deleted')
    onDeleted?.(post.id)
  }

  const togglePin = async () => {
    const nextPin = !post.pinned_at
    const res = await fetch(`/api/v1/community/posts/${post.id}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: nextPin }),
    })
    if (!res.ok) {
      toast.error('Pin failed')
      return
    }
    toast.success(nextPin ? 'Pinned' : 'Unpinned')
  }

  return (
    <>
      <article className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] overflow-hidden">
        {isPinned && (
          <div className="flex items-center gap-1.5 border-b border-white/[0.04] bg-white/[0.02] px-4 py-1.5">
            <Pin className="w-3 h-3 text-white/50" strokeWidth={1.75} />
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-white/50">
              Pinned by moderators
            </span>
          </div>
        )}

        <div className="p-4 md:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-9 h-9 border border-white/[0.06] flex-shrink-0">
              <AvatarImage src={author?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[11px] bg-white/[0.06] text-white/80">
                {(author?.full_name || '?').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/profile/${author?.username || ''}`}
                  className="text-[13px] font-semibold text-white hover:underline truncate"
                >
                  {author?.full_name || 'Unknown'}
                </Link>
                {author?.is_verified && (
                  <ShieldCheck className="w-3 h-3 text-white/60" strokeWidth={1.75} />
                )}
                <span className="text-[11px] text-white/40">·</span>
                <span className="text-[11px] text-white/45">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
                {post.edited_at && (
                  <span className="text-[10.5px] text-white/35 italic ml-1">edited</span>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full text-white/40 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                  <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 bg-[#0f0f14] border-white/[0.08] text-white"
              >
                {canModerate && (
                  <DropdownMenuItem
                    onSelect={togglePin}
                    className="focus:bg-white/[0.06] cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5 mr-2" strokeWidth={1.75} />
                    {isPinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                )}
                {!isOwn && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      // Prevent Radix from closing before we open the dialog
                      e.preventDefault()
                      setReportOpen(true)
                    }}
                    className="focus:bg-white/[0.06] cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5 mr-2" strokeWidth={1.75} />
                    Report
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    {(canModerate || !isOwn) && <DropdownMenuSeparator className="bg-white/[0.06]" />}
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        setConfirmDelete(true)
                      }}
                      className="focus:bg-white/[0.06] cursor-pointer text-red-300 focus:text-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" strokeWidth={1.75} />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {post.title && (
            <h3 className="text-[15px] font-semibold text-white leading-snug">{post.title}</h3>
          )}
          {post.body && (
            <p className="text-[13.5px] text-white/80 leading-relaxed whitespace-pre-wrap">{post.body}</p>
          )}

          {post.attachments && post.attachments.length > 0 && (
            <div
              className={cn(
                'grid gap-1.5',
                post.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              )}
            >
              {post.attachments.slice(0, 4).map((a: any) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                >
                  {a.url &&
                    (a.attachment_type === 'IMAGE' ||
                      a.attachment_type?.startsWith('image')) && (
                      <img
                        src={a.url}
                        alt={a.caption || ''}
                        className="w-full h-auto object-cover max-h-96"
                      />
                    )}
                </div>
              ))}
            </div>
          )}

          {post.link_url && (
            <a
              href={post.link_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors px-3 py-2 text-[12px] text-white/70 hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="truncate">
                {post.link_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </span>
            </a>
          )}

          {post.poll && <PollWidget poll={post.poll} canVote={!!canPost} />}
        </div>

        <div className="border-t border-white/[0.04] px-4 md:px-5 py-3 flex items-center justify-between">
          <ReactionBar
            targetType="post"
            targetId={post.id}
            myReaction={post.my_reaction || null}
            count={post.reaction_count || 0}
          />
          <button
            onClick={() => setShowComments((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white px-3 py-1 text-[11.5px] font-medium transition-colors"
          >
            <MessageSquare className="w-3 h-3" strokeWidth={1.75} />
            {post.comment_count || 0}
          </button>
        </div>

        {showComments && (
          <div className="border-t border-white/[0.04] px-4 md:px-5 py-4">
            <CommentThread
              targetType="post"
              targetId={post.id}
              canPost={!!canPost}
              currentUserId={currentUserId ?? null}
              canModerate={!!canModerate}
            />
          </div>
        )}
      </article>

      <ControlledReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        communityId={post.community_id}
        targetType="post"
        targetId={post.id}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this post?"
        description={isOwn ? 'This cannot be undone.' : 'You are moderating this post. It will be removed for everyone.'}
        confirmLabel="Delete post"
        destructive
        onConfirm={del}
      />
    </>
  )
}