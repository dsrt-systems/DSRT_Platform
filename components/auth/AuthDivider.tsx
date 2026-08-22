export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[11px] uppercase tracking-[0.15em] text-white/30 font-bold">
        {label}
      </span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  )
}