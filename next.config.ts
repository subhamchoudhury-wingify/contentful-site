import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    remotePatterns: [new URL("https://images.ctfassets.net/**")],
  },
  async redirects() {
    return [{ source: "/home", destination: "/", permanent: true }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
