'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { Eye, EyeSlash, Lock } from '@phosphor-icons/react'
import { AuthInput } from './AuthInput'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  showForgotLink?: boolean
  onForgotClick?: () => void
}

export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, showForgotLink, onForgotClick, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="relative">
        <AuthInput
          ref={ref}
          type={visible ? 'text' : 'password'}
          label={label}
          error={error}
          leading={<Lock className="w-4 h-4" weight="bold" />}
          trailing={
            showForgotLink ? (
              <button
                type="button"
                onClick={onForgotClick}
                className="text-[11.5px] text-[#4F7CFF] hover:text-[#7093FF] font-semibold transition-colors"
              >
                Forgot password?
              </button>
            ) : undefined
          }
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-[34px] w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white/80 transition-colors"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'