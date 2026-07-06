import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  metadataBase: new URL('https://dsrtai.com'),
  title: {
    default: 'DSRT AI — Build with the right people',
    template: '%s | DSRT AI',
  },
  description:
    'DSRT AI is a professional builder ecosystem where founders, engineers, designers, and investors collaborate to build the next generation of startups. Join thousands of builders. Get AI-powered mentorship. Ship real projects.',
  keywords: [
    'DSRT',
    'DSRT AI',
    'dsrtai',
    'builder ecosystem',
    'startup network',
    'find cofounder',
    'startup platform India',
    'AI mentor for founders',
    'startup community',
    'developer network',
    'venture platform',
    'startup school',
    'builder pulse',
    'founder ecosystem',
    'startup ideas',
    'venture capital India',
  ],
  authors: [{ name: 'DSRT Systems', url: 'https://dsrtai.com' }],
  creator: 'DSRT Systems',
  publisher: 'DSRT AI',
  applicationName: 'DSRT AI',
  category: 'Technology',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dsrtai.com',
    siteName: 'DSRT AI',
    title: 'DSRT AI — Build with the right people',
    description:
      'The professional builder ecosystem for founders, engineers, designers, and investors. AI-powered mentorship, real projects, real collaborators.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DSRT AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@dsrtai',
    creator: '@dsrtai',
    title: 'DSRT AI — Build with the right people',
    description:
      'The professional builder ecosystem. Find cofounders, ship projects, get AI mentorship.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'ADD_YOUR_GOOGLE_VERIFICATION_CODE_HERE',
  },
  alternates: {
    canonical: 'https://dsrtai.com',
  },
  other: {
    'application-name': 'DSRT AI',
    'apple-mobile-web-app-title': 'DSRT AI',
    'theme-color': '#0a0a1a',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Schema.org structured data for AI search + Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'DSRT AI',
              alternateName: ['DSRT', 'dsrtai'],
              url: 'https://dsrtai.com',
              logo: 'https://dsrtai.com/logo.png',
              description:
                'DSRT AI is a professional builder ecosystem where founders, engineers, designers, and investors collaborate to turn ideas into real projects, research, products, and ventures.',
              sameAs: [
                'https://twitter.com/dsrtai',
                'https://linkedin.com/company/dsrtai',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'DSRT AI',
              url: 'https://dsrtai.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate:
                    'https://dsrtai.com/explore?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'DSRT AI',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '150',
              },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}