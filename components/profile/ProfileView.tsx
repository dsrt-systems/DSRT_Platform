'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileHeader } from './ProfileHeader'
import { AboutSection } from './AboutSection'
import { VenturesSection } from './VenturesSection'
import { FeaturedSection } from './FeaturedSection'
import { ProfileTabs } from './ProfileTabs'
import { EducationSection } from './EducationSection'
import { ExperienceSection } from './ExperienceSection'
import { SkillsSection } from './SkillsSection'
import { ProfileCompleteness } from './ProfileCompleteness'
import { TrustBadges } from './TrustBadges'

interface ProfileViewProps {
  profile: any
  education: any[]
  experience: any[]
  skills: any[]
  journeyEvents: any[]
  startupMembers: any[]
  isOwnProfile: boolean
}

export function ProfileView({
  profile,
  education,
  experience,
  skills,
  isOwnProfile,
}: ProfileViewProps) {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [ventures, setVentures] = useState<any[]>([])
  const [featuredItems, setFeaturedItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      
      const [
        { data: intData },
        { data: venturesData },
        { data: featuredData },
      ] = await Promise.all([
        supabase
          .from('user_integrations')
          .select('provider, is_active, provider_username')
          .eq('user_id', profile.id)
          .eq('is_active', true),
        supabase
          .from('ventures')
          .select('*')
          .eq('user_id', profile.id)
          .order('position', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('featured_items')
          .select('*')
          .eq('user_id', profile.id)
          .order('position', { ascending: true })
          .order('created_at', { ascending: false }),
      ])
      
      setIntegrations(intData || [])
      setVentures(venturesData || [])
      setFeaturedItems(featuredData || [])
      setLoading(false)
    }
    load()
  }, [profile.id])

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Trust badges */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TrustBadges 
            profile={profile} 
            integrations={integrations}
          />
        </div>

        {/* Profile completeness (own profile only) */}
        <ProfileCompleteness 
          userId={profile.id} 
          isOwnProfile={isOwnProfile} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* About Section */}
            <AboutSection 
              profile={profile} 
              isOwnProfile={isOwnProfile} 
            />

            {/* Ventures Section */}
            <VenturesSection
              ventures={ventures}
              userId={profile.id}
              isOwnProfile={isOwnProfile}
              onUpdate={setVentures}
            />

            {/* Featured Section */}
            <FeaturedSection
              items={featuredItems}
              userId={profile.id}
              isOwnProfile={isOwnProfile}
              onUpdate={setFeaturedItems}
            />

            {/* Posts | Replies | Updates | Docs */}
            <ProfileTabs 
              userId={profile.id}
              isOwnProfile={isOwnProfile}
              currentUser={profile}
            />

            {/* Experience */}
            <ExperienceSection
              experience={experience}
              userId={profile.id}
              isOwnProfile={isOwnProfile}
            />

            {/* Education */}
            <EducationSection
              education={education}
              userId={profile.id}
              isOwnProfile={isOwnProfile}
            />
          </div>

          <div className="space-y-4">
            {/* Skills */}
            <SkillsSection
              skills={skills}
              userId={profile.id}
              isOwnProfile={isOwnProfile}
            />

            {/* Integrations */}
            {integrations.length > 0 && (
              <div className="bg-card border rounded-2xl p-4 space-y-3">
                <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground">
                  Connected Accounts
                </h3>
                <div className="space-y-2">
                  {integrations.map((int: any) => (
                    <div key={int.provider} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase">{int.provider[0]}</span>
                      </div>
                      <span className="font-medium capitalize">{int.provider}</span>
                      {int.provider_username && (
                        <span className="text-xs text-muted-foreground truncate">
                          @{int.provider_username}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}