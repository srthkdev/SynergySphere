/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle external dependencies that might cause bundling issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Externalize certain packages for better compatibility
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'canvas': 'canvas',
        'sharp': 'sharp'
      });
    }

    return config;
  },
  // Disable source maps in production for better build performance
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    domains: [],
    unoptimized: false,
  },
};

module.exports = nextConfig; 