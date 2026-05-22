import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Enable standalone output for Docker deployments
  output: "standalone",



  // Compress responses using gzip
  compress: true,

  // Cache configurations
  generateEtags: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/:all*(svg|jpg|png|webp|avif|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Setup proxy to bypass CORS issues by routing /api requests to the backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://atheleai.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
