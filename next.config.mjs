/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gzip/Brotli compression for all responses
  compress: true,
  // Remove X-Powered-By header
  poweredByHeader: false,
  // Disable strict mode for game socket effects (prevents double-mount in dev)
  reactStrictMode: false,

  // Enable Turbopack (handles async chunk splitting automatically)
  turbopack: {},

  experimental: {
    // Automatically tree-shake and optimize heavy packages in Turbopack & Webpack
    optimizePackageImports: ['framer-motion', 'firebase'],
  },

  compiler: {
    // Strip console.log in production builds (keep error/warn for monitoring)
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Image optimisation — serve AVIF/WebP automatically
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
  },

  // Long-lived cache headers for static assets (CDN/browser)
  async headers() {
    return [
      {
        // Public image assets — 7-day cache with stale-while-revalidate
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
