import { cn } from '@/lib/utils'

interface ProfileCardProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export function ProfileCard({ children, className, noPadding = false }: ProfileCardProps) {
  return (
    <div className={cn(
      'bg-gradient-to-b from-zinc-900/40 via-zinc-950/40 to-zinc-950/60',
      'border border-zinc-800/60 rounded-2xl',
      'shadow-[0_1px_0_rgba(255,255,255,0.025)_inset,0_2px_10px_rgba(0,0,0,0.25)]',
      !noPadding && 'p-4',
      className
    )}>
      {children}
    </div>
  )
}

interface ProfileCardHeaderProps {
  title: string
  action?: React.ReactNode
}

export function ProfileCardHeader({ title, action }: ProfileCardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[13px] font-bold text-zinc-200 tracking-tight">{title}</h2>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}