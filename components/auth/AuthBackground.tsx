// filepath: components/auth/AuthBackground.tsx
'use client'

export function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#05070D]">
      {/* Auth background image from /public/auth-bg.jpg */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/auth-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center opacity-45 mix-blend-screen"
      />

      {/* Dark overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05070D]/35 via-[#05070D]/75 to-[#05070D]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#05070D]/92 via-[#05070D]/55 to-[#05070D]/25" />

      {/* Soft top glow */}
      <div className="absolute top-[-18%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-[#4F7CFF] opacity-[0.14] blur-[120px] rounded-full" />

      {/* Optional subtle wireframe torus (desktop-friendly) */}
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-[-10%] lg:top-1/2 lg:-translate-y-1/2 w-[760px] h-[760px] opacity-[0.12]">
        <svg viewBox="0 0 800 800" className="w-full h-full animate-[spin_140s_linear_infinite]">
          {Array.from({ length: 20 }).map((_, i) => (
            <ellipse
              key={i}
              cx="400"
              cy="400"
              rx="300"
              ry="110"
              transform={`rotate(${i * 18} 400 400)`}
              stroke="url(#auth-wire)"
              fill="none"
              strokeWidth="1"
            />
          ))}
          <defs>
            <linearGradient id="auth-wire" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F7CFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}