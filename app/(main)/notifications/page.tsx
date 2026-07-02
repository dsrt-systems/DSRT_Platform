import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MarkAllRead } from '@/components/notifications/MarkAllRead'

export default async function NotificationsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, from_user:from_user_id(id, full_name, username, avatar_url)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Activity from people, projects, and the ecosystem
          </p>
        </div>
        {notifications && notifications.length > 0 && <MarkAllRead />}
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center space-y-3">
          <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">
            No notifications yet. Start engaging with the community.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
          {notifications.map((n: any) => (
            <Link
              key={n.id}
              href={n.action_url || '#'}
              className={`block p-4 hover:bg-muted/40 transition-colors border-b border-border/40 last:border-0 ${
                !n.read ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {n.from_user ? (
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={n.from_user.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {n.from_user.full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{n.title}</span>
                    {n.message && (
                      <span className="text-muted-foreground"> · {n.message}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}