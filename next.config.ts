import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/documents/upload": [
      "./node_modules/pdf-parse/dist/worker/pdf.worker.mjs",
      "./node_modules/pdf-parse/dist/worker/**/*",
    ],
  },
};

export default nextConfig;
