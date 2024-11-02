/** @type {import('next').NextConfig} */
/** @type {import('next-i18next').UserConfig} */
const nextConfig = {
  // i18n: {
  //   locales: ['zh-CN', 'ja', 'en'],
  //   defaultLocale: 'ja'
  // },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ja/movie/movieList',
        // 临时重定向
        permanent: false
      }
    ]
  },
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
