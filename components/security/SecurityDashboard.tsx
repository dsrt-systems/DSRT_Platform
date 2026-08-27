'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Smartphone, Download, Loader2, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function SecurityDashboard({ profile, securityEvents, initialMfaState }: any) {
  const router = useRouter()
  const supabase = createClient()

  // MFA State
  const [mfaEnabled, setMfaEnabled] = useState(initialMfaState)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)

  // 1. Start MFA via Supabase Client
  const handleStartEnrollment = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'DSRT Connect', friendlyName: profile.username })
      if (error) throw error

      setQrCode(data.totp.qr_code)
      setFactorId(data.id)
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize 2FA')
    } finally {
      setLoading(false)
    }
  }

  // 2. Verify MFA Code & Finalize
  const handleVerifyEnrollment = async () => {
    if (!code || code.length !== 6 || !factorId) return toast.error('Enter a valid 6-digit code')
    setLoading(true)

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) throw challenge.error

      const verify = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code })
      if (verify.error) throw verify.error

      // Finalize on our backend to generate recovery codes
      const res = await fetch('/api/auth/mfa/finalize', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMfaEnabled(true)
      setRecoveryCodes(data.recoveryCodes)
      setQrCode(null)
      toast.success('Two-factor authentication enabled successfully!')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadRecoveryCodes = () => {
    if (!recoveryCodes) return
    const blob = new Blob([`DSRT CONNECT EMERGENCY RECOVERY CODES\nAccount: @${profile.username}\n\n${recoveryCodes.join('\n')}\n\nKeep these codes safe. Each code can be used once.`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dsrt-recovery-codes-${profile.username}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleGlobalSignOut = async () => {
    toast.loading('Signing out of all sessions...')
    await supabase.auth.signOut({ scope: 'global' })
    window.location.href = '/login'
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 text-white animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security & Identity</h1>
        <p className="text-sm text-white/50 mt-1">Manage authentication factors, recovery options, and monitor your account.</p>
      </div>

      {/* MFA Setup Card */}
      <div className="bg-[#0A0D14] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4F7CFF]/10 border border-[#4F7CFF]/30 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-[#4F7CFF]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base">Two-Factor Authentication (TOTP)</h3>
            <p className="text-xs text-white/50">Protect your DSRT account using Google Authenticator, 1Password, or Authy.</p>
          </div>
          {mfaEnabled ? (
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider">Active</span>
          ) : (
            <Button onClick={handleStartEnrollment} disabled={loading || !!qrCode} className="bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white">
              {loading && !qrCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set up 2FA'}
            </Button>
          )}
        </div>

        {/* QR Code Scan Area */}
        {qrCode && !mfaEnabled && (
          <div className="p-6 bg-[#05070D] border border-white/10 rounded-xl flex flex-col items-center space-y-4 animate-in zoom-in-95">
            <p className="text-sm text-white/70 text-center max-w-md">Scan this QR code with your authenticator app, then enter the 6-digit verification code below.</p>
            <div className="p-3 bg-white rounded-xl">
              <Image src={qrCode} alt="QR Code" width={160} height={160} />
            </div>
            <div className="flex gap-2 w-full max-w-xs">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full h-11 text-center text-lg font-mono font-bold bg-[#0A0D14] border border-white/20 rounded-lg text-white focus:border-[#4F7CFF] outline-none"
              />
              <Button onClick={handleVerifyEnrollment} disabled={loading || code.length !== 6} className="h-11 bg-[#4F7CFF]">Verify</Button>
            </div>
          </div>
        )}

        {/* Recovery Codes Display (Shown only once) */}
        {recoveryCodes && (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-4 animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Save Your Recovery Codes</span>
              <Button size="sm" variant="outline" onClick={downloadRecoveryCodes} className="bg-transparent border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 gap-2">
                <Download className="w-4 h-4" /> Download (.txt)
              </Button>
            </div>
            <p className="text-xs text-emerald-400/80">If you lose your device, these codes are the ONLY way to recover your account. This is the only time they will be shown.</p>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs text-white bg-black/40 p-4 rounded-lg border border-emerald-500/20">
              {recoveryCodes.map((c, i) => <div key={i}>{i + 1}. {c}</div>)}
            </div>
          </div>
        )}
      </div>

      {/* Session Management */}
      <div className="bg-[#0A0D14] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base">Active Sessions</h3>
          <p className="text-xs text-white/50">Log out of all other devices and browsers.</p>
        </div>
        <Button variant="outline" onClick={handleGlobalSignOut} className="border-white/20 hover:bg-white/10 text-white">Sign out all sessions</Button>
      </div>

      {/* Security Audit Log */}
      <div className="bg-[#0A0D14] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-white/50" />
          <h3 className="font-bold text-base">Security Audit Trail</h3>
        </div>
        {securityEvents.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-4">No security events logged recently.</p>
        ) : (
          <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto pr-2">
            {securityEvents.map((evt: any) => (
              <div key={evt.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-white/90">{evt.event_type.replace(/_/g, ' ')}</span>
                  <span className="block text-[11px] text-white/40 mt-0.5">{new Date(evt.created_at).toLocaleString()}</span>
                </div>
                <span className={cn('text-xs font-bold uppercase tracking-wider', evt.success ? 'text-emerald-400' : 'text-rose-500')}>
                  {evt.success ? 'Success' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}