import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // --- Production domains ---
      {
        protocol: "https",
        hostname: "admin.stonecera.co.uk",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "stonecera.co.uk",
        pathname: "/uploads/**",
      },

      // --- Local development ---
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337", // only needed for local Strapi
        pathname: "/uploads/**",
      },
    ],

    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 480, 768, 1024, 1200, 1600],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
