import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100gb",
    },
  },
  output: "standalone",
};

export default nextConfig;
