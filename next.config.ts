import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================
  // Next.js 16 Advanced Features
  // ============================================
  // reactCompiler : true,
  // Enable Cache Components with PPR (Partial Prerendering)
  // This enables the new caching model with 'use cache' directive
  // But disable it for API routes to avoid build-time authentication issues
  cacheComponents: true,
  
  // Configure cache profiles for optimal performance
  cacheLife: {
    // Default profile for most content
    default: {
      stale: 3600, // 1 hour stale time
      revalidate: 86400, // 24 hours revalidation
      expire: 604800, // 7 days expiration
    },
    // For frequently changing content
    frequent: {
      stale: 300, // 5 minutes
      revalidate: 900, // 15 minutes
      expire: 3600, // 1 hour
    },
    // For static content that rarely changes
    max: {
      stale: 86400, // 24 hours
      revalidate: 604800, // 7 days
      expire: 2592000, // 30 days
    },
  },
  
  // ============================================
  // Image Optimization
  // ============================================
  images: {
    unoptimized: false, // Enable image optimization for caching
    minimumCacheTTL: 86400, // Cache images for 24 hours (in seconds)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sgp.cloud.appwrite.io',
        port: '',
        pathname: '/v1/storage/buckets/**',
      },
    ],
    formats: ['image/webp', 'image/avif'], // Use modern formats for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // ============================================
  // Performance & SEO Optimizations
  // ============================================
  
  // Compress responses for better performance (helps SEO)
  compress: true,
  
  // Generate ETags for caching
  generateEtags: true,
  
  // Remove X-Powered-By header for security
  poweredByHeader: false,
  
  // ============================================
  // Turbopack Configuration (Default in Next.js 16)
  // ============================================
  // Turbopack is now the default bundler - no config needed!
  // It provides 5-10x faster builds and hot module replacement
  
  // ============================================
  // Additional Performance Features
  // ============================================
  
  // React Compiler can be enabled once babel-plugin-react-compiler is installed
  // reactCompiler: true,
  
  // Experimental features for even better performance
  experimental: {
    // Enable optimistic client cache for instant navigation
    optimisticClientCache: true,
    
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      'react-hot-toast',
      'zustand',
      'motion',
    ],
    
    // Enable CSS chunking for better caching
    cssChunking: true,

    // Enable View Transitions API for page transitions
    viewTransition: true,
  },
  
  // ============================================
  // Headers for SEO and Security
  // ============================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          }
        ],
      },
      {
        // Cache static assets aggressively
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;