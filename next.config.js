/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  output: 'standalone'
};

module.exports = nextConfig;
