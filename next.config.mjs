/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: true,
  },
  experimental: {
    // Skip static generation timeouts for API routes
    staticGenerationRetryCount: 1,
    staticGenerationMaxConcurrency: 8,
  },
  // Increase build worker timeout
  staticPageGenerationTimeout: 180,
}

export default nextConfig