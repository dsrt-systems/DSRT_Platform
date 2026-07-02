'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const topics = [
  { id: 'ai', label: 'AI / ML', emoji: '🤖' },
  { id: 'saas', label: 'SaaS', emoji: '💻' },
  { id: 'fintech', label: 'FinTech', emoji: '💰' },
  { id: 'healthtech', label: 'HealthTech', emoji: '🏥' },
  { id: 'edtech', label: 'EdTech', emoji: '🎓' },
  { id: 'agritech', label: 'AgriTech', emoji: '🌾' },
  { id: 'cleantech', label: 'CleanTech', emoji: '🌱' },
  { id: 'robotics', label: 'Robotics', emoji: '🤖' },
  { id: 'arvr', label: 'AR / VR', emoji: '🥽' },
  { id: 'iot', label: 'IoT', emoji: '📡' },
  { id: 'blockchain', label: 'Blockchain', emoji: '⛓️' },
  { id: 'cybersecurity', label: 'Cybersecurity', emoji: '🔒' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'social', label: 'Social', emoji: '💬' },
  { id: 'ecommerce', label: 'E-Commerce', emoji: '🛒' },
  { id: 'productivity', label: 'Productivity', emoji: '⚙️' },
  { id: 'creator', label: 'Creator Tools', emoji: '🎨' },
  { id: 'devtools', label: 'Dev Tools', emoji: '🛠️' },
  { id: 'climate', label: 'Climate Tech', emoji: '🌍' },
  { id: 'space', label: 'Space Tech', emoji: '🚀' },
]

export function StepInterests() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [selected, setSelected] = useState<string[]>(data.interest_topics || [])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    updateData({ interest_topics: selected })
    nextStep()
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select topics you are interested in. This helps us recommend startups
        and people you might want to collaborate with.
      </p>

      {selected.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{selected.length}</span>{' '}
          topic{selected.length !== 1 ? 's' : ''} selected
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {topics.map((topic) => {
          const isSelected = selected.includes(topic.id)
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => toggle(topic.id)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{topic.emoji}</span>
                <span className="font-medium text-sm">{topic.label}</span>
                {isSelected && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs">✓</span>
                  </span>
                )}
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
          disabled={selected.length < 2}
          className="flex-1"
        >
          {selected.length < 2
            ? `Select ${2 - selected.length} more`
            : 'Continue'}
        </Button>
      </div>
    </div>
  )
}