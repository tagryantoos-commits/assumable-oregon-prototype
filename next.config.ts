import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/assumable/mortgage',
        destination: '/ppc/assumable-mortgage',
        permanent: false,
      },
      {
        source: '/assumable/mortgage/:path*',
        destination: '/ppc/assumable-mortgage',
        permanent: false,
      },
      {
        source: '/blog/how-to-assume-a-va-loan-step-by-step',
        destination: '/blog/va-loan-assumption-process-colorado',
        permanent: true,
      },
      {
        source: '/blog/how-to-assume-a-va-loan-step-by-step/',
        destination: '/blog/va-loan-assumption-process-colorado',
        permanent: true,
      },
      {
        source: '/ppc/low-rate-buyers',
        destination: '/ppc/buy-home-low-rate',
        permanent: false,
      },
      {
        source: '/ppc/low-rate-buyers/',
        destination: '/ppc/buy-home-low-rate',
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.umeprojects.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Keep pdfkit out of the webpack bundle (it needs Node.js fs for fonts)
  serverExternalPackages: ['pdfkit'],
  // Needed for large JSON data import
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
