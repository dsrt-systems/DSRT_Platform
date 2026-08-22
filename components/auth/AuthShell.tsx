'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LockKey } from '@phosphor-icons/react'
import { DsrtLogo } from '@/components/ui/DsrtLogo'
import { SignInForm } from './SignInForm'
// FIX: Imported as SignUpForm (capital U) to match the actual export in your file!
import { SignUpForm } from './SignupForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { VerifyEmailScreen } from './VerifyEmailScreen'

export type AuthView = 'signin' | 'signup' | 'forgot' | 'verify'

interface Props {
  initialView?: AuthView
}

export function AuthShell({ initialView = 'signin' }: Props) {
  const [view, setView] = useState<AuthView>(initialView)
  const [verifyEmail, setVerifyEmail] = useState('')

  const handleVerify = (email: string) => {
    setVerifyEmail(email)
    setView('verify')
  }

  const renderView = () => {
    switch (view) {
      case 'signin':
        return <SignInForm onSwitchView={setView} />
      case 'signup':
        // FIX: Renders the properly capitalized SignUpForm component
        return <SignUpForm onSwitchView={setView} onVerify={handleVerify} />
      case 'forgot':
        return <ForgotPasswordForm onSwitchView={setView} />
      case 'verify':
        return <VerifyEmailScreen email={verifyEmail} onSwitchView={setView} />
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
      className="w-full max-w-[420px] relative z-10"
    >
      <div className="rounded-xl border border-white/[0.08] bg-[#0A0D14] shadow-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-8">
          <div className="flex justify-center mb-8">
            <DsrtLogo size={32} showText={false} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Clean Enterprise Security Footer */}
        <div className="border-t border-white/[0.06] px-8 py-3.5 bg-[#05070A] flex items-center justify-center gap-2 text-white/40">
          <LockKey className="w-3.5 h-3.5" weight="bold" />
          <span className="text-[11.5px] font-medium">Secured by enterprise-grade encryption</span>
        </div>
      </div>
    </motion.div>
  )
}