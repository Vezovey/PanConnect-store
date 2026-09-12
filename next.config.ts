import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/shop/:slug',
        destination: '/product/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
