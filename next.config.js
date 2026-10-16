/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // bWallet opens bApps inside its own frame (capacitor://localhost on iOS, https://localhost on Android).
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: "frame-ancestors 'self' capacitor://localhost https://localhost https://web.bwalletx.com https://desktop.bwalletx.com" }] }]
  },
}

module.exports = nextConfig
