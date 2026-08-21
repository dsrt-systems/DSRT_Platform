'use client'

import { useState } from 'react'
import { AvatarSection } from './AvatarSection'
import { NameSection } from './NameSection'
import { TaglineSection } from './TaglineSection'
import { TagsSection } from './TagsSection'
import { LocationSection } from './LocationSection'
import { FollowStatsSection } from './FollowStatsSection'
import { SocialLinksSection } from './SocialLinksSection'
import { EducationSection } from './EducationSection'
import { CertificationsSection } from './CertificationsSection'
import { ProfileActions } from './ProfileActions'
import { ProfileCard } from '../shared/ProfileCard'

interface LeftPanelProps {
  profile: any
  isOwner: boolean
  currentUserId: string | null
  followerCount: number
  followingCount: number
  isFollowing: boolean
  onProfileUpdate: (updates: Partial<any>) => void
  onFollowChange: (isFollowing: boolean, followerCount: number, followingCount: number) => void
}

export function LeftPanel({
  profile: initialProfile,
  isOwner,
  currentUserId,
  followerCount,
  followingCount,
  isFollowing,
  onProfileUpdate,
  onFollowChange,
}: LeftPanelProps) {
  const [profile, setProfile] = useState(initialProfile)

  const patch = (updates: Partial<any>) => {
    setProfile((p: any) => ({ ...p, ...updates }))
    onProfileUpdate(updates)
  }

  return (
    <div className="space-y-4">
      {/* Identity Card — NO duplicate banner inside! */}
      <ProfileCard>
        {/* Top Row: Avatar on left (pulled up to overlap top page banner), Actions on right */}
        <div className="flex items-start justify-between mb-4">
          <div className="-mt-16 sm:-mt-20 relative z-10">
            <AvatarSection
              avatarUrl={profile.avatar_url}
              fullName={profile.full_name || ''}
              isVerified={profile.is_verified || false}
              isOwner={isOwner}
              onAvatarChange={(url) => patch({ avatar_url: url })}
            />
          </div>

          {/* Action buttons sit in the top-right gap of the identity card */}
          {!isOwner && currentUserId && (
            <div className="pt-2 relative z-10">
              <ProfileActions
                userId={profile.id}
                fullName={profile.full_name || 'Builder'}
                isFollowingInitial={isFollowing}
                onFollowChange={onFollowChange}
              />
            </div>
          )}
        </div>

        <NameSection
          fullName={profile.full_name || ''}
          username={profile.username || ''}
          isVerified={profile.is_verified || false}
          isOwner={isOwner}
          onNameChange={(name) => patch({ full_name: name })}
        />

        <div className="mt-4">
          <TaglineSection
            taglinePlain={profile.tagline}
            taglineHtml={profile.tagline_html}
            isOwner={isOwner}
            onTaglineChange={(plain, html) => patch({ tagline: plain, tagline_html: html })}
          />
        </div>

        <div className="mt-4">
          <TagsSection
            tags={profile.profile_tags || []}
            isOwner={isOwner}
            onTagsChange={(tags) => patch({ profile_tags: tags })}
          />
        </div>

        <div className="mt-4">
          <LocationSection
            location={profile.location}
            isOwner={isOwner}
            onLocationChange={(loc) => patch({ location: loc })}
          />
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-800/60">
          <FollowStatsSection
            username={profile.username || ''}
            followerCount={followerCount}
            followingCount={followingCount}
          />
        </div>
      </ProfileCard>

      <SocialLinksSection profile={profile} isOwner={isOwner} onSocialChange={patch} />
      <EducationSection userId={profile.id} isOwner={isOwner} />
      <CertificationsSection userId={profile.id} isOwner={isOwner} />
    </div>
  )
}