'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SkillsSectionProps {
  skills: any[]
  userId: string
  isOwnProfile: boolean
}

export function SkillsSection({
  skills,
  userId,
  isOwnProfile,
}: SkillsSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [allSkills, setAllSkills] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('technical')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (modalOpen) {
      supabase
        .from('skills')
        .select('*')
        .order('name')
        .then(({ data }) => setAllSkills(data || []))
    }
  }, [modalOpen])

  const userSkillIds = new Set(skills.map((s) => s.skill_id))

  const categories = [
    { id: 'technical', label: 'Technical' },
    { id: 'design', label: 'Design' },
    { id: 'business', label: 'Business' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'domain', label: 'Domain' },
  ]

  const filteredSkills = allSkills.filter((s) => {
    const matchCat = s.category === activeCategory
    const matchSearch = search
      ? s.name.toLowerCase().includes(search.toLowerCase())
      : true
    return matchCat && matchSearch
  })

  const toggleSkill = async (skillId: string) => {
    setSaving(true)
    if (userSkillIds.has(skillId)) {
      await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', userId)
        .eq('skill_id', skillId)
    } else {
      await supabase.from('user_skills').insert({
        user_id: userId,
        skill_id: skillId,
        level: 'intermediate',
      })
    }
    setSaving(false)
    router.refresh()
  }

  const grouped = skills.reduce((acc: any, s) => {
    const cat = s.skills?.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <>
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 space-y-4 sticky top-20">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Skills</h2>
          {isOwnProfile && (
            <Button size="sm" variant="ghost" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills added.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([cat, items]: any) => (
              <div key={cat}>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  {cat}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((s: any) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 bg-muted text-xs rounded-md"
                    >
                      {s.skills?.name}
                      {s.verified && (
                        <span className="ml-1 text-primary">✓</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Skills</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full whitespace-nowrap',
                  activeCategory === c.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/70'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {filteredSkills.map((s) => {
                const selected = userSkillIds.has(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s.id)}
                    disabled={saving}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-full border transition-all',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/40 hover:border-border'
                    )}
                  >
                    {s.name} {selected && '✓'}
                  </button>
                )
              })}
            </div>
          </div>

          <Button onClick={() => setModalOpen(false)}>Done</Button>
        </DialogContent>
      </Dialog>
    </>
  )
}