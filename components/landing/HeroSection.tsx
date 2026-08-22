'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { RotatingHeadline } from './RotatingHeadline'

const DSRT_PHRASES = [
  'builders connect.',
  'ideas become projects.',
  'projects become ventures.',
  'talent meets opportunity.',
  'ambition becomes action.',
  'the future is built.'
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

export function HeroSection() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col justify-center w-full max-w-2xl relative z-10"
    >
      <motion.p variants={itemVariants} className="text-[12px] font-semibold tracking-widest text-white/50 uppercase mb-4">
        DSRT Connect
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-[32px] sm:text-[40px] lg:text-[46px] font-bold tracking-tight leading-[1.1] text-white mb-1">
          A platform where
        </h1>
        <RotatingHeadline phrases={DSRT_PHRASES} />
      </motion.div>

      <motion.p variants={itemVariants} className="text-[16px] leading-relaxed text-white/70 mt-2 max-w-[500px]">
        The intelligent network for builders, projects, and ventures to securely collaborate and manage operations.
      </motion.p>

      <motion.div variants={itemVariants} className="flex items-center gap-3 mt-10">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[14px] font-semibold transition-colors"
        >
          Create account
        </Link>
        <Link
          href="/product"
          className="inline-flex items-center justify-center h-10 px-6 rounded-md border border-white/15 hover:border-white/30 hover:bg-white/[0.03] text-white text-[14px] font-medium transition-colors"
        >
          Overview
        </Link>
      </motion.div>
    </motion.div>
  )
}