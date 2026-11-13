import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // All API calls go to leadsetu-api (port 3001)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
