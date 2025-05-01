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
        // Setting to false tells webpack this module is not needed client-side
        async_hooks: false,
      };
    }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
