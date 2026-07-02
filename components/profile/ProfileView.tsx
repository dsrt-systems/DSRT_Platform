'use client'

import { ProfileHeader } from './ProfileHeader'
import { JourneyTimeline } from './JourneyTimeline'
import { BioSection } from './BioSection'
import { EducationSection } from './EducationSection'
import { ExperienceSection } from './ExperienceSection'
import { SkillsSection } from './SkillsSection'
import { VenturesSection } from './VenturesSection'

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
  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <JourneyTimeline
          events={journeyEvents}
          userId={profile.id}
          editable={isOwnProfile}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          </div>
        </div>
      </div>
    </div>
  )
}