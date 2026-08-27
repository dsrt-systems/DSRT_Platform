import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/providers/AppProviders'

export const metadata: Metadata = {
  title: 'DSRT — Build with the right people',
  description: 'The command center for builders. Where mission meets execution.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#05070D] text-white selection:bg-[#4F7CFF]/30">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}