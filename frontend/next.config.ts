import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Standard Terms are read from the repository's templates/ directory at
  // request time, which lives outside frontend/. Tracing it here keeps the file
  // available in a standalone production build.
  outputFileTracingIncludes: {
    "/": ["../templates/Mutual-NDA.md"],
  },
};

export default nextConfig;
