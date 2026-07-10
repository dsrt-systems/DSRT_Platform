'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, X } from 'lucide-react'
import slugify from 'slugify'

interface HackathonFormProps {
  communities: any[]
  adminRole: string
}

export function HackathonForm({
  communities,
  adminRole,
}: HackathonFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [hostName, setHostName] = useState('')
  const [mode, setMode] = useState('online')
  const [location, setLocation] = useState('')
  const [prizePool, setPrizePool] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [registrationDeadline, setRegistrationDeadline] = useState('')
  const [themeInput, setThemeInput] = useState('')
  const [themes, setThemes] = useState<string[]>([])
  const [communityId, setCommunityId] = useState('')
  const [judgingCriteria, setJudgingCriteria] = useState('')
  const [submissionGuidelines, setSubmissionGuidelines] = useState('')

  const [aiHelping, setAiHelping] = useState(false)
  const [saving, setSaving] = useState(false)

  const addTheme = () => {
    if (themeInput.trim() && !themes.includes(themeInput.trim())) {
      setThemes([...themes, themeInput.trim()])
      setThemeInput('')
    }
  }

  const generateWithAI = async () => {
    if (!title.trim()) {
      alert('Add a title first, then AI can help generate the rest')
      return
    }
    setAiHelping(true)

    try {
      const res = await fetch('/api/admin/hackathon-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          tagline,
          themes,
        }),
      })
      const data = await res.json()

      if (data.description) setDescription(data.description)
      if (data.judging_criteria) setJudgingCriteria(data.judging_criteria)
      if (data.submission_guidelines) setSubmissionGuidelines(data.submission_guidelines)
      if (data.suggested_themes) {
        setThemes([...new Set([...themes, ...data.suggested_themes])])
      }
    } catch (err) {
      alert('AI generation failed')
    }

    setAiHelping(false)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !hostName.trim() || !startDate) return

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const slug = slugify(title, { lower: true, strict: true })

    const { data, error } = await supabase
      .from('hackathons')
      .insert({
        title,
        slug,
        tagline: tagline || null,
        description,
        host_name: hostName,
        mode,
        location: location || null,
        prize_pool: prizePool || null,
        start_date: startDate,
        end_date: endDate || null,
        registration_deadline: registrationDeadline || null,
        themes,
        community_id: communityId || null,
        judging_criteria: judgingCriteria || null,
        submission_guidelines: submissionGuidelines || null,
        created_by: user?.id,
        created_by_admin_role: adminRole,
        approved: adminRole === 'dsrt_super_admin', // Auto-approve if super admin
        status: 'upcoming',
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      alert('Error creating hackathon: ' + error.message)
      return
    }

    router.push(`/admin/hackathons`)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 space-y-6">
      {/* AI Assist Bar */}
      <div className="rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-600/10 to-pink-600/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              AI Content Assistant
            </p>
            <p className="text-xs text-white/60">
              Fill title first, then let AI generate description, criteria, etc.
            </p>
          </div>
        </div>
        <Button
          onClick={generateWithAI}
          disabled={!title.trim() || aiHelping}
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {aiHelping ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Generate
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="DSRT AI Hackathon 2025"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Build the future of autonomous intelligence"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="host">Host Name *</Label>
        <Input
          id="host"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          placeholder="DSRT · IIT Bombay · CGEC"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      {adminRole === 'dsrt_super_admin' && communities.length > 0 && (
        <div className="space-y-2">
          <Label>Community (optional)</Label>
          <select
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm"
          >
            <option value="">DSRT-wide hackathon</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Mode</Label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm"
          >
            <option value="online">Online</option>
            <option value="in-person">In-person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prize">Prize Pool</Label>
          <Input
            id="prize"
            value={prizePool}
            onChange={(e) => setPrizePool(e.target.value)}
            placeholder="₹5,00,000"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      {mode !== 'online' && (
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Mumbai · Bangalore · CGEC Campus"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Registration Deadline</Label>
          <Input
            type="date"
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Themes</Label>
        <div className="flex gap-2">
          <Input
            value={themeInput}
            onChange={(e) => setThemeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTheme()
              }
            }}
            placeholder="AI, Climate, FinTech..."
            className="bg-white/5 border-white/10 text-white"
          />
          <Button
            type="button"
            onClick={addTheme}
            variant="outline"
            size="sm"
            className="border-white/10"
          >
            Add
          </Button>
        </div>
        {themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {themes.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white/10 rounded-full"
              >
                {t}
                <button
                  type="button"
                  onClick={() =>
                    setThemes(themes.filter((x) => x !== t))
                  }
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the hackathon, its purpose, who should join..."
          rows={5}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="judging">Judging Criteria</Label>
        <Textarea
          id="judging"
          value={judgingCriteria}
          onChange={(e) => setJudgingCriteria(e.target.value)}
          placeholder="How will submissions be evaluated?"
          rows={4}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="submission">Submission Guidelines</Label>
        <Textarea
          id="submission"
          value={submissionGuidelines}
          onChange={(e) => setSubmissionGuidelines(e.target.value)}
          placeholder="What should teams submit? Requirements? Format?"
          rows={4}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-white/10">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
          className="border-white/10"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!title || !hostName || !startDate || saving}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Hackathon'
          )}
        </Button>
      </div>
    </div>
  )
}