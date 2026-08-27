'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  ShieldCheck,
  DeviceMobile,
  Desktop,
  DeviceTablet,
  Key,
  EnvelopeSimple,
  SignOut,
  ArrowRight,
  CheckCircle,
  Warning,
  Circle
} from '@phosphor-icons/react'

interface SessionRow {
  id: string
  device_name: string
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser: string
  os: string
  city?: string
  country?: string
  is_current: boolean
  last_active_at: string
  created_at: string
}

export function SecurityDashboard({ profile, securityEvents, initialMfaState }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [revoking, setRevoking] = useState(false)
  const [requestingVerification, setRequestingVerification] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(initialMfaState)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [enrollingMfa, setEnrollingMfa] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoadingSessions(true)
    try {
      const res = await fetch('/api/auth/sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {
      setSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }

  const revokeSession = async (id: string) => {
    try {
      const res = await fetch(`/api/auth/sessions?session_id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Session revoked')
      loadSessions()
    } catch {
      toast.error('Failed to revoke session')
    }
  }

  const revokeAllOthers = async () => {
    setRevoking(true)
    try {
      const res = await fetch('/api/auth/sessions?scope=all_others', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('All other sessions revoked')
      loadSessions()
    } catch {
      toast.error('Failed to revoke sessions')
    } finally {
      setRevoking(false)
    }
  }

  const requestVerification = async () => {
    setRequestingVerification(true)
    try {
      const res = await fetch('/api/auth/request-verification', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Verification email queued')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to request verification')
    } finally {
      setRequestingVerification(false)
    }
  }

  const startMfaEnrollment = async () => {
    setEnrollingMfa(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'DSRT Connect',
        friendlyName: `DSRT · ${profile.username}`
      })
      if (error) throw error
      setQrCode(data.totp.qr_code)
      setFactorId(data.id)
    } catch (err: any) {
      toast.error(err.message || 'Failed to start MFA setup')
    } finally {
      setEnrollingMfa(false)
    }
  }

  const verifyMfa = async () => {
    if (!factorId || mfaCode.length !== 6) return toast.error('Enter a 6-digit code')
    setEnrollingMfa(true)
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) throw challenge.error

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: mfaCode
      })
      if (verify.error) throw verify.error

      const res = await fetch('/api/auth/mfa/finalize', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMfaEnabled(true)
      setRecoveryCodes(data.recoveryCodes)
      setQrCode(null)
      setMfaCode('')
      toast.success('Two-factor authentication enabled')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'MFA verification failed')
    } finally {
      setEnrollingMfa(false)
    }
  }

  const downloadCodes = () => {
    if (!recoveryCodes) return
    const content = `DSRT CONNECT RECOVERY CODES\n\nAccount: @${profile.username}\nGenerated: ${new Date().toLocaleString()}\n\n${recoveryCodes.join('\n')}\n\nKeep these codes secure. Each can be used once.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dsrt-recovery-${profile.username}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isVerified = profile?.email_verification_status === 'VERIFIED'
  const trustLevel = profile?.trust_level || 'NEW'
  const trustScore = profile?.trust_score || 0

  const deviceIcon = (type: string) => {
    if (type === 'mobile') return DeviceMobile
    if (type === 'tablet') return DeviceTablet
    return Desktop
  }

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-tight">Security</h1>
        <p className="text-[13px] text-white/50 mt-1">Manage identity, trust, and access to your DSRT account.</p>
      </div>

      {/* Trust Overview */}
      <section className="border border-white/[0.06] bg-[#0A0D14] rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Trust Level</p>
            <p className="text-[18px] font-semibold mt-0.5">{trustLevel}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Score</p>
            <p className="text-[18px] font-mono font-semibold mt-0.5 text-[#4F7CFF]">{trustScore}<span className="text-white/30 text-[12px]">/100</span></p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4F7CFF] transition-all duration-500"
              style={{ width: `${trustScore}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-white/30 uppercase tracking-wider font-semibold">
            <span>New</span>
            <span>Established</span>
            <span>Verified</span>
            <span>Trusted</span>
          </div>
        </div>
      </section>

      {/* Email Verification */}
      <section className="border border-white/[0.06] bg-[#0A0D14] rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
            isVerified ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[0.03] border border-white/[0.06]"
          )}>
            {isVerified ? <CheckCircle className="w-4 h-4 text-emerald-400" weight="fill" /> : <EnvelopeSimple className="w-4 h-4 text-white/50" weight="regular" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white">Email verification</p>
            <p className="text-[12px] text-white/50 mt-0.5">
              {isVerified ? `Verified · ${profile.email}` : `Not verified · ${profile.email}`}
            </p>
          </div>
          {!isVerified && (
            <button
              onClick={requestVerification}
              disabled={requestingVerification}
              className="h-8 px-3 rounded-md bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[12px] font-semibold transition-all disabled:opacity-60"
            >
              {requestingVerification ? 'Sending...' : 'Verify'}
            </button>
          )}
        </div>
      </section>

      {/* Two-Factor Authentication */}
      <section className="border border-white/[0.06] bg-[#0A0D14] rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
            mfaEnabled ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[0.03] border border-white/[0.06]"
          )}>
            <Key className={cn("w-4 h-4", mfaEnabled ? "text-emerald-400" : "text-white/50")} weight="regular" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white">Two-factor authentication</p>
            <p className="text-[12px] text-white/50 mt-0.5">
              {mfaEnabled ? 'Enabled with authenticator app' : 'Adds an extra layer of security'}
            </p>
          </div>
          {!mfaEnabled && !qrCode && (
            <button
              onClick={startMfaEnrollment}
              disabled={enrollingMfa}
              className="h-8 px-3 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-white text-[12px] font-semibold border border-white/[0.06] transition-all"
            >
              Enable
            </button>
          )}
          {mfaEnabled && (
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Active</span>
          )}
        </div>

        {qrCode && !mfaEnabled && (
          <div className="border-t border-white/[0.04] px-5 py-5">
            <p className="text-[12px] text-white/60 mb-4">Scan with Google Authenticator, 1Password, or Authy, then enter the 6-digit code.</p>
            <div className="flex gap-5 items-start">
              <div className="bg-white p-2 rounded-md flex-shrink-0">
                <img src={qrCode} alt="MFA QR" className="w-32 h-32" />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="h-10 px-3 rounded-md bg-[#0F1420] border border-white/10 text-white font-mono text-[15px] tracking-widest focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]/40"
                />
                <button
                  onClick={verifyMfa}
                  disabled={enrollingMfa || mfaCode.length !== 6}
                  className="h-10 rounded-md bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[13px] font-semibold disabled:opacity-50"
                >
                  {enrollingMfa ? 'Verifying...' : 'Verify & enable'}
                </button>
              </div>
            </div>
          </div>
        )}

        {recoveryCodes && (
          <div className="border-t border-white/[0.04] px-5 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-semibold text-emerald-400">Save your recovery codes</p>
              <button onClick={downloadCodes} className="text-[11px] text-white/50 hover:text-white transition-colors">Download .txt</button>
            </div>
            <p className="text-[11px] text-white/50 mb-3">Shown only once. Each can be used once if you lose your device.</p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
              {recoveryCodes.map((c, i) => (
                <div key={i} className="px-2.5 py-1.5 rounded bg-[#0F1420] border border-white/[0.04] text-white/80">
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Active Sessions */}
      <section className="border border-white/[0.06] bg-[#0A0D14] rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-white">Active sessions</p>
            <p className="text-[11px] text-white/40 mt-0.5">Devices signed in to your DSRT account</p>
          </div>
          {sessions.filter(s => !s.is_current).length > 0 && (
            <button
              onClick={revokeAllOthers}
              disabled={revoking}
              className="h-7 px-2.5 rounded-md text-[11px] font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all"
            >
              Sign out other sessions
            </button>
          )}
        </div>

        <div className="divide-y divide-white/[0.04]">
          {loadingSessions ? (
            <div className="px-5 py-6 text-[12px] text-white/40 text-center">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="px-5 py-6 text-[12px] text-white/40 text-center">No sessions tracked yet</div>
          ) : (
            sessions.map((s) => {
              const Icon = deviceIcon(s.device_type)
              return (
                <div key={s.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                  <Icon className="w-4 h-4 text-white/40 flex-shrink-0" weight="regular" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] text-white/90 font-medium truncate">{s.device_name}</p>
                      {s.is_current && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider font-semibold">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {s.city && s.country ? `${s.city}, ${s.country} · ` : ''}
                      Active {formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!s.is_current && (
                    <button
                      onClick={() => revokeSession(s.id)}
                      className="text-[11px] text-white/40 hover:text-red-400 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Security Activity */}
      <section className="border border-white/[0.06] bg-[#0A0D14] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <p className="text-[13px] font-semibold text-white">Security activity</p>
          <p className="text-[11px] text-white/40 mt-0.5">Recent events on your account</p>
        </div>
        <div className="divide-y divide-white/[0.04] max-h-72 overflow-y-auto">
          {(!securityEvents || securityEvents.length === 0) ? (
            <div className="px-5 py-6 text-[12px] text-white/40 text-center">No security events yet</div>
          ) : (
            securityEvents.slice(0, 15).map((e: any) => (
              <div key={e.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02]">
                <Circle className={cn("w-2 h-2 flex-shrink-0", e.success ? "text-emerald-400" : "text-red-400")} weight="fill" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/90 font-medium">{e.event_type.replace(/_/g, ' ').toLowerCase()}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}