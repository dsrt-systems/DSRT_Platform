import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow cross-origin requests during development
  allowedDevOrigins: ['10.143.246.196', 'localhost', '127.0.0.1'],

  // Image domains for Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
}

export default nextConfig