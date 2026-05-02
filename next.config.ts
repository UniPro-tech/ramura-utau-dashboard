import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "1gb",
  },
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
