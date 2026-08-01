'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Key, Lock, History, AlertTriangle, Download, Trash2, Smartphone, CheckCircle2, XCircle, Activity, FileLock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface SecurityDashboardProps {
  profile: any
  auditLogs: any[]
  loginHistory: any[]
  twoFA: any
  deletionRequest: any
  encryptedDocsCount: number
}

export function SecurityDashboard({ 
  profile, 
  auditLogs, 
  loginHistory, 
  twoFA,
  deletionRequest,
  encryptedDocsCount,
}: SecurityDashboardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [downloadingData, setDownloadingData] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const handleDataExport = async () => {
    setDownloadingData(true)
    try {
      const res = await fetch('/api/user/export-data')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dsrt-data-${profile.username}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Your data has been downloaded')
    } catch (err) {
      toast.error('Failed to export data')
    } finally {
      setDownloadingData(false)
    }
  }

  const handleAccountDeletion = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This will be scheduled for 30 days from now. You can cancel anytime before then.'
    )
    if (!confirmed) return

    setDeletingAccount(true)
    try {
      const res = await fetch('/api/user/delete-account', { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Account deletion scheduled for 30 days from now')
      router.refresh()
    } catch (err) {
      toast.error('Failed to schedule deletion')
    } finally {
      setDeletingAccount(false)
    }
  }

  const handleCancelDeletion = async () => {
    const res = await fetch('/api/user/delete-account', { method: 'DELETE' })
    if (res.ok) {
      toast.success('Account deletion cancelled')
      router.refresh()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security & Privacy</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control your account security, privacy, and data
        </p>
      </div>

      {/* Deletion Warning */}
      {deletionRequest && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-500">Account Deletion Scheduled</p>
            <p className="text-xs text-muted-foreground">
              Your account will be permanently deleted on{' '}
              {format(new Date(deletionRequest.scheduled_for), 'PPP')}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleCancelDeletion}>
            Cancel Deletion
          </Button>
        </div>
      )}

      {/* Security Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SecurityCard
          icon={Shield}
          label="Account Status"
          value={profile.is_verified ? 'Verified' : 'Standard'}
          color={profile.is_verified ? 'text-blue-500' : 'text-muted-foreground'}
        />
        <SecurityCard
          icon={Smartphone}
          label="2FA"
          value={twoFA?.is_enabled ? 'Enabled' : 'Disabled'}
          color={twoFA?.is_enabled ? 'text-green-500' : 'text-orange-500'}
        />
        <SecurityCard
          icon={FileLock}
          label="Encrypted Docs"
          value={String(encryptedDocsCount)}
          color="text-purple-500"
        />
        <SecurityCard
          icon={Activity}
          label="Active Sessions"
          value="1"
          color="text-cyan-500"
        />
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          {twoFA?.is_enabled ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-1 bg-green-500/10 text-green-500 rounded-md font-bold uppercase">
                Enabled
              </span>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          ) : (
            <Button size="sm">Enable 2FA</Button>
          )}
        </div>
      </div>

      {/* End-to-End Encryption */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">End-to-End Encryption</p>
            <p className="text-xs text-muted-foreground">
              Sensitive notes and documents encrypted on your device
            </p>
          </div>
          <Link href="/vault">
            <Button variant="outline" size="sm">
              Open Vault
            </Button>
          </Link>
        </div>
        <div className="p-4 bg-muted/20 text-xs text-muted-foreground">
          <p>
            🔒 Your encryption key is stored only on your device. DSRT staff cannot 
            read your encrypted documents. Make sure to back up your key.
          </p>
        </div>
      </div>

      {/* Recent Login Activity */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <History className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-semibold">Recent Login Activity</p>
            <p className="text-xs text-muted-foreground">
              Last 10 login attempts
            </p>
          </div>
        </div>
        {loginHistory.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No login history yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {loginHistory.map((log: any) => (
              <div key={log.id} className="p-4 flex items-center gap-3">
                {log.successful ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {log.successful ? 'Successful login' : 'Failed login attempt'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.browser || 'Unknown browser'} · {log.location || log.ip_address || 'Unknown location'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <p className="font-semibold">Activity Audit Log</p>
            <p className="text-xs text-muted-foreground">
              Track all access to your data
            </p>
          </div>
        </div>
        {auditLogs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No activity logged yet</p>
          </div>
        ) : (
          <div className="divide-y max-h-64 overflow-y-auto">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="p-3 flex items-center gap-3 text-xs">
                <div className={cn(
                  'w-6 h-6 rounded flex items-center justify-center flex-shrink-0',
                  log.severity === 'critical' && 'bg-red-500/10 text-red-500',
                  log.severity === 'warning' && 'bg-orange-500/10 text-orange-500',
                  log.severity === 'info' && 'bg-muted text-muted-foreground'
                )}>
                  <span className="text-[10px] font-bold">{log.action[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium capitalize">
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  {log.resource_type && (
                    <p className="text-muted-foreground">
                      on {log.resource_type}
                    </p>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Export */}
      <div className="bg-card border rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Download className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Export Your Data</p>
          <p className="text-xs text-muted-foreground">
            Download all your data in JSON format (GDPR compliant)
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleDataExport}
          disabled={downloadingData}
        >
          {downloadingData ? 'Preparing...' : 'Download'}
        </Button>
      </div>

      {/* Account Deletion */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-500">Delete Account</p>
          <p className="text-xs text-muted-foreground">
            Permanently delete your account and all associated data (30 day grace period)
          </p>
        </div>
        {!deletionRequest && (
          <Button 
            variant="destructive"
            onClick={handleAccountDeletion}
            disabled={deletingAccount}
          >
            {deletingAccount ? 'Processing...' : 'Delete Account'}
          </Button>
        )}
      </div>
    </div>
  )
}

function SecurityCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', color)} strokeWidth={2.5} />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          {label}
        </p>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}