// next.config.ts

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'your-domain.com', 'picsum.photos'], // Added picsum.photos
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    NEXT_PUBLIC_GOOGLE_GENAI_KEY: process.env.NEXT_PUBLIC_GOOGLE_GENAI_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, // Added Stripe key
  },
   webpack: (config, { isServer }) => {
    // Fix for Node.js built-in modules not found during client-side build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback, // Spread existing fallbacks
        fs: false, // Tell webpack to ignore 'fs' module on client-side
        net: false, // Add fallbacks for other potentially problematic Node.js modules
        tls: false,
        dns: false,
        http2: false,
        async_hooks: false, // Ensure fallback for async_hooks is present
      };
    }

    // Ensure node: prefixed imports are handled correctly by disabling fully specified requirement
    // This rule targets JavaScript files (including .mjs) and adjusts resolution behavior.
    config.module.rules.push({
      test: /\.m?js$/, // Match .js and .mjs files
      resolve: {
        fullySpecified: false, // Allow imports without file extensions, helping with `node:` imports
      },
    });


    return config;
  },
};

export default nextConfig;
