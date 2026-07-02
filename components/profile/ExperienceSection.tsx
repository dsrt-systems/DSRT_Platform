'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ExperienceSectionProps {
  experience: any[]
  userId: string
  isOwnProfile: boolean
}

export function ExperienceSection({
  experience,
  userId,
  isOwnProfile,
}: ExperienceSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [type, setType] = useState('full-time')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const openAdd = () => {
    setEditing(null)
    setCompany('')
    setRole('')
    setType('full-time')
    setLocation('')
    setStartDate('')
    setEndDate('')
    setIsCurrent(false)
    setDescription('')
    setModalOpen(true)
  }

  const openEdit = (exp: any) => {
    setEditing(exp)
    setCompany(exp.company || '')
    setRole(exp.role || '')
    setType(exp.type || 'full-time')
    setLocation(exp.location || '')
    setStartDate(exp.start_date || '')
    setEndDate(exp.end_date || '')
    setIsCurrent(exp.is_current || false)
    setDescription(exp.description || '')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!company.trim() || !role.trim()) return
    setSaving(true)

    const payload = {
      user_id: userId,
      company: company.trim(),
      role: role.trim(),
      type,
      location: location.trim() || null,
      start_date: startDate || null,
      end_date: !isCurrent && endDate ? endDate : null,
      is_current: isCurrent,
      description: description.trim() || null,
    }

    if (editing) {
      await supabase
        .from('user_experience')
        .update(payload)
        .eq('id', editing.id)
    } else {
      await supabase.from('user_experience').insert(payload)
    }

    setSaving(false)
    setModalOpen(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this experience?')) return
    await supabase.from('user_experience').delete().eq('id', id)
    router.refresh()
  }

  if (experience.length === 0 && !isOwnProfile) return null

  return (
    <>
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Experience</h2>
          {isOwnProfile && (
            <Button size="sm" variant="ghost" onClick={openAdd}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {experience.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No experience added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="flex gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  💼
                </div>
                <div className="flex-1">
                  <p className="font-medium">{exp.role}</p>
                  <p className="text-sm">{exp.company}</p>
                  {exp.start_date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(exp.start_date).toLocaleDateString('en', {
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      —{' '}
                      {exp.is_current
                        ? 'Present'
                        : exp.end_date &&
                          new Date(exp.end_date).toLocaleDateString('en', {
                            month: 'short',
                            year: 'numeric',
                          })}
                    </p>
                  )}
                  {exp.description && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {exp.description}
                    </p>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(exp)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(exp.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Experience' : 'Add Experience'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Google"
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Software Engineer Intern"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bangalore, India"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isCurrent}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">I currently work here</span>
            </label>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!company.trim() || !role.trim() || saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}