/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warnings only — do not fail production build on warnings
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'klrfpzxjsacriaqtfssf.supabase.co',
      },
    ],
  },
}

export default nextConfig
