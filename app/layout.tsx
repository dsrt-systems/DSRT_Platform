import type { Metadata } from 'next'
import { Dancing_Script } from 'next/font/google'
import './globals.css'
import { AppProviders } from '@/components/providers/AppProviders'

// Initialize the cursive font
const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-cursive',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.dsrtai.com'),
  
  // FIXED: Using a template prevents child pages from duplicating the name
  title: {
    default: 'DSRT — Build with the right people',
    template: '%s · DSRT'
  },
  
  description: 'The command center for builders. Where mission meets execution.',
  applicationName: 'DSRT',
  keywords: ['DSRT', 'builders', 'ventures', 'projects', 'collaboration'],
  authors: [{ name: 'DSRT' }],
  creator: 'DSRT',
  publisher: 'DSRT',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: [{ url: '/favicon.ico' }],
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.ico',
        color: '#05070D',
      },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DSRT',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.dsrtai.com',
    title: 'DSRT — Build with the right people',
    description: 'The command center for builders. Where mission meets execution.',
    siteName: 'DSRT',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DSRT — Build with the right people',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DSRT — Build with the right people',
    description: 'The command center for builders. Where mission meets execution.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport = {
  themeColor: '#05070D',
  colorScheme: 'dark' as const,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        // ADDED: dancingScript.variable here so Tailwind can use it
        className={`font-sans antialiased bg-[#05070D] text-white selection:bg-[#4F7CFF]/30 ${dancingScript.variable}`}
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}