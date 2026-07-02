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

interface EducationSectionProps {
  education: any[]
  userId: string
  isOwnProfile: boolean
}

export function EducationSection({
  education,
  userId,
  isOwnProfile,
}: EducationSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const [institutionName, setInstitutionName] = useState('')
  const [degree, setDegree] = useState('')
  const [field, setField] = useState('')
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [grade, setGrade] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const openAdd = () => {
    setEditing(null)
    setInstitutionName('')
    setDegree('')
    setField('')
    setStartYear('')
    setEndYear('')
    setIsCurrent(false)
    setGrade('')
    setDescription('')
    setModalOpen(true)
  }

  const openEdit = (edu: any) => {
    setEditing(edu)
    setInstitutionName(edu.institution_name || edu.institutions?.name || '')
    setDegree(edu.degree || '')
    setField(edu.field || '')
    setStartYear(edu.start_year?.toString() || '')
    setEndYear(edu.end_year?.toString() || '')
    setIsCurrent(edu.is_current || false)
    setGrade(edu.grade || '')
    setDescription(edu.description || '')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!institutionName.trim()) return
    setSaving(true)

    const payload = {
      user_id: userId,
      institution_name: institutionName.trim(),
      degree: degree.trim() || null,
      field: field.trim() || null,
      start_year: startYear ? parseInt(startYear) : null,
      end_year: !isCurrent && endYear ? parseInt(endYear) : null,
      is_current: isCurrent,
      grade: grade.trim() || null,
      description: description.trim() || null,
    }

    if (editing) {
      await supabase.from('user_education').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('user_education').insert(payload)
    }

    setSaving(false)
    setModalOpen(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this education entry?')) return
    await supabase.from('user_education').delete().eq('id', id)
    router.refresh()
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - 15 + i)

  if (education.length === 0 && !isOwnProfile) return null

  return (
    <>
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Education</h2>
          {isOwnProfile && (
            <Button size="sm" variant="ghost" onClick={openAdd}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {education.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No education added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="flex gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  🎓
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {edu.institutions?.name || edu.institution_name}
                  </p>
                  {edu.degree && (
                    <p className="text-sm text-muted-foreground">
                      {edu.degree}
                      {edu.field && ` in ${edu.field}`}
                    </p>
                  )}
                  {edu.start_year && (
                    <p className="text-xs text-muted-foreground">
                      {edu.start_year} —{' '}
                      {edu.is_current ? 'Present' : edu.end_year}
                    </p>
                  )}
                  {edu.grade && (
                    <p className="text-xs text-muted-foreground">
                      Grade: {edu.grade}
                    </p>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(edu)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(edu.id)}
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
              {editing ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Institution *</Label>
              <Input
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="CGEC"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="B.Tech"
                />
              </div>
              <div className="space-y-2">
                <Label>Field</Label>
                <Input
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="Electrical Engineering"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Year</Label>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="">Select</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{isCurrent ? 'Expected End' : 'End Year'}</Label>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="">Select</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">I am currently studying here</span>
            </label>
            <div className="space-y-2">
              <Label>Grade / GPA</Label>
              <Input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="8.5 CGPA"
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
                disabled={!institutionName.trim() || saving}
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