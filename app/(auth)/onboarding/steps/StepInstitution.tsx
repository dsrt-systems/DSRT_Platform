'use client'

import { useEffect, useState } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Search, Check } from 'lucide-react'

interface Institution {
  id: string
  name: string
  short_name: string | null
  city: string | null
  state: string | null
  type: string
  verified: boolean
}

export function StepInstitution() {
  const supabase = createClient()
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()

  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(data.institution_id || '')
  const [customName, setCustomName] = useState(data.institution_name || '')
  const [showCustom, setShowCustom] = useState(false)

  const [degree, setDegree] = useState(data.degree || '')
  const [field, setField] = useState(data.field || '')
  const [startYear, setStartYear] = useState(
    data.start_year?.toString() || ''
  )
  const [endYear, setEndYear] = useState(data.end_year?.toString() || '')
  const [isCurrent, setIsCurrent] = useState(data.is_current ?? true)

  useEffect(() => {
    const load = async () => {
      const { data: list } = await supabase
        .from('institutions')
        .select('*')
        .order('verified', { ascending: false })
        .order('name')

      setInstitutions(list || [])
    }
    load()
  }, [])

  const filtered = institutions.filter((i) =>
    search
      ? i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.short_name?.toLowerCase().includes(search.toLowerCase())
      : true
  )

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setCustomName('')
    setShowCustom(false)
  }

  const handleNext = () => {
    updateData({
      institution_id: selectedId,
      institution_name: customName.trim() || undefined,
      degree: degree.trim(),
      field: field.trim(),
      start_year: startYear ? parseInt(startYear) : undefined,
      end_year: !isCurrent && endYear ? parseInt(endYear) : undefined,
      is_current: isCurrent,
    })
    nextStep()
  }

  const canProceed = selectedId || customName.trim().length > 2

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - 15 + i)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select your institution to join its community automatically. This is
        optional but recommended.
      </p>

      {!showCustom ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your college or university..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
            {filtered.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No institutions found.{' '}
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Add yours
                </button>
              </div>
            )}
            {filtered.map((inst) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => handleSelect(inst.id)}
                className={cn(
                  'w-full p-3 rounded-lg text-left transition-colors flex items-center justify-between',
                  selectedId === inst.id
                    ? 'bg-primary/10 border border-primary'
                    : 'hover:bg-muted'
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{inst.name}</p>
                    {inst.verified && (
                      <span className="text-xs text-primary">✓ Verified</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {inst.city && `${inst.city}, `}
                    {inst.state}
                  </p>
                </div>
                {selectedId === inst.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="text-sm text-primary hover:underline"
          >
            Cannot find your institution? Add it manually
          </button>
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="custom">Institution Name</Label>
          <Input
            id="custom"
            value={customName}
            onChange={(e) => {
              setCustomName(e.target.value)
              setSelectedId('')
            }}
            placeholder="Your college or university name"
          />
          <button
            type="button"
            onClick={() => {
              setShowCustom(false)
              setCustomName('')
            }}
            className="text-sm text-primary hover:underline"
          >
            ← Search verified institutions instead
          </button>
        </div>
      )}

      {/* Education details */}
      {(selectedId || customName) && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="degree">Degree</Label>
              <Input
                id="degree"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="B.Tech"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field">Field</Label>
              <Input
                id="field"
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="Electrical Engineering"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start_year">Start Year</Label>
              <select
                id="start_year"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
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
              <Label htmlFor="end_year">
                {isCurrent ? 'Expected End' : 'End Year'}
              </Label>
              <select
                id="end_year"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
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
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
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