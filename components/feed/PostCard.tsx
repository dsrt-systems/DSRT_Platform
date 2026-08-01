'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MessageCircle, Bookmark, Share2, MoreVertical, Sparkles, Trophy, Lightbulb, UserPlus, HandHeart, HelpCircle, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  update: { icon: Sparkles, color: 'text-blue-500 bg-blue-500/10', label: 'Update' },
  milestone: { icon: Trophy, color: 'text-yellow-500 bg-yellow-500/10', label: 'Milestone' },
  idea: { icon: Lightbulb, color: 'text-purple-500 bg-purple-500/10', label: 'Idea' },
  looking_for: { icon: UserPlus, color: 'text-green-500 bg-green-500/10', label: 'Looking For' },
  i_have: { icon: HandHeart, color: 'text-pink-500 bg-pink-500/10', label: 'I Have' },
  question: { icon: HelpCircle, color: 'text-orange-500 bg-orange-500/10', label: 'Question' },
}

export function PostCard({ post, currentUser, onUpdate, onDelete }: any) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked || false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmark_count || 0)

  const supabase = createClient()
  const config = typeConfig[post.type] || typeConfig.update
  const Icon = config.icon
  const user = post.users
  const isOwnPost = currentUser?.id === post.user_id

  const handleLike = async () => {
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikeCount((prev: number) => newLiked ? prev + 1 : prev - 1)

    if (newLiked) {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: currentUser.id })
      
      if (error) {
        setIsLiked(false)
        setLikeCount((prev: number) => prev - 1)
        toast.error('Failed to like')
      }
    } else {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id)
    }
  }

  const handleBookmark = async () => {
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)
    setBookmarkCount((prev: number) => newBookmarked ? prev + 1 : prev - 1)

    if (newBookmarked) {
      await supabase
        .from('post_bookmarks')
        .insert({ post_id: post.id, user_id: currentUser.id })
      toast.success('Bookmarked')
    } else {
      await supabase
        .from('post_bookmarks')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${post.id}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copied')
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    
    await supabase.from('posts').delete().eq('id', post.id)
    onDelete?.(post.id)
    toast.success('Post deleted')
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        <Link href={`/profile/${user?.username}`}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback>
              {user?.full_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link 
              href={`/profile/${user?.username}`}
              className="font-semibold text-sm hover:underline"
            >
              {user?.full_name}
            </Link>
            <span className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
              config.color
            )}>
              <Icon className="w-2.5 h-2.5" />
              {config.label}
            </span>
          </div>
          {user?.tagline && (
            <p className="text-xs text-muted-foreground truncate">{user.tagline}</p>
          )}
          <p className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>

        {isOwnPost && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-muted rounded transition-colors">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs text-blue-500 hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 pt-2 border-t">
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            isLiked ? 'text-red-500 bg-red-500/10' : 'hover:bg-muted'
          )}
        >
          <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
          {likeCount > 0 && likeCount}
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted transition-colors">
          <MessageCircle className="w-4 h-4" />
          {post.comment_count > 0 && post.comment_count}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleBookmark}
          className={cn(
            'ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            isBookmarked ? 'text-yellow-500 bg-yellow-500/10' : 'hover:bg-muted'
          )}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
        </button>
      </div>
    </motion.article>
  )
}