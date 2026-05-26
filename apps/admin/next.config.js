/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { domains: ['localhost'] },
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' }];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
module.exports = nextConfig;
