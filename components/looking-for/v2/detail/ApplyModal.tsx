'use client'

import { useEffect, useState } from 'react'
import { X, PaperPlaneTilt, CheckCircle, Warning } from '@phosphor-icons/react'

interface Props {
  opportunity: any
  onClose: () => void
  onSuccess: () => void
}

type Step = 'compose' | 'submitting' | 'success' | 'error'

export function ApplyModal({ opportunity, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('compose')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form state (template fields)
  const [coverMessage, setCoverMessage] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [availability, setAvailability] = useState('')
  const [expectedHours, setExpectedHours] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const customQuestions = (opportunity.custom_questions || []).map((q: any) =>
    typeof q === 'string' ? { question: q, required: false, type: 'text' } : q
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'submitting') onClose()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose, step])

  const validate = (): string | null => {
    if (!coverMessage.trim() && !coverLetter.trim()) {
      return 'Please write a short introduction so the poster knows why you\'re interested.'
    }
    if (opportunity.require_resume && !resumeUrl.trim()) return 'Resume URL is required'
    if (opportunity.require_portfolio && !portfolioUrl.trim()) return 'Portfolio URL is required'
    if (opportunity.require_github && !githubUrl.trim()) return 'GitHub URL is required'
    if (opportunity.require_website && !websiteUrl.trim()) return 'Website URL is required'

    for (let i = 0; i < customQuestions.length; i++) {
      const q = customQuestions[i]
      if (q.required && !answers[`q_${i}`]?.trim()) {
        return `Please answer: ${q.question}`
      }
    }
    return null
  }

  const submit = async () => {
    const err = validate()
    if (err) {
      setErrorMsg(err)
      return
    }
    setStep('submitting')
    setErrorMsg(null)

    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_message: coverMessage.trim() || null,
          cover_letter: coverLetter.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
          github_url: githubUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          website_url: websiteUrl.trim() || null,
          resume_url: resumeUrl.trim() || null,
          availability: availability || null,
          expected_hours: expectedHours ? parseInt(expectedHours) : null,
          answers,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit application')
      }

      setStep('success')
      setTimeout(() => onSuccess(), 1500)
    } catch (e: any) {
      setErrorMsg(e.message || 'Something went wrong')
      setStep('error')
    }
  }

  const posterName = opportunity.poster?.full_name || opportunity.poster?.username || 'the team'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={step !== 'submitting' ? onClose : undefined}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl max-h-[92vh] rounded-2xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-800 shrink-0">
          <div className="min-w-0 flex-1 mr-4">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Apply to opportunity
            </div>
            <h2 className="text-[17px] font-bold text-white line-clamp-1">
              {opportunity.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={step === 'submitting'}
            className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-40"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {step === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-5 shadow-[0_4px_20px_rgba(16,185,129,0.15)]">
              <CheckCircle size={26} weight="fill" />
            </div>
            <h3 className="text-[18px] font-bold text-white mb-2">Application submitted</h3>
            <p className="text-[13.5px] text-zinc-400 max-w-md leading-relaxed">
              {posterName} has been notified. You'll receive an update when they respond.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-7">

              {/* Field 1: Your message */}
              <TemplateField
                stepNum={1}
                title="Your message"
                description={`Introduce yourself to ${posterName}. Why are you interested in this opportunity?`}
                required
              >
                <textarea
                  value={coverMessage}
                  onChange={(e) => setCoverMessage(e.target.value)}
                  rows={4}
                  placeholder="I'm interested in this opportunity because..."
                  disabled={step === 'submitting'}
                  className="w-full px-3.5 py-3 rounded-md bg-zinc-950 border border-zinc-800 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed transition-colors"
                />
              </TemplateField>

              {/* Field 2: Relevant experience */}
              <TemplateField
                stepNum={2}
                title="Relevant experience"
                description="What have you built that's relevant? Share projects, roles, or work that demonstrates your fit."
              >
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={5}
                  placeholder="I've previously worked on..."
                  disabled={step === 'submitting'}
                  className="w-full px-3.5 py-3 rounded-md bg-zinc-950 border border-zinc-800 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed transition-colors"
                />
              </TemplateField>

              {/* Field 3: Availability */}
              <TemplateField
                stepNum={3}
                title="Availability"
                description="When can you start and how many hours per week can you commit?"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Can start
                    </label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      disabled={step === 'submitting'}
                      className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer transition-colors"
                    >
                      <option value="">Select...</option>
                      <option value="immediately">Immediately</option>
                      <option value="within_week">Within a week</option>
                      <option value="within_month">Within a month</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Hours/week
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={80}
                      value={expectedHours}
                      onChange={(e) => setExpectedHours(e.target.value)}
                      placeholder="e.g. 15"
                      disabled={step === 'submitting'}
                      className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                  </div>
                </div>
              </TemplateField>

              {/* Field 4: Links */}
              <TemplateField
                stepNum={4}
                title="Links (optional)"
                description="Share your portfolio, GitHub, LinkedIn, or personal site."
              >
                <div className="grid grid-cols-2 gap-3">
                  <LinkField
                    label="Portfolio"
                    value={portfolioUrl}
                    onChange={setPortfolioUrl}
                    required={opportunity.require_portfolio}
                    disabled={step === 'submitting'}
                  />
                  <LinkField
                    label="GitHub"
                    value={githubUrl}
                    onChange={setGithubUrl}
                    required={opportunity.require_github}
                    disabled={step === 'submitting'}
                  />
                  <LinkField
                    label="LinkedIn"
                    value={linkedinUrl}
                    onChange={setLinkedinUrl}
                    disabled={step === 'submitting'}
                  />
                  <LinkField
                    label="Resume"
                    value={resumeUrl}
                    onChange={setResumeUrl}
                    required={opportunity.require_resume}
                    disabled={step === 'submitting'}
                  />
                  {opportunity.require_website && (
                    <LinkField
                      label="Website"
                      value={websiteUrl}
                      onChange={setWebsiteUrl}
                      required
                      disabled={step === 'submitting'}
                    />
                  )}
                </div>
              </TemplateField>

              {/* Field 5: Custom questions */}
              {customQuestions.length > 0 && (
                <TemplateField
                  stepNum={5}
                  title="Application questions"
                  description={`${posterName} asked these questions specifically for applicants:`}
                >
                  <div className="space-y-5">
                    {customQuestions.map((q: any, i: number) => (
                      <div key={i}>
                        <label className="block text-[12.5px] font-semibold text-zinc-300 mb-2 leading-snug">
                          {q.question}
                          {q.required && <span className="text-blue-400 ml-1">*</span>}
                        </label>
                        <textarea
                          value={answers[`q_${i}`] || ''}
                          onChange={(e) => setAnswers({ ...answers, [`q_${i}`]: e.target.value })}
                          rows={3}
                          disabled={step === 'submitting'}
                          className="w-full px-3.5 py-3 rounded-md bg-zinc-950 border border-zinc-800 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </TemplateField>
              )}

              {/* Error */}
              {errorMsg && (
                <div className="flex items-start gap-2 p-3.5 rounded-md border border-red-500/30 bg-red-500/5 text-[12.5px] text-red-400">
                  <Warning size={14} weight="fill" className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-zinc-800 bg-zinc-950/50 shrink-0">
              <p className="text-[11.5px] text-zinc-500">
                Your application will be visible only to {posterName}.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onClose}
                  disabled={step === 'submitting'}
                  className="h-9 px-4 rounded-md border border-zinc-800 hover:border-zinc-700 text-[13px] font-medium text-zinc-300 hover:text-white disabled:opacity-40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={step === 'submitting'}
                  className="inline-flex items-center gap-1.5 h-9 px-5 rounded-md bg-white text-black hover:bg-zinc-100 text-[13px] font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
                >
                  {step === 'submitting' ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PaperPlaneTilt size={13} weight="fill" />
                      Submit application
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Template field wrapper (numbered sections) ───
function TemplateField({
  stepNum, title, description, required, children,
}: {
  stepNum: number
  title: string
  description?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0">
        <div className="w-7 h-7 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-[11.5px] font-bold text-zinc-400">
          {stepNum}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-bold text-white leading-tight mb-1">
          {title}
          {required && <span className="text-blue-400 ml-1">*</span>}
        </h3>
        {description && (
          <p className="text-[12.5px] text-zinc-500 mb-3 leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    </div>
  )
}

function LinkField({
  label, value, onChange, required, disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
        {label}
        {required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        disabled={disabled}
        className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
      />
    </div>
  )
}