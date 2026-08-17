'use client'

interface Props {
  draft: any
  onUpdate: (patch: any) => void
}

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone on DSRT can see this opportunity' },
  { value: 'members', label: 'DSRT Members', description: 'Only signed-in members can see this' },
  { value: 'private-link', label: 'Private link', description: 'Only people with the direct link' },
  { value: 'invite-only', label: 'Invite only', description: 'Only people you invite can apply' },
]

export function AdvancedSettingsPanel({ draft, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      {/* Visibility */}
      <Section title="Visibility" description="Who can find and view this opportunity?">
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ' +
                (draft?.visibility === opt.value
                  ? 'border-zinc-600 bg-zinc-900/50'
                  : 'border-zinc-800 hover:border-zinc-700')
              }
            >
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={draft?.visibility === opt.value}
                onChange={(e) => onUpdate({ visibility: e.target.value })}
                className="mt-1 w-3.5 h-3.5 accent-white cursor-pointer"
              />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-white">{opt.label}</div>
                <div className="text-[11.5px] text-zinc-500 mt-0.5">{opt.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Applications */}
      <Section title="Applications" description="Control how people apply">
        <div className="space-y-2">
          <Toggle
            label="Applications open"
            description="Allow people to apply to this opportunity"
            checked={draft?.applications_open !== false}
            onChange={(v) => onUpdate({ applications_open: v })}
          />
          <Toggle
            label="Allow withdrawal"
            description="Let applicants withdraw their application"
            checked={draft?.allow_withdrawal !== false}
            onChange={(v) => onUpdate({ allow_withdrawal: v })}
          />
          <Toggle
            label="Auto-close after deadline"
            description="Automatically stop accepting applications after the deadline"
            checked={draft?.auto_close_after_deadline !== false}
            onChange={(v) => onUpdate({ auto_close_after_deadline: v })}
          />
        </div>

        <div className="mt-4">
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            Max applications (optional)
          </label>
          <input
            type="number"
            min={1}
            value={draft?.max_applications || ''}
            onChange={(e) => onUpdate({ max_applications: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="No limit"
            className="w-full h-9 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-[12.5px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </Section>

      {/* Privacy */}
      <Section title="Privacy" description="What information is shown publicly">
        <div className="space-y-2">
          <Toggle
            label="Show applicant count"
            description="Display how many people have applied"
            checked={draft?.show_applicant_count !== false}
            onChange={(v) => onUpdate({ show_applicant_count: v })}
          />
          <Toggle
            label="Show poster identity"
            description="Show who posted this opportunity"
            checked={draft?.show_poster_identity !== false}
            onChange={(v) => onUpdate({ show_poster_identity: v })}
          />
          <Toggle
            label="Show compensation"
            description="Display compensation details publicly"
            checked={draft?.show_compensation !== false}
            onChange={(v) => onUpdate({ show_compensation: v })}
          />
          <Toggle
            label="Show location"
            description="Display location information"
            checked={draft?.show_location !== false}
            onChange={(v) => onUpdate({ show_location: v })}
          />
        </div>
      </Section>

      {/* Urgency */}
      <Section title="Urgency" description="Signal how time-sensitive this is">
        <select
          value={draft?.urgency || 'normal'}
          onChange={(e) => onUpdate({ urgency: e.target.value })}
          className="w-full h-9 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-[12.5px] text-zinc-200 focus:outline-none cursor-pointer"
        >
          <option value="low">Low — no rush</option>
          <option value="normal">Normal</option>
          <option value="high">High — filling soon</option>
          <option value="urgent">Urgent — need help ASAP</option>
        </select>
      </Section>
    </div>
  )
}

function Section({
  title, description, children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
      <h3 className="text-[14px] font-bold text-white mb-1">{title}</h3>
      {description && (
        <p className="text-[12px] text-zinc-500 mb-4">{description}</p>
      )}
      {children}
    </div>
  )
}

function Toggle({
  label, description, checked, onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-3 py-2 cursor-pointer group">
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium text-zinc-200">{label}</div>
        {description && (
          <div className="text-[11px] text-zinc-500 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={
          'shrink-0 w-9 h-5 rounded-full transition-colors relative ' +
          (checked ? 'bg-white' : 'bg-zinc-800')
        }
      >
        <span
          className={
            'absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform ' +
            (checked ? 'translate-x-4' : 'translate-x-0.5')
          }
        />
      </button>
    </label>
  )
}