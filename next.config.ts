
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    // see https://styled-components.com/docs/tooling#babel-plugin for more info on the options.
    styledComponents: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.externals = [...(config.externals || []), 'bcrypt'];
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      "async_hooks": false,
      "fs": false,
      "net": false,
      "tls": false,
      "dns": false,
      "http2": false,
    };
    return config;
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'picsum.photos'],
  },
}

export default nextConfig
