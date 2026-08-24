/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nisargshala.in',
      },
      {
        protocol: 'https',
        hostname: 'corp.nisargshala.in',
      },
    ],
  },
};

export default nextConfig;
