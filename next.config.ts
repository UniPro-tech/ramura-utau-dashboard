import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10240mb",
    },
  },
  output: "standalone",
};

export default nextConfig;
