import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add webpack configuration to handle 'async_hooks'
  webpack: (config, { isServer }) => {
    // Provide a fallback for 'async_hooks' only on the client-side
    // This module is Node.js specific and shouldn't be bundled for the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false, // Tells webpack that 'async_hooks' is not available/needed on the client
      };
    }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
