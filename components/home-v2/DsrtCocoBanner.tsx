'use client'

import Link from 'next/link'
import { Sparkle, Rocket, Lightning, Brain, Code, Palette, Briefcase, GraduationCap } from '@phosphor-icons/react'

const CAPABILITIES = [
  { Icon: Code, label: 'Build websites & apps' },
  { Icon: Briefcase, label: 'Business automation' },
  { Icon: Brain, label: 'AI-powered planning' },
  { Icon: GraduationCap, label: 'College to career' },
  { Icon: Palette, label: 'Design anything' },
  { Icon: Lightning, label: 'Workflow engine' },
]

export function DsrtCocoBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60">
      {/* Abstract gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0b2e] via-[#0a0a1f] to-[#0f0a1a]" />

        {/* Animated gradient blobs */}
        <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-purple-500/15 rounded-full blur-[80px]"
             style={{ animation: 'float1 20s ease-in-out infinite' }} />
        <div className="absolute bottom-0 right-0 w-[180px] h-[180px] bg-blue-500/12 rounded-full blur-[60px]"
             style={{ animation: 'float2 25s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] bg-cyan-500/10 rounded-full blur-[70px]"
             style={{ animation: 'float3 22s ease-in-out infinite' }} />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]"
             style={{
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
               backgroundSize: '32px 32px',
             }} />

        {/* Bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Robot mascot + Logo */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/15 to-cyan-500/10 border border-white/10 flex items-center justify-center shadow-[0_4px_16px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <span className="text-3xl">🤖</span>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-white tracking-tight leading-tight">
              DSRT COCO
            </h2>
            <p className="text-[11.5px] text-zinc-400 font-medium tracking-wide uppercase">
              Your Workspace Companion
            </p>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-[15px] text-zinc-200 leading-relaxed mb-2 font-medium">
          Plan. Build. Automate. <span className="text-purple-300">Anything.</span>
        </p>
        <p className="text-[12.5px] text-zinc-400 leading-relaxed mb-5">
          From college homework to enterprise workflows.
          Break complex tasks into steps, get AI predictions,
          build websites, manage inventory — name it, COCO does it.
        </p>

        {/* Capability pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {CAPABILITIES.map(c => (
            <div
              key={c.label}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-zinc-300"
            >
              <c.Icon size={11} weight="regular" className="text-zinc-400" />
              {c.label}
            </div>
          ))}
        </div>

        {/* Example use cases */}
        <div className="space-y-2 mb-6">
          <UseCaseRow emoji="🎓" text="Break my thesis into 30-day milestones" />
          <UseCaseRow emoji="🍽️" text="Design restaurant menu + find locations" />
          <UseCaseRow emoji="🏗️" text="Build an inventory management system" />
          <UseCaseRow emoji="📊" text="Create a business plan with projections" />
          <UseCaseRow emoji="🎨" text="Design a complete brand identity" />
        </div>

        {/* CTA */}
        <Link
          href="/projects"
          className={
            'flex items-center justify-center gap-2 w-full h-11 rounded-xl ' +
            'bg-gradient-to-b from-white/95 to-white/85 text-black ' +
            'hover:from-white hover:to-white/90 ' +
            'text-[13.5px] font-bold tracking-tight transition-all ' +
            'shadow-[0_2px_12px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
          }
        >
          <Rocket size={14} weight="fill" />
          Try DSRT COCO
        </Link>

        <p className="text-[10.5px] text-zinc-500 text-center mt-3">
          Free for all builders. No limits.
        </p>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 25px) scale(1.15); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          40% { transform: translate(-40%, -60%) scale(1.1); }
          80% { transform: translate(-60%, -45%) scale(0.9); }
        }
      `}</style>
    </div>
  )
}

function UseCaseRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-zinc-300">
      <span className="text-base">{emoji}</span>
      <span className="italic text-zinc-400">&ldquo;{text}&rdquo;</span>
    </div>
  )
}