'use client'

import { motion } from 'framer-motion'

export function VentureLoader({ message = 'Loading' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      {/* Animated Hexagonal Loader */}
      <div className="relative w-20 h-20">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-sm"
            style={{
              background: `linear-gradient(135deg, hsl(${217 + i * 20}, 91%, 60%), hsl(${280 + i * 15}, 91%, 60%))`,
              transformOrigin: '50% 50%',
            }}
            initial={{ x: -6, y: -6 }}
            animate={{
              rotate: 360,
              x: Math.cos((i * 60 * Math.PI) / 180) * 30 - 6,
              y: Math.sin((i * 60 * Math.PI) / 180) * 30 - 6,
              scale: [1, 1.4, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
        
        {/* Central pulsing core */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Message with dot animation */}
      <div className="flex items-center gap-1">
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 bg-muted-foreground rounded-full"
            animate={{
              opacity: [0, 1, 0],
              y: [0, -3, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Skeleton loader for sections
export function SectionSkeleton({ height = 'h-32' }: { height?: string }) {
  return (
    <div className={`bg-card border rounded-2xl p-6 ${height} relative overflow-hidden`}>
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{
          translateX: ['100%', '-100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--muted) / 0.5), transparent)',
        }}
      />
      <div className="space-y-3 relative">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted/60 rounded w-2/3" />
        <div className="h-3 bg-muted/60 rounded w-1/2" />
      </div>
    </div>
  )
}

// Live pulse indicator (for real-time features)
export function LivePulse({ label = 'LIVE' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 rounded-full">
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-red-500"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}