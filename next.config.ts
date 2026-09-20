const remoteApi = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  agentRules: false,
  async rewrites() {
    if (!remoteApi?.startsWith('http')) {
      return [];
    }

    return [
      {
        source: '/backend-api/:path*',
        destination: `${remoteApi}/:path*`,
      },
    ];
  },
};

export default nextConfig;
