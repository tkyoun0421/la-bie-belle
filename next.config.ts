import type { NextConfig } from "next";

const DEFAULT_PAGE_EXTENSIONS = ["tsx", "ts", "jsx", "js"];

const nextConfig: NextConfig = {
  agentRules: false,
  turbopack: {
    root: import.meta.dirname,
  },
  pageExtensions:
    process.env.NODE_ENV === "development"
      ? [...DEFAULT_PAGE_EXTENSIONS, "dev.tsx"]
      : DEFAULT_PAGE_EXTENSIONS,
};

export default nextConfig;
