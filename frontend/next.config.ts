import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Transpile Cesium package
  transpilePackages: ['cesium'],
  // Add empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;
