import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/api/tools/viral-maker": ["./lib/fonts/**/*"],
    "/api/tools/maker": ["./lib/fonts/**/*"],
  },
};

export default nextConfig;
