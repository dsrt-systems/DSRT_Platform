'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/stores/onboardingStore'
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

      // Call our secure server endpoint (handles atomic DB update + system welcome mail)
      const res = await fetch('/api/auth/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to complete onboarding')
      }

      // Reset local store state and navigate into active app
      reset()
      router.refresh()
      router.push('/home')
    } catch (err: any) {
      console.error('Onboarding completion error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Almost done. What are you hoping to find on DSRT?
      </p>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3 text-white">I am looking for:</h3>
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
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 bg-[#0A0D14] hover:border-white/20'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{option.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white">{option.label}</p>
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
        <h3 className="font-semibold text-sm mb-3 text-white">My availability:</h3>
        <div className="grid grid-cols-2 gap-2">
          {availabilityOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAvailability(opt.id)}
              className={cn(
                'p-3 rounded-lg border-2 text-sm font-medium transition-all text-white',
                availability === opt.id
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-[#0A0D14] hover:border-white/20'
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
          className="flex-1 bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white font-bold"
        >
          {loading ? 'Finalizing your identity...' : 'Start building →'}
        </Button>
      </div>
    </div>
  )
}