'use client'

import { useState, forwardRef, InputHTMLAttributes } from 'react'
import { Eye, EyeSlash, Lock } from '@phosphor-icons/react'
import { AuthInput } from './AuthInput'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ ...props }, ref) => {
    const [show, setShow] = useState(false)

    return (
      <AuthInput
        {...props}
        ref={ref}
        type={show ? 'text' : 'password'}
        leading={<Lock className="w-4 h-4" weight="regular" />}
        trailing={
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="text-white/40 hover:text-white/70 transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeSlash className="w-4 h-4" weight="regular" /> : <Eye className="w-4 h-4" weight="regular" />}
          </button>
        }
      />
    )
  }
)

PasswordInput.displayName = 'PasswordInput'