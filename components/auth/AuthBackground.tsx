// filepath: components/auth/AuthBackground.tsx
'use client'

export function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#05070D]">
      {/* Top Blue Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#4F7CFF] opacity-[0.15] blur-[120px] rounded-full pointer-events-none" />

      {/* Responsive Wireframe Torus */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-[-15%] lg:top-1/2 lg:-translate-y-1/2 w-[800px] h-[800px] opacity-[0.15]">
        <svg viewBox="0 0 800 800" className="w-full h-full animate-[spin_120s_linear_infinite]">
          {Array.from({ length: 24 }).map((_, i) => (
            <ellipse
              key={i}
              cx="400"
              cy="400"
              rx="320"
              ry="120"
              transform={`rotate(${i * 15} 400 400)`}
              stroke="url(#wireframe-gradient)"
              fill="none"
              strokeWidth="1"
            />
          ))}
          <defs>
            <linearGradient id="wireframe-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F7CFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Fade masks so lines disappear smoothly at edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05070D] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#05070D] pointer-events-none" />
    </div>
  )
}