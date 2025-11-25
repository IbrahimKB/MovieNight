import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  // Image optimization for better performance
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  // Disable ESLint during production builds to prevent circular reference issues
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
