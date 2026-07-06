'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Gift, Copy, Check, Share2, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface ReferralViewProps {
  code: any
  referrals: any[]
}

export function ReferralView({ code, referrals }: ReferralViewProps) {
  const [copied, setCopied] = useState(false)

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${code?.code}`

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on DSRT',
          text: 'DSRT is the professional builder ecosystem for founders, engineers, and designers.',
          url: referralLink,
        })
      } catch {}
    } else {
      copyLink()
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 p-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Invite Builders</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Every builder you invite makes DSRT stronger. Share your invite
              link and grow the ecosystem.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Your invite code
            </p>
            <p className="text-3xl font-bold font-mono tracking-wider">
              {code?.code || 'LOADING'}
            </p>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Invite link
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs truncate bg-muted/40 px-3 py-2 rounded font-mono">
                {referralLink}
              </code>
              <Button size="sm" variant="outline" onClick={copyLink}>
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button size="sm" onClick={shareLink}>
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">
            Builders you invited ({referrals.length})
          </h2>
        </div>

        {referrals.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              No one has joined via your link yet.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Share your link with builders you know.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <Link
                key={r.id}
                href={`/profile/${r.users?.username}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={r.users?.avatar_url} />
                  <AvatarFallback>
                    {r.users?.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{r.users?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined{' '}
                    {formatDistanceToNow(new Date(r.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                  Active
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}