import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The MCP route, the filtered /wiki index and unknown-slug lookups read content/wiki/*.mdx at runtime; ship the files with them.
  outputFileTracingIncludes: { "/api/mcp": ["./content/**"], "/wiki": ["./content/**"], "/wiki/[slug]": ["./content/**"] },
};

export default nextConfig;
