'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const seekingOptions = [
  { id: 'cofounder', label: 'Co-founder', icon: '🤝', desc: 'Long-term partner' },
  { id: 'collaborators', label: 'Collaborators', icon: '👥', desc: 'Project teammates' },
  { id: 'ideas', label: 'Ideas to build', icon: '💡', desc: 'Problems to solve' },
  { id: 'projects', label: 'Projects to join', icon: '📁', desc: 'Existing projects' },
  { id: 'team', label: 'Team members', icon: '⚡', desc: 'For my startup' },
  { id: 'mentorship', label: 'Mentorship', icon: '🎯', desc: 'Guidance and advice' },
  { id: 'investors', label: 'Investors', icon: '💰', desc: 'Funding opportunities' },
  { id: 'feedback', label: 'Feedback', icon: '💬', desc: 'On my work and ideas' },
]

const availabilityOptions = [
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'weekends', label: 'Weekends only' },
  { id: 'not-available', label: 'Just exploring' },
]

export function StepSeeking() {
  const router = useRouter()
  const supabase = createClient()
  const { data, updateData, prevStep, reset } = useOnboardingStore()

  const [selected, setSelected] = useState<string[]>(data.seeking || [])
  const [availability, setAvailability] = useState(data.availability || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const finish = async () => {
    setLoading(true)
    setError(null)

    try {
      const finalData = {
        ...data,
        seeking: selected,
        availability,
      }
      updateData({ seeking: selected, availability })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 1. Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: finalData.full_name,
          username: finalData.username,
          tagline: finalData.tagline || null,
          location: finalData.location || null,
          brings: finalData.brings || [],
          seeking: selected,
          interest_topics: finalData.interest_topics || [],
          availability: availability || null,
          onboarding_complete: true,
          last_active: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (userError) {
        console.error('User update error:', userError)
        setError('Failed to save profile. Please try again.')
        setLoading(false)
        return
      }

      // 2. Add education
      if (finalData.institution_id || finalData.institution_name) {
        await supabase.from('user_education').insert({
          user_id: user.id,
          institution_id: finalData.institution_id || null,
          institution_name: finalData.institution_name || null,
          degree: finalData.degree || null,
          field: finalData.field || null,
          start_year: finalData.start_year || null,
          end_year: finalData.is_current ? null : finalData.end_year || null,
          is_current: finalData.is_current ?? false,
        })

        // 3. Auto-join institution community
        if (finalData.institution_id) {
          const { data: community } = await supabase
            .from('communities')
            .select('id')
            .eq('institution_id', finalData.institution_id)
            .single()

          if (community) {
            await supabase.from('community_members').insert({
              community_id: community.id,
              user_id: user.id,
              role: 'member',
            })
          }
        }
      }

      // 4. Add skills
      if (finalData.skill_ids && finalData.skill_ids.length > 0) {
        await supabase.from('user_skills').insert(
          finalData.skill_ids.map((skill_id: string) => ({
            user_id: user.id,
            skill_id,
            level: 'intermediate',
          }))
        )
      }

      // 5. Reset onboarding store
      reset()

      // 6. Redirect to feed
      router.refresh()
      router.push('/feed')
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Almost done. What are you hoping to find on DSRT?
      </p>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">I am looking for:</h3>
        <div className="grid grid-cols-2 gap-3">
          {seekingOptions.map((option) => {
            const isSelected = selected.includes(option.id)
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{option.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {option.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">My availability:</h3>
        <div className="grid grid-cols-2 gap-2">
          {availabilityOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAvailability(opt.id)}
              className={cn(
                'p-3 rounded-lg border-2 text-sm font-medium transition-all',
                availability === opt.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={prevStep} disabled={loading}>
          Back
        </Button>
        <Button
          onClick={finish}
          disabled={selected.length === 0 || !availability || loading}
          className="flex-1"
        >
          {loading ? 'Setting up your profile...' : 'Start building →'}
        </Button>
      </div>
    </div>
  )
}