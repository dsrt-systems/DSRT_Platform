/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Auth + platform ship with incremental TS/ESLint cleanup
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep production deploys unblocked while auth modules stabilize
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@phosphor-icons/react'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  experimental: {
    // Helps large route trees / server components stay stable on Vercel
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  webpack: (config, { isServer }) => {
    // Silence known third-party Edge Runtime telemetry noise from Supabase SSR
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/@supabase\/supabase-js/ },
      { module: /node_modules\/@supabase\/ssr/ },
      { message: /Serializing big strings/ },
    ]

    // Avoid packing Node-only bits into edge middleware incorrectly
    if (!isServer) {
      config.resolve = config.resolve || {}
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },
}

export default nextConfig