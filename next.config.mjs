"use strict";

// next.config.js
/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    // see https://styled-components.com/docs/tooling#babel-plugin for more info on the options.
    styledComponents: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {

    config.externals = [...(config.externals || []), 'bcrypt'];

    // Important: return the modified config
    return config
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
}
export default nextConfig;
