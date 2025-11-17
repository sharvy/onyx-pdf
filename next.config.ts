import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration
  experimental: {
    // any other experimental options
  },
  // @ts-ignore - Create a type override if needed, or assume it works at runtime
  turbo: {
    resolveAlias: {
      canvas: './empty-module.js',
      encoding: './empty-module.js',
    },
  },
};

export default nextConfig;
