'use client'

import { useEffect, useState } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

interface Skill {
  id: string
  name: string
  slug: string
  category: string
}

const categories = [
  { id: 'technical', label: 'Technical', icon: '⚡' },
  { id: 'design', label: 'Design', icon: '🎨' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'domain', label: 'Domain', icon: '🌐' },
]

export function StepSkills() {
  const supabase = createClient()
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()

  const [skills, setSkills] = useState<Skill[]>([])
  const [selected, setSelected] = useState<string[]>(data.skill_ids || [])
  const [activeCategory, setActiveCategory] = useState('technical')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSkills = async () => {
      const { data: skillsData } = await supabase
        .from('skills')
        .select('*')
        .order('name')

      setSkills(skillsData || [])
      setLoading(false)
    }
    loadSkills()
  }, [])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const filteredSkills = skills.filter((skill) => {
    const matchesCategory = skill.category === activeCategory
    const matchesSearch = search
      ? skill.name.toLowerCase().includes(search.toLowerCase())
      : true
    return matchesCategory && matchesSearch
  })

  const handleNext = () => {
    updateData({ skill_ids: selected })
    nextStep()
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select skills you have. Pick at least 3. You can verify them later by
        contributing to projects.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Selected count */}
      {selected.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{selected.length}</span>{' '}
          skill{selected.length !== 1 ? 's' : ''} selected
        </div>
      )}

      {/* Skills grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading skills...
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 min-h-[200px]">
          {filteredSkills.map((skill) => {
            const isSelected = selected.includes(skill.id)
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggle(skill.id)}
                className={cn(
                  'px-4 py-2 rounded-full border-2 text-sm font-medium transition-all',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {skill.name}
                {isSelected && <span className="ml-1.5">✓</span>}
              </button>
            )
          })}
          {filteredSkills.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              No skills found. Try a different category or search.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={selected.length < 3}
          className="flex-1"
        >
          {selected.length < 3
            ? `Select ${3 - selected.length} more`
            : 'Continue'}
        </Button>
      </div>
    </div>
  )
}