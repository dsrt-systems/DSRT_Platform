'use client'

import { useState, useEffect } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function StepIdentity() {
  const supabase = createClient()
  const { data, updateData, nextStep } = useOnboardingStore()

  const [fullName, setFullName] = useState(data.full_name || '')
  const [username, setUsername] = useState(data.username || '')
  const [tagline, setTagline] = useState(data.tagline || '')
  const [location, setLocation] = useState(data.location || '')
  const [usernameError, setUsernameError] = useState('')
  const [checking, setChecking] = useState(false)

  // Load existing data from user record
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
      .single()

    setChecking(false)

    if (existing) {
      setUsernameError('Username is already taken')
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jisu Mondal"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <div className="flex items-center">
          <span className="px-3 py-2 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">
            dsrt.app/
          </span>
          <Input
            id="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setUsernameError('')
            }}
            onBlur={() => username && checkUsername(username)}
            placeholder="jisumondal"
            className="rounded-l-none"
          />
        </div>
        {usernameError && (
          <p className="text-xs text-destructive">{usernameError}</p>
        )}
        {checking && (
          <p className="text-xs text-muted-foreground">Checking availability...</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Building the future of startup collaboration"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground text-right">
          {tagline.length}/100
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Cooch Behar, West Bengal"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}