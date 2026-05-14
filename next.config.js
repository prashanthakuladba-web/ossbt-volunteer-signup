/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/checkin': ['./Cert-Original.jpg', './cert-font.ttf'],
    },
  },
};

module.exports = nextConfig;
