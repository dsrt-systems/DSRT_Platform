'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const roles = [
  {
    id: 'visionary',
    label: 'Visionary',
    description: 'I have ideas and see problems to solve. I need builders.',
    icon: '💡',
  },
  {
    id: 'builder',
    label: 'Builder',
    description: 'I have technical skills and want real problems to build.',
    icon: '⚡',
  },
  {
    id: 'launcher',
    label: 'Launcher',
    description: 'I market, grow, and take products to the world.',
    icon: '🚀',
  },
  {
    id: 'maker',
    label: 'Maker',
    description: 'I want to build things, grow skills, create a portfolio.',
    icon: '🔨',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'I have industry experience and real problems to solve.',
    icon: '💼',
  },
  {
    id: 'mentor',
    label: 'Mentor',
    description: 'I have experience and want to guide builders.',
    icon: '🎯',
  },
]

export function StepBrings() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [selected, setSelected] = useState<string[]>(data.brings || [])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    updateData({ brings: selected })
    nextStep()
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select all that describe you. You can be multiple things.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {roles.map((role) => {
          const isSelected = selected.includes(role.id)
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => toggle(role.id)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{role.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{role.label}</p>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground text-xs">
                          ✓
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={selected.length === 0}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}