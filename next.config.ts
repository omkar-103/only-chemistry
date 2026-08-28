import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "mongodb", "firebase-admin"],
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com https://apis.google.com https://www.gstatic.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://img.youtube.com https://i.ytimg.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://www.gstatic.com",
              "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://www.googleapis.com",
              "frame-src 'self' https://only-chemistry.firebaseapp.com https://accounts.google.com https://www.youtube.com https://drive.google.com https://api.razorpay.com https://checkout.razorpay.com",
              "media-src 'self' https://res.cloudinary.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
