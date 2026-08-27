'use client'

import { useState, useEffect } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowRight } from 'lucide-react'
import { LocationAutocomplete } from '@/components/auth/LocationAutocomplete'
import { cn } from '@/lib/utils'

export function StepIdentity() {
  const supabase = createClient()
  const { data, updateData, nextStep } = useOnboardingStore()

  const [fullName, setFullName] = useState(data.full_name || '')
  const [tagline, setTagline] = useState(data.tagline || '')
  const [location, setLocation] = useState(data.location || '')
  
  // Username is now claimed BEFORE onboarding, but we fetch it to display
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
        <label className="text-[13px] font-semibold text-white/90 tracking-wide uppercase">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Alex Rivera"
          className="w-full h-11 px-4 rounded-xl bg-[#0F1420]/50 border border-white/10 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:bg-[#0F1420] focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-all"
        />
        <p className="text-[11px] text-white/40 pt-1">This is the name that will appear on your public profile.</p>
      </div>

      {/* Display Only Username (Since it's claimed before onboarding now) */}
      <div className="space-y-2 opacity-70">
        <label className="text-[13px] font-semibold text-white/90 tracking-wide uppercase">
          DSRT Username
        </label>
        <div className="w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/5 text-white/60 text-[14px] flex items-center cursor-not-allowed font-mono">
          dsrtai.com/@{username || 'username'}
        </div>
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-white/90 tracking-wide uppercase">
          Headline
        </label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. Building AI tools for creators"
          maxLength={100}
          className="w-full h-11 px-4 rounded-xl bg-[#0F1420]/50 border border-white/10 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:bg-[#0F1420] focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-all"
        />
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-white/40">A short, punchy summary of what you do.</p>
          <p className="text-[11px] text-white/40 font-mono">{tagline.length}/100</p>
        </div>
      </div>

      {/* Advanced Global Location */}
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-white/90 tracking-wide uppercase">
          Location
        </label>
        <LocationAutocomplete value={location} onChange={setLocation} />
        <p className="text-[11px] text-white/40 pt-1">Helps you match with nearby builders, local events, and region-specific opportunities.</p>
      </div>

      <div className="pt-6">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={cn(
            "w-full h-12 rounded-xl flex items-center justify-center gap-2 transition-all duration-300",
            "bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[15px] font-bold shadow-[0_4px_20px_rgba(79,124,255,0.3)]",
            "disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
          )}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}