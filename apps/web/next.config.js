const nextBuildId = require('next-build-id')
const withPWA = require('next-pwa')

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@namegame/db'],
  images: {
    minimumCacheTTL: 7776000, // 90 days
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'namegame1.nyc3.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source:
          '/((?!_next/static|_next/image|favicon.ico|sw.js|worker.*.js|uploads/user-photos/.*|api/images).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/(icon.png|icons/.*|fonts/.*|images/.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image(.*)|/uploads/user-photos/:path*|/api/images',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=7776000, immutable', // 90 days
          },
        ],
      },
    ]
  },
  generateBuildId: () => nextBuildId({ dir: __dirname }),
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = withPWA({
  dest: 'public',
  register: false,
  skipWaiting: true,
  swSrc: 'src/worker/index.ts',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
