'use client'

import { useState, useEffect } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StepIdentity() {
  const supabase = createClient()
  const { data, updateData, nextStep } = useOnboardingStore()

  const [fullName, setFullName] = useState(data.full_name || '')
  const [username, setUsername] = useState(data.username || '')
  const [tagline, setTagline] = useState(data.tagline || '')
  const [location, setLocation] = useState(data.location || '')
  const [usernameError, setUsernameError] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const loadExistingData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, username, tagline, location')
          .eq('id', user.id)
          .single()

        if (profile && !fullName) {
          setFullName(profile.full_name || '')
          setUsername(profile.username || '')
          setTagline(profile.tagline || '')
          setLocation(profile.location || '')
        }
      }
    }
    loadExistingData()
  }, [])

  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      return false
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Only letters, numbers, and underscores allowed')
      return false
    }

    setChecking(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', value.toLowerCase())
      .neq('id', user?.id || '')
      .maybeSingle()

    setChecking(false)

    if (existing) {
      setUsernameError('This username is already taken')
      return false
    }

    setUsernameError('')
    return true
  }

  const handleNext = async () => {
    if (!fullName.trim() || fullName.length < 2) return
    if (!username.trim()) return

    const valid = await checkUsername(username)
    if (!valid) return

    updateData({
      full_name: fullName.trim(),
      username: username.toLowerCase().trim(),
      tagline: tagline.trim(),
      location: location.trim(),
    })

    nextStep()
  }

  const canProceed = fullName.length >= 2 && username.length >= 3 && !usernameError && !checking

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-white/90 flex items-center gap-1.5">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your first and last name"
          className="w-full h-10 px-3 rounded-md bg-transparent border border-white/15 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-all"
        />
        <p className="text-[11px] text-white/40">This appears on your public profile.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-white/90 flex items-center gap-1.5">
          Username <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center border border-white/15 rounded-md focus-within:border-[#4F7CFF] focus-within:ring-1 focus-within:ring-[#4F7CFF] transition-all overflow-hidden">
          <span className="px-3 h-10 flex items-center bg-white/[0.03] text-white/40 text-[13px] font-mono border-r border-white/10">
            dsrtai.com/
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setUsernameError('')
            }}
            onBlur={() => username && checkUsername(username)}
            placeholder="Choose a unique handle"
            className="flex-1 h-10 px-3 bg-transparent text-white text-[14px] placeholder:text-white/30 font-mono focus:outline-none"
          />
          {checking && (
            <div className="pr-3">
              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
            </div>
          )}
        </div>
        {usernameError ? (
          <p className="text-[11px] text-red-400">{usernameError}</p>
        ) : (
          <p className="text-[11px] text-white/40">Letters, numbers, and underscores only.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-white/90">Tagline</label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="One line that describes what you do or believe in"
          maxLength={100}
          className="w-full h-10 px-3 rounded-md bg-transparent border border-white/15 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-all"
        />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-white/40">Great taglines are short, bold, and specific.</p>
          <p className="text-[11px] text-white/40 font-mono">{tagline.length}/100</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-white/90">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, Region — where you are based"
          className="w-full h-10 px-3 rounded-md bg-transparent border border-white/15 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-all"
        />
        <p className="text-[11px] text-white/40">Helps you match with nearby builders and local events.</p>
      </div>

      <div className="pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={cn(
            "w-full h-10 rounded-md flex items-center justify-center transition-colors",
            "bg-white text-black text-[14px] font-semibold hover:bg-white/90",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          )}
        >
          Continue
        </button>
      </div>
    </div>
  )
}