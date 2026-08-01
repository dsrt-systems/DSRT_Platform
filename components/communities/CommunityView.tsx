'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, MessageSquare, Calendar, Info } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { JoinButton } from './JoinButton'
import { PostComposer } from '@/components/feed/PostComposer'
import { PostCard } from '@/components/feed/PostCard'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'

const colorMap: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  green: 'from-green-500 to-emerald-600',
  orange: 'from-orange-500 to-red-500',
  pink: 'from-pink-500 to-rose-500',
  red: 'from-red-500 to-red-600',
  cyan: 'from-cyan-500 to-blue-500',
  yellow: 'from-yellow-500 to-orange-500',
  gray: 'from-gray-500 to-gray-600',
}

const tabs = [
  { id: 'posts', label: 'Posts', icon: MessageSquare },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'about', label: 'About', icon: Info },
]

interface CommunityViewProps {
  community: any
  members: any[]
  posts: any[]
  events: any[]
  isJoined: boolean
  currentUser: any
}

export function CommunityView({
  community,
  members,
  posts: initialPosts,
  events,
  isJoined: initialJoined,
  currentUser,
}: CommunityViewProps) {
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [isJoined, setIsJoined] = useState(initialJoined)
  const [memberCount, setMemberCount] = useState<number>(community.member_count || 0)

  const color = colorMap[community.icon_color] || colorMap.blue

  const handleNewPost = (post: any) => {
    setPosts((prev: any[]) => [
      {
        ...post,
        users: {
          id: currentUser.id,
          full_name: currentUser.full_name,
          username: currentUser.username,
          avatar_url: currentUser.avatar_url,
          tagline: currentUser.tagline,
          brings: currentUser.brings,
        },
        is_liked: false,
        is_bookmarked: false,
      },
      ...prev,
    ])
  }

  const handleUpdatePost = (updatedPost: any) => {
    setPosts((prev: any[]) =>
      prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
    )
  }

  const handleDeletePost = (id: string) => {
    setPosts((prev: any[]) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={cn('h-48 bg-gradient-to-br relative', color)}>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="relative -mt-16 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-end gap-4">
              <div
                className={cn(
                  'w-24 h-24 rounded-2xl bg-gradient-to-br flex items-center justify-center border-4 border-background shadow-2xl',
                  color
                )}
              >
                <span className="text-3xl text-white font-bold">
                  {community.name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {community.name}
                  </h1>
                  {community.is_verified && (
                    <span className="text-blue-500 text-xl">✓</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {community.type} community · {community.category || 'General'}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {memberCount.toLocaleString()} members
                  </span>
                  <span>·</span>
                  <span>
                    {community.post_count?.toLocaleString() || 0} posts
                  </span>
                </div>
              </div>
            </div>

            <JoinButton
              communityId={community.id}
              initialJoined={isJoined}
              onChange={(joined) => {
                setIsJoined(joined)
                setMemberCount((prev: number) =>
                  joined ? prev + 1 : Math.max(0, prev - 1)
                )
              }}
            />
          </div>

          {community.description && (
            <p className="mt-4 text-sm max-w-3xl">{community.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b sticky top-14 bg-background/95 backdrop-blur z-30">
          <div className="flex overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    tab === t.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          <div className="lg:col-span-2 space-y-4">
            {tab === 'posts' && (
              <>
                {isJoined ? (
                  <PostComposer
                    currentUser={currentUser}
                    onPost={handleNewPost}
                  />
                ) : (
                  <div className="bg-card border rounded-2xl p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Join this community to post
                    </p>
                  </div>
                )}
                {posts.length === 0 ? (
                  <div className="bg-card border rounded-2xl p-12 text-center">
                    <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No posts yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Be the first to share something
                    </p>
                  </div>
                ) : (
                  posts.map((post: any) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onUpdate={handleUpdatePost}
                      onDelete={handleDeletePost}
                    />
                  ))
                )}
              </>
            )}

            {tab === 'members' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {members.map((m: any) => (
                  <div
                    key={m.user_id}
                    className="bg-card border rounded-xl p-4 flex items-center gap-3"
                  >
                    <Link href={`/profile/${m.users?.username}`}>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={m.users?.avatar_url} />
                        <AvatarFallback>
                          {m.users?.full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${m.users?.username}`}
                        className="font-semibold text-sm hover:underline block truncate"
                      >
                        {m.users?.full_name}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">
                        @{m.users?.username}
                      </p>
                      {m.role === 'admin' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-md font-bold uppercase tracking-wider mt-1 inline-block">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'events' && (
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="bg-card border rounded-2xl p-12 text-center">
                    <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No upcoming events
                    </p>
                  </div>
                ) : (
                  events.map((event: any) => (
                    <div
                      key={event.id}
                      className="bg-card border rounded-xl p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-center flex-shrink-0">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                            {format(new Date(event.start_time), 'MMM')}
                          </p>
                          <p className="text-3xl font-bold">
                            {format(new Date(event.start_time), 'd')}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm">{event.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(event.start_time), 'EEEE, h:mm a')}
                            {' · '}
                            {event.location || 'Online'}
                          </p>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'about' && (
              <div className="bg-card border rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-sm mb-2">
                    About this community
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {community.description || 'No description provided.'}
                  </p>
                </div>
                {community.rules && (
                  <div>
                    <h3 className="font-bold text-sm mb-2">Rules</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {community.rules}
                    </p>
                  </div>
                )}
                <div className="pt-3 border-t space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">
                      {community.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{community.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(community.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="bg-card border rounded-xl p-4">
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground mb-3">
                Recent Members
              </h3>
              <div className="space-y-2">
                {members.slice(0, 5).map((m: any) => (
                  <Link
                    key={m.user_id}
                    href={`/profile/${m.users?.username}`}
                    className="flex items-center gap-2 hover:bg-muted/50 p-1 rounded-lg transition-colors"
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={m.users?.avatar_url} />
                      <AvatarFallback className="text-[10px]">
                        {m.users?.full_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate">
                      {m.users?.full_name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {events.length > 0 && (
              <div className="bg-card border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold">
                    Upcoming Events
                  </h3>
                </div>
                <div className="space-y-2">
                  {events.slice(0, 3).map((event: any) => (
                    <div key={event.id} className="text-xs">
                      <p className="font-semibold line-clamp-1">
                        {event.title}
                      </p>
                      <p className="text-muted-foreground text-[10px] mt-0.5">
                        {formatDistanceToNow(new Date(event.start_time), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}