'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, X, User } from 'lucide-react'
import { useOnboardingV2Store } from '@/stores/onboardingV2Store'
import { LocationAutocomplete, type LocationData } from '@/components/primitives/LocationAutocomplete'
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export function ProfileStep() {
  const { 
    data, 
    updateData, 
    isSaving, 
    setSaving, 
    setCurrentStep, 
    setStepStates, 
    setOnboardingState,
    step_states
  } = useOnboardingV2Store()
  
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local state
  const [displayName, setDisplayName] = useState(data.display_name || '')
  const [locationData, setLocationData] = useState<LocationData | null>(data.location_data)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(data.avatar_url)
  const [avatarStatus, setAvatarStatus] = useState(data.avatar_status)
  const [uploading, setUploading] = useState(false)

  // Initialize display name from session metadata if missing
  useEffect(() => {
    if (!displayName) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.user_metadata?.full_name) {
          setDisplayName(user.user_metadata.full_name)
        }
      })
    }
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      // Basic validation
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file')
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`

      // Upload to 'avatars' bucket (established in Phase 1 SQL)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setAvatarStatus('UPLOADED')
      toast.success('Profile photo uploaded')

    } catch (err: any) {
      toast.error(err.message || 'Error uploading image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = () => {
    setAvatarUrl(null)
    setAvatarStatus('NOT_SET')
  }

  const handleSave = async (isSkipping: boolean = false) => {
    if (!isSkipping && (!displayName || displayName.trim().length < 2)) {
      toast.error('Display name must be at least 2 characters')
      return
    }

    setSaving(true)
    
    // Determine the status we are reporting to the backend
    const finalAvatarStatus = isSkipping && !avatarUrl ? 'SKIPPED' : avatarStatus

    try {
      const res = await fetch('/api/onboarding/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'profile',
          status: 'COMPLETED',
          data: {
            display_name: displayName.trim(),
            location_data: locationData,
            avatar_url: avatarUrl,
            avatar_status: finalAvatarStatus
          }
        })
      })

      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData.error || 'Failed to save progress')

      // Update global store
      updateData({
        display_name: displayName.trim(),
        location_data: locationData,
        avatar_url: avatarUrl,
        avatar_status: finalAvatarStatus
      })
      
      setStepStates(responseData.step_states)
      setOnboardingState(responseData.onboarding_state)
      setCurrentStep('professional')

    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      
      {/* 1. Profile Photo */}
      <div>
        <label className="text-[13px] font-medium text-white/90 mb-3 block">
          Profile Photo
        </label>
        
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <Image 
                src={avatarUrl} 
                alt="Profile" 
                fill 
                className="object-cover"
                unoptimized // Since it's a direct Supabase storage URL
              />
            ) : (
              <User className="w-8 h-8 text-white/20" weight="fill" />
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/jpeg,image/png,image/webp" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-8 px-3 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[12px] font-medium transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload image
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                  className="h-8 px-3 rounded-md text-[12px] font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-white/40">
              Recommended: 400x400px. JPG, PNG or WebP. Max 5MB.
            </p>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-white/[0.04]" />

      {/* 2. Display Name */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-white/90">
          Display Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Alex Rivera"
          autoFocus
          className="w-full h-10 px-3 rounded-md bg-[#050505] border border-white/10 text-white text-[13px] placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-all"
        />
        <p className="text-[11px] text-white/40">This is how your name will appear across the platform.</p>
      </div>

      {/* 3. Global Location Autocomplete */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-white/90">
          Location
        </label>
        <LocationAutocomplete 
          value={locationData} 
          onChange={setLocationData} 
          placeholder="City, Region — where you are based"
        />
        <p className="text-[11px] text-white/40">Optional. Helps you match with nearby builders, local events, and region-specific opportunities.</p>
      </div>

      {/* 4. Footer Navigation */}
      <OnboardingFooter
        canContinue={displayName.trim().length >= 2}
        onBack={() => setCurrentStep('identity')}
        onContinue={() => handleSave(false)}
        // Allow skip if they haven't filled out location/photo, but demand a name
        onSkip={(!avatarUrl || !locationData) && displayName.trim().length >= 2 ? () => handleSave(true) : undefined}
        isSaving={isSaving}
      />
    </div>
  )
}