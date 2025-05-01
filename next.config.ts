
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add webpack configuration
  webpack: (config, { isServer }) => {
    // Provide fallbacks for Node.js core modules that shouldn't be bundled for the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false, // Already handled
        fs: false, // Already handled
        tls: false, // Already handled
        net: false, // Add fallback for 'net'
      };
    }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
