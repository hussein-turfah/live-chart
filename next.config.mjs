/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  pageExtensions: ["page.js", "js"],
  images: {
    domains: [
      "s2.coinmarketcap.com"
    ]
  }
};

export default nextConfig;
