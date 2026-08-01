'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  MapPin,
  Link as LinkIcon,
  Github,
  Twitter,
  Linkedin,
  Camera,
  Edit3,
  MessageCircle,
  Eye,
} from 'lucide-react'
import { EditProfileModal } from './EditProfileModal'
import { UploadImageModal } from './UploadImageModal'
import { FollowButton } from '@/components/follow/FollowButton'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface ProfileHeaderProps {
  profile: any
  isOwnProfile: boolean
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [coverOpen, setCoverOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(profile.follower_count || 0)
  const [followingCount, setFollowingCount] = useState(profile.following_count || 0)

  useEffect(() => {
    if (isOwnProfile) return
    
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if following
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_type', 'user')
        .eq('following_id', profile.id)
        .single()

      setIsFollowing(!!data)

      // Log profile view
      await supabase.rpc('log_profile_view', {
        p_profile_id: profile.id,
        p_viewer_id: user.id,
      })
    }
    check()
  }, [profile.id, isOwnProfile])

  const handleFollowChange = (following: boolean) => {
    setIsFollowing(following)
    setFollowerCount((prev: number) => following ? prev + 1 : Math.max(0, prev - 1))
  }

  return (
    <>
      <div className="relative">
        {/* Cover image */}
        <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden group">
          {profile.cover_url && (
            <img
              src={profile.cover_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          {isOwnProfile && (
            <button
              onClick={() => setCoverOpen(true)}
              className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg border opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-4">
          <div className="relative -mt-16 md:-mt-20 pb-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="relative inline-block">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background bg-background">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-3xl">
                    {profile.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <button
                    onClick={() => setAvatarOpen(true)}
                    className="absolute bottom-2 right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 md:mb-4">
                {isOwnProfile ? (
                  <Button onClick={() => setEditOpen(true)} variant="outline">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/messages/conversation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ otherUserId: profile.id }),
                          })
                          const data = await res.json()
                          if (data.conversationId) {
                            window.location.href = `/messages/${data.conversationId}`
                          }
                        } catch (err) {
                          console.error(err)
                        }
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                       Message
                    </Button>
                    <FollowButton
                      targetId={profile.id}
                      initialFollowing={isFollowing}
                      onFollowChange={handleFollowChange}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {profile.full_name}
                </h1>
                {profile.is_verified && (
                  <span className="text-primary text-lg">✓</span>
                )}
              </div>

              <p className="text-muted-foreground">@{profile.username}</p>

              {profile.tagline && (
                <p className="text-base md:text-lg mt-2">{profile.tagline}</p>
              )}

              {profile.brings && profile.brings.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.brings.map((b: string) => (
                    <span
                      key={b}
                      className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full capitalize"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mt-3">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.location}
                  </span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <LinkIcon className="w-3.5 h-3.5" />
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <Github className="w-3.5 h-3.5" />
                    GitHub
                  </a>
                )}
                {profile.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <Twitter className="w-3.5 h-3.5" />
                    Twitter
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                  </a>
                )}
              </div>

              {/* Follower / Following / Views stats */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm">
                <Link 
                  href={`/profile/${profile.username}/followers`}
                  className="hover:text-primary transition-colors"
                >
                  <span className="font-bold">{followerCount}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </Link>
                <Link 
                  href={`/profile/${profile.username}/following`}
                  className="hover:text-primary transition-colors"
                >
                  <span className="font-bold">{followingCount}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </Link>
                <div>
                  <span className="font-bold">{profile.post_count || 0}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
                <div>
                  <span className="font-bold">{profile.execution_score || 0}</span>
                  <span className="text-muted-foreground ml-1">Score</span>
                </div>
                {isOwnProfile && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{profile.profile_views || 0} views</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
      />

      <UploadImageModal
        open={avatarOpen}
        onOpenChange={setAvatarOpen}
        type="avatar"
        userId={profile.id}
        currentUrl={profile.avatar_url}
      />

      <UploadImageModal
        open={coverOpen}
        onOpenChange={setCoverOpen}
        type="cover"
        userId={profile.id}
        currentUrl={profile.cover_url}
      />
    </>
  )
}