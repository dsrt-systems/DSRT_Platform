'use client'

import { ProfileHeader } from './ProfileHeader'
import { JourneyTimeline } from './JourneyTimeline'
import { BioSection } from './BioSection'
import { EducationSection } from './EducationSection'
import { ExperienceSection } from './ExperienceSection'
import { SkillsSection } from './SkillsSection'
import { VenturesSection } from './VenturesSection'
import { ProfileCompleteness } from './ProfileCompleteness'
import { TrustBadges } from './TrustBadges'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  journeyEvents,
  startupMembers,
  isOwnProfile,
}: ProfileViewProps) {
  const [integrations, setIntegrations] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('user_integrations')
        .select('provider, is_active, provider_username')
        .eq('user_id', profile.id)
        .eq('is_active', true)
      
      setIntegrations(data || [])
    }
    load()
  }, [profile.id])

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Trust badges */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TrustBadges 
            profile={profile} 
            integrations={integrations}
          />
        </div>

        {/* Profile completeness (only for own profile) */}
        <ProfileCompleteness 
          userId={profile.id} 
          isOwnProfile={isOwnProfile} 
        />

        <JourneyTimeline
          events={journeyEvents}
          userId={profile.id}
          editable={isOwnProfile}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BioSection profile={profile} isOwnProfile={isOwnProfile} />
            <VenturesSection
              startupMembers={startupMembers}
              userId={profile.id}
              isOwnProfile={isOwnProfile}
            />
            <ExperienceSection
              experience={experience}
              userId={profile.id}
              isOwnProfile={isOwnProfile}
            />
            <EducationSection
              education={education}
              userId={profile.id}
              isOwnProfile={isOwnProfile}
            />
          </div>

          <div className="space-y-6">
            <SkillsSection
              skills={skills}
              userId={profile.id}
              isOwnProfile={isOwnProfile}
            />

            {/* Integrations Panel */}
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
                        <span className="text-xs text-muted-foreground">
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