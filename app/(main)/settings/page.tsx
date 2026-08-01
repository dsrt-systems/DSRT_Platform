import Link from 'next/link'
import { User, Bell, Shield, CreditCard, Puzzle, Lock, FileLock } from 'lucide-react'

const sections = [
  { icon: User, name: 'Profile', href: '/settings/profile', desc: 'Your identity and public info' },
  { icon: Puzzle, name: 'Integrations', href: '/settings/integrations', desc: 'GitHub, LinkedIn, Twitter, and more' },
  { icon: Shield, name: 'Security & Privacy', href: '/settings/security', desc: 'Password, 2FA, encryption, data export', highlight: true },
  { icon: FileLock, name: 'Encrypted Vault', href: '/vault', desc: 'End-to-end encrypted personal notes' },
  { icon: Bell, name: 'Notifications', href: '/settings/notifications', desc: 'How you get alerted' },
  { icon: CreditCard, name: 'Billing', href: '/settings/billing', desc: 'Plan and payment' },
]

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your DSRT account and preferences
        </p>
      </div>

      <div className="space-y-2">
        {sections.map(section => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:border-primary/30 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                section.highlight ? 'bg-blue-500/10 text-blue-500' : 'bg-muted'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{section.name}</p>
                  {section.highlight && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-md font-medium">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {section.desc}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}