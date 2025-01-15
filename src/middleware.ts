import { ApiResponse } from './type/api'
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
  // 检查是否存在 roleId 和 token
  const roleId = cookies.get('roleId')?.value
  const token = cookies.get('token')?.value
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  // 获取语言设置
  let lng = fallbackLng
  if (cookies.has(cookieName)) {
    lng = acceptLanguage.get(cookies.get(cookieName)?.value) || lng
  } else if (headers.has('Accept-Language')) {
    lng = acceptLanguage.get(headers.get('Accept-Language')) || lng
  }

  // 检查路径是否在支持的语言中
  const isSupportedPath = supportedLanguages.some((lang) =>
    url.pathname.startsWith(`/${lang}`)
  )
  const relativePath = `/${url.pathname.split('/').slice(2).join('/')}`
  const allowedPaths = new Set(['/error/403', '/login'])

  if (allowedPaths.has(relativePath)) {
    return NextResponse.next()
  }

  // 如果路径是next.js 自身的路径就重定向
  if (!isSupportedPath) {
    return NextResponse.next()
  } else {
    if (!roleId || !token) {
      return NextResponse.redirect(new URL(`/${lng}/login`, req.url))
    }
    try {
      const res = await axios.get(`${API_URL}/admin/permission/role/permission`, {
        headers: {
          'Accept-Language': lng,
          token
        },
        params: { id: +roleId }
      })
      // 从路径中提取相对路径并检查权限
      const hasPermission = res.data.data.some(
        (item: any) => item.path === relativePath
      )
  
      if (hasPermission) {
        return NextResponse.next()
      } else {
        console.log(`/${lng}/error/403`)
        return NextResponse.redirect(new URL(`/${lng}/error/403`, req.url))
      }
    } catch (err) {
      
    }
   
  }
}
