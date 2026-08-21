'use client'

import { useState, Suspense } from 'react'
import { BannerSection } from './left-panel/BannerSection'
import { LeftPanel } from './left-panel/LeftPanel'
import { RightPanel } from './right-panel/RightPanel'

interface ProfileV3PageProps {
  profile: any
  isOwner: boolean
  currentUserId: string | null
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

export function ProfileV3Page(props: ProfileV3PageProps) {
  const [profile, setProfile] = useState(props.profile)
  const [followerCount, setFollowerCount] = useState(props.followerCount)
  const [followingCount, setFollowingCount] = useState(props.followingCount)
  const [isFollowing, setIsFollowing] = useState(props.isFollowing)

  const handleProfileUpdate = (updates: Partial<any>) => {
    setProfile((p: any) => ({ ...p, ...updates }))
  }

  const handleFollowChange = (following: boolean, followers: number, followingC: number) => {
    setIsFollowing(following)
    setFollowerCount(followers)
    setFollowingCount(followingC)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* The ONE and ONLY full-width banner at the top of the entire page */}
      <BannerSection
        bannerUrl={profile.cover_url || profile.banner_url}
        isOwner={props.isOwner}
        onBannerChange={(url) => handleProfileUpdate({ cover_url: url })}
      />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-5">
          <aside className="lg:w-[35%] w-full flex-shrink-0">
            <LeftPanel
              profile={profile}
              isOwner={props.isOwner}
              currentUserId={props.currentUserId}
              followerCount={followerCount}
              followingCount={followingCount}
              isFollowing={isFollowing}
              onProfileUpdate={handleProfileUpdate}
              onFollowChange={handleFollowChange}
            />
          </aside>

          <main className="lg:w-[65%] w-full min-w-0">
            <Suspense fallback={<RightPanelSkeleton />}>
              <RightPanel
                profile={profile}
                isOwner={props.isOwner}
                currentUserId={props.currentUserId}
                onProfileUpdate={handleProfileUpdate}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}

function RightPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 border-b border-zinc-800/60 animate-pulse" />
      <div className="h-64 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl animate-pulse" />
    </div>
  )
}