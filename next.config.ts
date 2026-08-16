import type { NextConfig } from "next";

const basePath = process.env.GITHUB_PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath,
};

export default nextConfig;
