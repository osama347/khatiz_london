import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {},

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Bundle optimization
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Enable tree shaking for production
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }
    return config;
  },
};

export default nextConfig;
