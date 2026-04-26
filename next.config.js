/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  // The `ai-scientist/` directory is the alternate scaffold (its own
  // self-contained Next.js app). Exclude it from this build/lint scope.
  webpack: (config) => {
    config.watchOptions = {
      ...(config.watchOptions ?? {}),
      ignored: ["**/node_modules/**", "**/ai-scientist/**"],
    };
    return config;
  },
  eslint: {
    dirs: ["src"],
  },
};

module.exports = nextConfig;
