'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { DsrtLogo } from '@/components/ui/DsrtLogo'

export function LandingHeader() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6"
    >
      <DsrtLogo size={28} />

      <nav className="hidden lg:flex items-center gap-8">
        {['Discover', 'Communities', 'Projects', 'Ventures', 'Pricing'].map((item) => (
          <Link
            key={item}
            href={`/${item.toLowerCase()}`}
            className="text-[13px] font-medium text-white/60 hover:text-white transition-colors"
          >
            {item}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-[13px] font-medium text-white/80 hover:text-white transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="text-[13px] font-semibold text-[#4F7CFF] hover:text-white border border-[#4F7CFF]/30 hover:border-[#4F7CFF] hover:bg-[#4F7CFF]/10 rounded-lg px-4 py-2 transition-all"
        >
          Sign up →
        </Link>
      </div>
    </motion.header>
  )
}