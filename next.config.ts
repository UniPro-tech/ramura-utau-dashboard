import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "1gb",
  },
  output: "standalone",
};

export default nextConfig;
