import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/astrophoto" : "",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
