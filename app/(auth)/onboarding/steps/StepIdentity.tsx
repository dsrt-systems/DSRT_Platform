'use client'

import { useState, useEffect } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { LocationAutocomplete } from '@/components/auth/LocationAutocomplete'
import { cn } from '@/lib/utils'

export function StepIdentity() {
  const supabase = createClient()
  const { data, updateData, nextStep } = useOnboardingStore()

  const [fullName, setFullName] = useState(data.full_name || '')
  const [tagline, setTagline] = useState(data.tagline || '')
  const [location, setLocation] = useState(data.location || '')
  const [username, setUsername] = useState(data.username || '')

  useEffect(() => {
    const loadExistingData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, username, tagline, location')
          .eq('id', user.id)
          .single()

        if (profile) {
          if (!fullName) setFullName(profile.full_name || '')
          if (!username) setUsername(profile.username || '')
          if (!tagline) setTagline(profile.tagline || '')
          if (!location) setLocation(profile.location || '')
        }
      }
    }
    loadExistingData()
  }, [])

  const handleNext = async () => {
    if (!fullName.trim() || fullName.length < 2) return

    updateData({
      full_name: fullName.trim(),
      tagline: tagline.trim(),
      location: location.trim(),
    })
    nextStep()
  }

  const canProceed = fullName.length >= 2

  return (
    <div className="space-y-6">
      
      {/* Full Name */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-white/90">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Alex Rivera"
          className="w-full h-10 px-3 rounded-md bg-[#050505] border border-white/10 text-white text-[13px] placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-all"
        />
        <p className="text-[11px] text-white/40">This appears on your public profile.</p>
      </div>

      {/* Username (Read-only representation of the claim step) */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-white/90">
          Username <span className="text-red-400">*</span>
        </label>
        <div className="w-full h-10 px-3 rounded-md bg-[#050505]/50 border border-white/5 text-white/50 text-[13px] flex items-center font-mono cursor-not-allowed">
          <span className="text-white/30 mr-1">dsrtai.com/</span>{username || 'username'}
        </div>
        <p className="text-[11px] text-white/40">Your username is permanently claimed.</p>
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-white/90">
          Tagline
        </label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="One line that describes what you do or believe in"
          maxLength={100}
          className="w-full h-10 px-3 rounded-md bg-[#050505] border border-white/10 text-white text-[13px] placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-all"
        />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-white/40">Great taglines are short, bold, and specific.</p>
          <p className="text-[11px] text-white/40 font-mono">{tagline.length}/100</p>
        </div>
      </div>

      {/* Location Component */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-white/90">
          Location
        </label>
        <LocationAutocomplete value={location} onChange={setLocation} />
        <p className="text-[11px] text-white/40">Helps you match with nearby builders and local events.</p>
      </div>

      {/* Action Button */}
      <div className="pt-4 flex justify-start">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={cn(
            "h-9 px-6 rounded-md flex items-center justify-center transition-colors",
            "bg-white text-black text-[13px] font-semibold hover:bg-white/90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </div>
  )
}