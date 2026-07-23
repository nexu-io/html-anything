import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Project PATCH requests can contain 8 MiB of HTML represented by the
    // largest valid JSON escape sequence, plus bounded content and metadata.
    proxyClientMaxBodySize: 67108864,
  },
};

export default nextConfig;
