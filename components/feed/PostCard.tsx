'use client'
import { PostComments } from './PostComments'
import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Rocket,
  Lightbulb,
  Code2,
  Trophy,
  FileText,
  MessageSquare,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface PostCardProps {
  post: any
  currentUser: any
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  idea: { label: 'Idea', icon: Lightbulb, color: 'text-amber-500' },
  build_log: { label: 'Build Log', icon: Code2, color: 'text-emerald-500' },
  milestone: { label: 'Milestone', icon: Trophy, color: 'text-yellow-500' },
  launch: { label: 'Launch', icon: Rocket, color: 'text-orange-500' },
  looking_for: { label: 'Looking For', icon: FileText, color: 'text-blue-500' },
  discussion: { label: 'Discussion', icon: MessageSquare, color: 'text-purple-500' },
  update: { label: 'Update', icon: MessageSquare, color: 'text-muted-foreground' },
}

export function PostCard({ post, currentUser }: PostCardProps) {
  const supabase = createClient()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)
  const [showComments, setShowComments] = useState(false)

  const config = typeConfig[post.type] || typeConfig.update
  const Icon = config.icon

  const handleLike = async () => {
    if (liked) {
      setLiked(false)
      setLikeCount((c: number) => c - 1)
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id)
    } else {
      setLiked(true)
      setLikeCount((c: number) => c + 1)
      await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: currentUser.id })
    }
  }

  return (
    <article className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.users?.username}`}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.users?.avatar_url} />
            <AvatarFallback className="text-xs">
              {post.users?.full_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${post.users?.username}`}
            className="font-semibold text-sm hover:underline"
          >
            {post.users?.full_name}
          </Link>
          {post.users?.tagline && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {post.users.tagline}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <span>
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </span>
            <span>•</span>
            <span className={`flex items-center gap-1 ${config.color}`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm whitespace-pre-wrap leading-relaxed">
        {post.content}
      </p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag: string) => (
            <span
              key={tag}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <button
          type="button"
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:bg-muted/40 transition-colors',
            liked && 'text-rose-500'
          )}
        >
          <Heart className={cn('w-4 h-4', liked && 'fill-current')} />
          <span>{likeCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:bg-muted/40 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.comment_count || 0}</span>
        </button>

        {post.type === 'looking_for' && (
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:bg-muted/40 transition-colors text-primary"
          >
            <Rocket className="w-4 h-4" />
            <span>Join</span>
          </button>
        )}

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:bg-muted/40 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:bg-muted/40 transition-colors"
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>
      {showComments && (
        <PostComments postId={post.id} currentUser={currentUser} />
      )}
    </article>
  )
}