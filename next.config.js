/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for Node.js built-in modules not found during client-side build
    if (!isServer && config.resolve) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'async_hooks': false,
        'fs': false,
        'net': false,
        'tls': false,
        'dns': false,
        'http2': false,
      };
    }

    // Ensure that server-only packages are not bundled on the client
    if (!isServer) {
      config.externals = [
        ...(config.externals || []),
        // Add any other server-only packages here if needed
        // Example: /@grpc\//
      ];
    }


    // Add a rule to handle .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    return config;
  },
};

module.exports = nextConfig;
