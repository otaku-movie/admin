import { NextRequest, NextResponse } from 'next/server'
import acceptLanguage from 'accept-language'
import { fallbackLng, languages, cookieName } from './app/i18n/settings'
import axios from 'axios'

const supportedLanguages = Object.keys(languages)
acceptLanguage.languages(supportedLanguages)

export const config = {
  matcher: ['/:lng*', '/api/:path*']
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const cookies = req.cookies
  const headers = req.headers

  // 获取语言设置
  let lng = fallbackLng
  if (cookies.has(cookieName)) {
    lng = acceptLanguage.get(cookies.get(cookieName)?.value) || lng
  } else if (headers.has('Accept-Language')) {
    lng = acceptLanguage.get(headers.get('Accept-Language')) || lng
  }
  console.log(url)
  // 检查路径是否在支持的语言中
  const isSupportedPath = supportedLanguages.some(lang => url.pathname.startsWith(`/${lang}`))

  // 如果路径不受支持且不是 Next.js 内部路径，则重定向到默认语言的路径
  if (!isSupportedPath && !url.pathname.startsWith('/_next')) {
    const newURL = `/${lng}${url.pathname}`
    return NextResponse.redirect(new URL(newURL, req.url))
  }

  // 检查是否存在 roleId 和 token
  const roleId = cookies.get('roleId')?.value
  const token = cookies.get('token')?.value
  
 
  if (!roleId || !token) {
    if (url.pathname === `/${lng}/login`) {
      return NextResponse.next()
    }
    return NextResponse.next()
  }

  // try {
    const response = await axios.get('http://test-api.otaku-movie.com/api/admin/permission/role/permission', {
      headers: {
        'Accept-Language': lng,
        token
      },
      params: { id: +roleId }
    })

    // 从路径中提取相对路径并检查权限
    const relativePath = `/${url.pathname.split('/').slice(2).join('/')}`
    const hasPermission = response.data.data.some((item: any) => item.path === relativePath)
    const allowedPaths = new Set(['/error/403', '/login'])

    // console.log(relativePath)
    if (isSupportedPath && (hasPermission || allowedPaths.has(relativePath))) {
      return NextResponse.next()
    } else if (isSupportedPath) {
      return NextResponse.redirect(new URL(`/${lng}/error/403`, req.url))
    } else {
      return NextResponse.next()
    }
}
