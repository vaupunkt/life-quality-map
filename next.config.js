/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
  allowedDevOrigins: ['localhost', '192.168.0.29'],


};

module.exports = nextConfig;
