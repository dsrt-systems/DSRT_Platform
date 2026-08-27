export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">{label}</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  )
}