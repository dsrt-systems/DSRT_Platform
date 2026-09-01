import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/providers/AppProviders'

export const metadata: Metadata = {
  title: 'DSRT — Build with the right people',
  description: 'The command center for builders. Where mission meets execution.',
  icons: {
    icon: [
      { url: '/favicon.ico?v=3', sizes: 'any' },
      { url: '/favicon-96x96.png?v=3', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png?v=3', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png?v=3', sizes: '180x180' }],
    shortcut: [{ url: '/favicon.ico?v=3' }],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className="font-sans antialiased bg-[#05070D] text-white selection:bg-[#4F7CFF]/30"
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}