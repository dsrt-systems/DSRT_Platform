'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  BookmarkSimple, Users, Article, X, MagnifyingGlass, ArrowRight,
  Check, Heart, ChatCircle,
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'

export function SavedPage({ currentUser }: any) {
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'communities' | 'posts'>('communities')
  const [communities, setCommunities] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/saved')
    const data = await res.json()
    setCommunities(data.communities || [])
    setPosts(data.posts || [])
    setLoading(false)
  }

  const removeSavedCommunity = async (id: string) => {
    setCommunities(prev => prev.filter(c => c.id !== id))
    await fetch(`/api/discover/save?community_id=${id}`, { method: 'DELETE' })
    toast.success('Removed from saved')
  }

  const removeSavedPost = async (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
    await supabase.from('post_bookmarks').delete().eq('post_id', id).eq('user_id', currentUser.id)
    toast.success('Removed from saved')
  }

  const filteredCommunities = search
    ? communities.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    : communities

  const filteredPosts = search
    ? posts.filter(p => (p.title || p.content)?.toLowerCase().includes(search.toLowerCase()))
    : posts

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <BookmarkSimple className="w-5 h-5 text-yellow-500" weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Saved</h1>
            <p className="text-sm text-muted-foreground">Communities and posts you bookmarked</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card border rounded-2xl px-4 py-2.5 flex items-center gap-2">
        <MagnifyingGlass className="w-4 h-4 text-muted-foreground flex-shrink-0" weight="bold" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your saved items..."
          className="flex-1 bg-transparent border-0 focus:outline-none text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')}>
            <X className="w-4 h-4 text-muted-foreground" weight="bold" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto scrollbar-hide">
        {[
          { id: 'communities', label: 'Communities', count: communities.length, icon: Users },
          { id: 'posts', label: 'Posts', count: posts.length, icon: Article },
        ].map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" weight={isActive ? 'fill' : 'regular'} />
              {t.label}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-muted/30 rounded-2xl animate-pulse" />)}
        </div>
      ) : activeTab === 'communities' ? (
        filteredCommunities.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No saved communities"
            desc="Save communities from the Discover page to see them here"
            actionHref="/community"
            actionLabel="Discover Communities"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCommunities.map((c, i) => (
              <SavedCommunityCard key={c.id} community={c} index={i} onRemove={() => removeSavedCommunity(c.id)} />
            ))}
          </div>
        )
      ) : (
        filteredPosts.length === 0 ? (
          <EmptyState
            icon={Article}
            title="No saved posts"
            desc="Bookmark posts from your feed to save them for later"
            actionHref="/feed"
            actionLabel="Go to Feed"
          />
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((p, i) => (
              <SavedPostCard key={p.id} post={p} index={i} onRemove={() => removeSavedPost(p.id)} />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function SavedCommunityCard({ community, index, onRemove }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-card border rounded-2xl overflow-hidden hover:border-primary/40 transition-all group relative"
    >
      <div
        className="h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
        style={community.cover_url ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover' } : undefined}
      />
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
        title="Remove from saved"
      >
        <X className="w-3.5 h-3.5 text-white" weight="bold" />
      </button>
      <div className="p-4 -mt-8 relative">
        <Link href={`/community/${community.slug}`}>
          <div className="w-12 h-12 rounded-xl bg-white border-4 border-background shadow-md flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-blue-500" weight="fill" />
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Link href={`/community/${community.slug}`} className="text-sm font-bold truncate hover:underline">
            {community.name}
          </Link>
          {community.is_verified && <Check className="w-3.5 h-3.5 text-blue-500" weight="bold" />}
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{community.description}</p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] text-muted-foreground">
            {community.member_count?.toLocaleString() || 0} members
          </p>
          <p className="text-[10px] text-muted-foreground">
            Saved {formatDistanceToNow(new Date(community.saved_at), { addSuffix: false })} ago
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function SavedPostCard({ post, index, onRemove }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-card border rounded-2xl p-4 hover:border-primary/40 transition-all group relative"
    >
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.users?.username}`}>
          <Avatar className="w-9 h-9">
            <AvatarImage src={post.users?.avatar_url} />
            <AvatarFallback className="text-xs">{post.users?.full_name?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold">{post.users?.full_name}</span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })} ago
            </span>
          </div>
          <Link href={`/pulse/${post.id}`}>
            {post.title && <p className="text-sm font-bold mb-1 hover:underline">{post.title}</p>}
            <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
          </Link>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.like_count || 0}</span>
            <span className="flex items-center gap-1"><ChatCircle className="w-3 h-3" /> {post.comment_count || 0}</span>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
          title="Remove from saved"
        >
          <BookmarkSimple className="w-4 h-4" weight="fill" />
        </button>
      </div>
    </motion.div>
  )
}

function EmptyState({ icon: Icon, title, desc, actionHref, actionLabel }: any) {
  return (
    <div className="bg-card border rounded-2xl p-12 text-center">
      <Icon className="w-14 h-14 mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      <Link href={actionHref}>
        <Button variant="outline" size="sm" className="mt-4">{actionLabel}</Button>
      </Link>
    </div>
  )
}