import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'panconnect.by',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

export default nextConfig;
