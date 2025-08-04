import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/vedit',
  assetPrefix: '/vedit',
  trailingSlash: true,         // required for next export

  output: 'export',            // this enables static HTML export

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        esbuild: false,
        bufferutil: false,
        'utf-8-validate': false,
      };
    }
    return config;
  },

  experimental: {
    serverComponentsExternalPackages: [
      '@remotion/bundler', 
      'esbuild', 
      'puppeteer-core',
      'bufferutil',
      'utf-8-validate',
    ],
  },
};

export default nextConfig;
