/** @type {import('next').NextConfig} */
/** @type {import('next-i18next').UserConfig} */
const nextConfig = {
  eslint: {
    // 构建时忽略eslint错误
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  distDir: process.env.NODE_ENV === 'development' ? 'build/test' : 'build/prod'
  // experimental: {
  //   compilationMode: true
  // }
}

export default nextConfig
