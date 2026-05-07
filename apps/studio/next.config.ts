import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@silent-edge/ui", "@silent-edge/db"],
  experimental: {
    optimizePackageImports: ["@silent-edge/ui"],
  },
};

export default nextConfig;
