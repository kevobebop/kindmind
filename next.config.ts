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
    if (!isServer && config.resolve) { // Ensure config.resolve exists
      config.resolve.fallback = {
        ...config.resolve.fallback, // Spread existing fallbacks
        // Only add fallbacks for modules known to cause client-side issues
        'async_hooks': false,
        'fs': false,
        'net': false,
        'tls': false,
        'dns': false,
        'http2': false,
      };
    }
    // The `fullySpecified: false` rule might not be necessary if fallbacks handle the client-side issues.
    // If `node:` prefix errors persist specifically on the server build, it might need re-evaluation.

    return config;
  },
};

export default nextConfig;
