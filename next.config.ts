import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly disable Turbopack (Next.js 16 enables it by default)
  turbopack: {},

  // Tell Next.js we want to use Webpack
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false
    };

    return config;
  }
};

export default nextConfig;
