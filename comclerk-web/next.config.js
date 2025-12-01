/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@opencode-ai/sdk"],
  webpack: (config) => {
    // Handle .js imports in .ts files (for SDK package)
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    }
    // pdfjs-dist canvas 모듈 무시 (브라우저에서는 불필요)
    config.resolve.alias.canvas = false
    return config
  },
}

module.exports = nextConfig
