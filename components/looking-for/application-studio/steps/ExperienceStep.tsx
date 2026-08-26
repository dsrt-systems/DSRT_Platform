'use client'

import { useAppStudio } from '../AppStudioContext'
import { AppStepFooter } from './AppStepFooter'
import { Briefcase } from '@phosphor-icons/react'

export function ExperienceStep() {
  const { updateField } = useAppStudio()

  return (
    <>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
        
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-bold text-white mb-1">Professional Context</h2>
            <p className="text-[12.5px] text-zinc-500">
              Provide your availability and expectations for this role.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0f0f11] p-5 md:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 mb-5">
              <Briefcase size={16} className="text-zinc-400" />
              <h3 className="text-[14px] font-bold text-white">Availability & Expectations</h3>
            </div>

            <div className="space-y-5">
              {/* Availability */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  When can you start?
                </label>
                <select
                  onChange={(e) => updateField({ availability: e.target.value })}
                  className="w-full max-w-md h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-200 focus:outline-none focus:border-zinc-600 appearance-none"
                >
                  <option value="">Select option...</option>
                  <option value="immediately">Immediately</option>
                  <option value="within_week">Within 1 week</option>
                  <option value="within_month">Within 1 month</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              {/* Hours */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Expected Hours / Week
                </label>
                <input
                  type="number"
                  onChange={(e) => updateField({ expected_hours: e.target.value ? Number(e.target.value) : null })}
                  placeholder="e.g. 20"
                  className="w-full max-w-xs h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Compensation (if applicable) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Proposed Compensation (Optional)
                </label>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="number"
                    onChange={(e) => updateField({ proposed_compensation: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Amount"
                    className="flex-1 h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                  <select
                    onChange={(e) => updateField({ proposed_compensation_type: e.target.value })}
                    className="w-32 h-11 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[13px] text-zinc-200 focus:outline-none focus:border-zinc-600 appearance-none"
                  >
                    <option value="">Type...</option>
                    <option value="hourly">/ Hour</option>
                    <option value="monthly">/ Month</option>
                    <option value="annual">/ Year</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-[100px] rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Honesty Matters</h3>
            <p className="text-[12px] text-zinc-400 leading-relaxed">
              If the opportunity specifies a required time commitment, ensure your proposed hours align with it. Mismatched expectations are the #1 reason applications are rejected early.
            </p>
          </div>
        </div>

      </div>

      <AppStepFooter prev="profile" next="questions" />
    </>
  )
}