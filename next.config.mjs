/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    // Runtime image optimization is disabled on purpose.
    //
    // The production host (Render free plan) has 0.1 CPU and an EPHEMERAL
    // filesystem: the .next/cache/images directory is wiped on every restart
    // and every spin-down. Measured on the live site, a single cold resize
    // cost 4.8s of server time, and a page with 6 product cards pays that
    // repeatedly. The optimizer was also producing LARGER files than the
    // originals (170 KB source -> 179 KB "optimized").
    //
    // Serving the source files directly moves zero bytes through our CPU.
    // Keep source images pre-sized and compressed instead (see
    // IMAGE-PROMPTS.md: 1024-1600px, WebP/JPEG under 300 KB).
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
