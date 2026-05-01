import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true, // Генерирует /dashboard/index.html вместо /dashboard.html
  transpilePackages: [
    "@lab-gen/llm-client",
    "@lab-gen/image-gen",
    "@lab-gen/doc-gen",
  ],
};

export default nextConfig;
