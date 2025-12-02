/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['sqlite3'],
  },
  // App Router에서는 bodyParser 설정이 다름
  async headers() {
    return [
      {
        source: '/api/upload',
        headers: [
          {
            key: 'Content-Type',
            value: 'multipart/form-data',
          },
        ],
      },
    ]
  },
  // API 라우트 설정
  async rewrites() {
    return [
      {
        source: '/api/upload',
        destination: '/api/upload',
      },
    ]
  },
}

export default nextConfig
