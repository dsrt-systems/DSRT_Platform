'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Shield, Loader2 } from 'lucide-react'
import { useOnboardingV2Store } from '@/stores/onboardingV2Store'
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter'
import { cn } from '@/lib/utils'

function PinInput({ 
  value, 
  onChange, 
  autoFocus = false, 
  disabled = false,
}: { 
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
  disabled?: boolean
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, ' ').substring(0, 6).split('')

  const handleChange = (idx: number, digit: string) => {
    const cleaned = digit.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[idx] = cleaned || ' '
    const newValue = newDigits.join('').trim()
    onChange(newValue)

    if (cleaned && idx < 5) {
      inputsRef.current[idx + 1]?.focus()
    }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx].trim() && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted)
      setTimeout(() => {
        const focusIdx = Math.min(pasted.length, 5)
        inputsRef.current[focusIdx]?.focus()
      }, 0)
    }
  }

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => { inputsRef.current[idx] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx].trim()}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          autoFocus={autoFocus && idx === 0}
          disabled={disabled}
          className={cn(
            "w-full h-14 text-center text-[20px] font-bold font-mono rounded-md",
            "bg-[#050505] border border-white/10 text-white",
            "focus:outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF]",
            "transition-all disabled:opacity-40"
          )}
        />
      ))}
    </div>
  )
}

export function SecurityPinStep() {
  const router = useRouter()
  const {
    updateData,
    isSaving,
    setSaving,
    setCurrentStep,
    setStepStates,
    setOnboardingState,
    reset,
  } = useOnboardingV2Store()

  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')

  const handleContinuePin = () => {
    if (pin.length !== 6) {
      toast.error('Enter all 6 digits')
      return
    }
    if (/^(\d)\1{5}$/.test(pin)) {
      toast.error('PIN cannot be all same digits')
      return
    }
    if (['123456', '654321', '000000', '111111', '123123', '456789'].includes(pin)) {
      toast.error('PIN is too common — choose another')
      return
    }
    setStep('confirm')
  }

  const handleFinalize = async () => {
    if (confirmPin.length !== 6) {
      toast.error('Enter all 6 digits')
      return
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match. Try again.')
      setConfirmPin('')
      return
    }

    setSaving(true)
    try {
      // 1. Save PIN
      const pinRes = await fetch('/api/auth/pin/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, confirmPin }),
      })
      const pinData = await pinRes.json()
      if (!pinRes.ok) throw new Error(pinData.error || 'Could not save PIN')

      // 2. Mark step complete
      const stepRes = await fetch('/api/onboarding/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'security_pin',
          status: 'COMPLETED',
          data: {},
        }),
      })
      const stepData = await stepRes.json()
      if (!stepRes.ok) throw new Error(stepData.error || 'Could not save step')

      setStepStates(stepData.step_states)
      setOnboardingState(stepData.onboarding_state)

      // 3. Finalize onboarding
      const completeRes = await fetch('/api/onboarding/complete', { method: 'POST' })
      if (!completeRes.ok) {
        const errData = await completeRes.json()
        throw new Error(errData.error || 'Could not complete onboarding')
      }

      reset()
      toast.success('DSRT Connect setup complete')
      router.push('/welcome')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const goBackToEnter = () => {
    setStep('enter')
    setConfirmPin('')
  }

  return (
    <div className="space-y-8">
      {/* Icon and description */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-[#4F7CFF]" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-white leading-tight">
            {step === 'enter' ? 'Create your 6-digit DSRT PIN' : 'Confirm your PIN'}
          </p>
          <p className="text-[13px] text-white/60 mt-1 leading-relaxed">
            {step === 'enter' 
              ? 'Use this PIN as a faster alternative to your password. It works from any device where you sign in with your email.'
              : 'Enter the same 6 digits again to confirm.'}
          </p>
        </div>
      </div>

      {/* PIN Input */}
      {step === 'enter' ? (
        <div className="space-y-3">
          <label className="text-[12px] font-semibold text-white/70 tracking-wide">
            YOUR PIN
          </label>
          <PinInput value={pin} onChange={setPin} autoFocus />
          <p className="text-[11px] text-white/40 mt-2">
            Numeric only. Cannot be repeating (111111) or common sequences.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="text-[12px] font-semibold text-white/70 tracking-wide">
            CONFIRM PIN
          </label>
          <PinInput value={confirmPin} onChange={setConfirmPin} autoFocus />
          <button
            type="button"
            onClick={goBackToEnter}
            className="text-[12px] text-white/50 hover:text-white transition-colors mt-2"
          >
            ← Change PIN
          </button>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-md border border-white/[0.06] bg-[#0A0A0C] p-4">
        <p className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-2">
          Why we require a PIN
        </p>
        <p className="text-[12px] text-white/65 leading-relaxed">
          Your DSRT PIN is a fast, secure alternative to typing your full password. You can use it on the login screen from any device. If you sign in with Google, you can still enter your email + PIN instead.
        </p>
      </div>

      <OnboardingFooter
        canContinue={step === 'enter' ? pin.length === 6 : confirmPin.length === 6}
        onBack={step === 'enter' ? () => setCurrentStep('personalization') : goBackToEnter}
        onContinue={step === 'enter' ? handleContinuePin : handleFinalize}
        continueLabel={step === 'enter' ? 'Continue' : 'Complete Setup'}
        isSaving={isSaving}
        isLast={step === 'confirm'}
      />
    </div>
  )
}