import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `next build` emits a plain HTML/JS site in `out/`
  // that can be hosted anywhere (Netlify, Vercel, S3) with zero server.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Set NEXT_PUBLIC_BASE_PATH=/bookflow when hosting under a subpath
  // (GitHub Pages project sites). Leave unset for Netlify/Vercel.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
};

export default nextConfig;
