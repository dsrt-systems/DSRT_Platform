'use client'

import Link from 'next/link'
import { Rocket } from 'lucide-react'

interface VenturesSectionProps {
  startupMembers: any[]
  userId: string
  isOwnProfile: boolean
}

export function VenturesSection({
  startupMembers,
  isOwnProfile,
}: VenturesSectionProps) {
  if (startupMembers.length === 0) {
    return isOwnProfile ? (
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6">
        <h2 className="text-lg font-bold mb-3">Ventures</h2>
        <p className="text-sm text-muted-foreground">
          You have not joined any venture yet.{' '}
          <Link href="/ventures/new" className="text-primary hover:underline">
            Start one
          </Link>{' '}
          or{' '}
          <Link href="/explore?tab=ventures" className="text-primary hover:underline">
            explore
          </Link>
          .
        </p>
      </div>
    ) : null
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 space-y-4">
      <h2 className="text-lg font-bold">Ventures</h2>
      <div className="space-y-3">
        {startupMembers.map((m) => (
          <Link
            key={m.id}
            href={`/ventures/${m.startups?.slug}`}
            className="flex gap-3 p-3 rounded-xl border border-border/40 hover:border-border hover:bg-muted/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
              {m.startups?.logo_url ? (
                <img
                  src={m.startups.logo_url}
                  alt={m.startups.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Rocket className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold truncate">{m.startups?.name}</p>
                {m.startups?.is_verified && (
                  <span className="text-primary text-xs">✓</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {m.role} {m.startups?.stage && `• ${m.startups.stage}`}
              </p>
              {m.startups?.tagline && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {m.startups.tagline}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}