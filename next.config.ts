import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [{ key: 'Content-Security-Policy', value: "frame-ancestors 'self'" }],
      },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      {
        source: '/widget/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;
