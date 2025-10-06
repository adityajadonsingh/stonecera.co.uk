import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "localhost",
      "localhost:1337",
      "admin.stonecera.co.uk",
      "stonecera.co.uk",
    ],
  },
};

export default nextConfig;
