import type { NextConfig } from 'next'

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'
).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  ...(process.env.NEXT_STANDALONE === 'true'
    ? { output: 'standalone' as const }
    : {}),
  // All API calls go to leadsetu-api (port 3001)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig
