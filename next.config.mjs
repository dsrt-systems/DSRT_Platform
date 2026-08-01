/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip ESLint during production builds (still runs in dev)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip TypeScript errors during build (dev mode still catches them)
  // Comment this out if you want strict type checking on Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig