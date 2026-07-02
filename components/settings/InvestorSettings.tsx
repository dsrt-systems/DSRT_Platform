'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectorSelector } from '@/components/shared/SectorSelector'
import { DollarSign } from 'lucide-react'

interface InvestorSettingsProps {
  profile: any
}

export function InvestorSettings({ profile }: InvestorSettingsProps) {
  const router = useRouter()
  const supabase = createClient()

  const [isInvestor, setIsInvestor] = useState(profile.is_investor || false)
  const [investorType, setInvestorType] = useState(profile.investor_type || '')
  const [checkSize, setCheckSize] = useState(profile.check_size || '')
  const [focusSectors, setFocusSectors] = useState<string[]>(
    profile.focus_sectors || []
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('users')
      .update({
        is_investor: isInvestor,
        investor_type: isInvestor ? investorType : null,
        check_size: isInvestor ? checkSize : null,
        focus_sectors: isInvestor ? focusSectors : [],
      })
      .eq('id', profile.id)
    setSaving(false)
    router.refresh()
    if (isInvestor) {
      router.push('/investor')
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">Investor Profile</h2>
          <p className="text-xs text-muted-foreground">
            Enable this if you invest in startups
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isInvestor}
            onChange={(e) => setIsInvestor(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
        </label>
      </div>

      {isInvestor && (
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="space-y-2">
            <Label>Investor Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'Angel',
                'VC Firm',
                'Accelerator',
                'Family Office',
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInvestorType(t)}
                  className={`p-2 text-sm rounded-lg border-2 transition-all ${
                    investorType === t
                      ? 'border-primary bg-primary/5'
                      : 'border-border/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Typical Check Size</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                '< $25k',
                '$25k - $100k',
                '$100k - $500k',
                '$500k+',
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCheckSize(s)}
                  className={`p-2 text-sm rounded-lg border-2 transition-all ${
                    checkSize === s
                      ? 'border-primary bg-primary/5'
                      : 'border-border/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Focus Sectors</Label>
            <SectorSelector
              selected={focusSectors}
              onChange={setFocusSectors}
              max={8}
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )
}