'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useProgress } from '@bprogress/next'

export function ProgressHandler() {
  const pathname = usePathname()
  const { start, stop } = useProgress()

  useEffect(() => {
    // 监听所有链接点击，包括 Next.js Link 组件
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href]')

      if (link && link instanceof HTMLAnchorElement && link.href) {
        try {
          const url = new URL(link.href)
          const currentUrl = new URL(globalThis.window.location.href)

          // 如果是同域内的链接，且路径不同，立即显示进度条
          if (
            url.origin === currentUrl.origin &&
            url.pathname !== currentUrl.pathname
          ) {
            start()
          }
        } catch {
          // 忽略无效的 URL
        }
      }
    }

    // 监听程序化跳转（router.push/replace 底层会调用 history.pushState/replaceState）
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (...args) {
      start()
      return originalPushState.apply(this, args as any)
    } as any

    history.replaceState = function (...args) {
      start()
      return originalReplaceState.apply(this, args as any)
    } as any

    const handlePopState = () => {
      start()
    }

    document.addEventListener('click', handleClick, true)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('popstate', handlePopState)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [start])

  // 当路径变化时，完成进度条
  useEffect(() => {
    // 延迟完成进度条，确保页面已加载
    const timer = setTimeout(() => {
      stop()
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [pathname, stop])

  return null
}
