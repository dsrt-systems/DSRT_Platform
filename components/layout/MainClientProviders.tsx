'use client'

import { CommandPaletteProvider } from '@/components/command/CommandPaletteProvider'

export function MainClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      {children}
    </CommandPaletteProvider>
  )
}
