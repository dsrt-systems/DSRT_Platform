import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Medal, Award } from 'lucide-react'

export const revalidate = 60
export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = createClient()
  const { data } = await supabase.rpc('get_leaderboard', { p_limit: 50 })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Top builders on DSRT ranked by real activity, ventures, and impact
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
        {(data || []).map((user: any, i: number) => {
          const isTop3 = i < 3
          const medal =
            i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

          return (
            <Link
              key={user.user_id}
              href={`/profile/${user.username}`}
              className={`flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border/40 last:border-0 ${
                isTop3 ? 'bg-gradient-to-r from-amber-500/5 to-transparent' : ''
              }`}
            >
              <div className="w-10 flex items-center justify-center">
                {medal ? (
                  <span className="text-2xl">{medal}</span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    #{user.rank_position}
                  </span>
                )}
              </div>

              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>
                  {user.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">
                    {user.full_name}
                  </p>
                  {user.is_bot && (
                    <span className="text-[8px] bg-muted px-1 py-0.5 rounded text-muted-foreground">
                      BOT
                    </span>
                  )}
                </div>
                {user.tagline && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {user.tagline}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="font-bold text-sm">{user.score}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  points
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}