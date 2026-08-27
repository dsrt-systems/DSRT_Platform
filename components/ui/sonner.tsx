'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'dark' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[#0A0D14] group-[.toaster]:text-white group-[.toaster]:border-white/[0.08] group-[.toaster]:shadow-2xl',
          description: 'group-[.toast]:text-white/60',
          actionButton:
            'group-[.toast]:bg-[#4F7CFF] group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-white/10 group-[.toast]:text-white/70',
        },
      }}
      {...props}
    />
  )
}

export default Toaster