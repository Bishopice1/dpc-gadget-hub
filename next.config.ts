import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standard dynamic rendering: pages read cookies (Supabase) and searchParams.
  cacheComponents: false,
  images: {
    // Placeholder product art ships as self-generated SVGs; swap for JPG/WebP later.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
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
