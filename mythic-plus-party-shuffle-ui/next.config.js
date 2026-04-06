/** @type {import('next').NextConfig} */
// CRA (main) used REACT_APP_API_URL; Next.js expects NEXT_PUBLIC_API_URL.
// Expose a single client-side value so existing Render/env from main keeps working.
const resolvedPublicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:8080';

// Same-origin proxy target (no trailing slash). Used at build time for rewrites().
const backendProxyBase = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:8080'
).replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: resolvedPublicApiUrl,
  },
  async rewrites() {
    return [
      {
        source: '/api/be/:path*',
        destination: `${backendProxyBase}/:path*`,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
