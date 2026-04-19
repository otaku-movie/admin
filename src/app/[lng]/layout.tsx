'use client'
/* eslint-disable react/prop-types */
import { AntdRegistry } from '@ant-design/nextjs-registry'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { ApiResponse } from '@/type/api'
import { usePathname } from 'next/navigation'
import type { MenuProps } from 'antd'
import { ProgressProvider } from '@bprogress/next/app'
import NProgress from 'nprogress'

import {
  ConfigProvider,
  Breadcrumb,
  Layout,
  theme,
  Dropdown,
  Space,
  Avatar,
  Tag,
  Tooltip
} from 'antd'
import ja from 'antd/locale/ja_JP'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'

import 'dayjs/locale/ja'
import '@/assets/css/normalize.scss'
import { languages, type languageType } from '@/config'
import { useTranslation } from '@/app/i18n/client'
import { processPath } from '@/config/router'
import { useUserStore } from '@/store/useUserStore'
import { getURL, getUserInfo, listToTree } from '@/utils'
import { Menu } from '@/components/menu'
import Cookies from 'js-cookie'
import { useCommonStore } from '@/store/useCommonStore'
import http from '@/api'
import { ProgressHandler } from '@/components/ProgressHandler'

export interface PageProps {
  children: React.ReactNode
  params: {
    lng: keyof typeof languages
  }
}

type HeadUser = {
  id?: number
  name?: string
  cover?: string
  dataScope?: string
  brandId?: number | null
  brandName?: string | null
  cinemaIds?: number[]
  cinemaNames?: string[]
}

function RootLayout({ children, params: { lng } }: PageProps) {
  const { Header, Sider } = Layout
  const pathname = usePathname()
  const dataScopeFetchedRef = useRef(false)
  const [headUser, setHeadUser] = useState<HeadUser>(() => getUserInfo() as HeadUser)
  const myCinemaSummary = useMemo(() => {
    const names = headUser.cinemaNames
    if (!names?.length) {
      return ''
    }
    if (names.length === 1) {
      return names[0]
    }
    return `${names[0]} +${names.length - 1}`
  }, [headUser.cinemaNames])
  const userStore = useUserStore()
  // const breadcrumb = useUserStore((state) => state.breadcrumb)
  const getDict = useCommonStore((state) => state.getDict)
  const getPermission = useUserStore((state) => state.permission)
  const menuPermission = useUserStore((state) => state.menuPermission)
  const menu = useMemo(() => listToTree(menuPermission), [menuPermission])
  const { t } = useTranslation(lng, 'common')
  const { t: tUser } = useTranslation(lng as languageType, 'user')

  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const items: MenuProps['items'] = [
    {
      label: t('homePage.logout'),
      key: 'logout'
    }
  ]

  const url =
    'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg'

  const locale = {
    en: enUS,
    ja,
    'zh-CN': zhCN
  }
  const str = usePathname()
    .split('/')
    .filter((item) => item !== '')
    .slice(1)
    .join('/')
  const set = new Set(['login', 'error/403'])

  useEffect(() => {
    const roleId = localStorage.getItem('roleId')
    const token = localStorage.getItem('token')

    if (roleId && token) {
      getPermission(+roleId)
      Cookies.set('token', token, { expires: 30 })
      Cookies.set('roleId', roleId, { expires: 30 })
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || set.has(str)) {
      if (set.has(str)) {
        dataScopeFetchedRef.current = false
      }
      return
    }
    if (dataScopeFetchedRef.current) {
      return
    }
    dataScopeFetchedRef.current = true
    http({
      url: 'admin/user/current',
      method: 'get'
    })
      .then((res: ApiResponse<Record<string, unknown>>) => {
        const d = res.data
        if (!d || typeof d !== 'object') {
          return
        }
        setHeadUser({
          id: d.id as number,
          name: d.name as string,
          cover: d.cover as string,
          dataScope: d.dataScope as string,
          brandId: d.brandId as number | null | undefined,
          brandName: (d.brandName as string) ?? null,
          cinemaIds: d.cinemaIds as number[] | undefined,
          cinemaNames: d.cinemaNames as string[] | undefined
        })
        try {
          const raw = localStorage.getItem('userInfo')
          if (raw) {
            const u = JSON.parse(raw) as Record<string, unknown>
            u.id = d.id
            u.name = d.name
            u.cover = d.cover
            u.email = d.email
            u.dataScope = d.dataScope
            u.brandId = d.brandId
            u.cinemaIds = d.cinemaIds
            u.brandName = d.brandName
            u.cinemaNames = d.cinemaNames
            localStorage.setItem('userInfo', JSON.stringify(u))
          }
        } catch {
          /* noop */
        }
      })
      .catch(() => {
        dataScopeFetchedRef.current = false
      })
  }, [str])

  const lang = pathname.split('/')[1]
  const dataScopeKey =
    headUser.dataScope === 'chain' || headUser.dataScope === 'cinema'
      ? headUser.dataScope
      : 'platform'

  const userDropDownMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'logout':
        http({
          url: 'user/logout',
          method: 'post'
        }).then(() => {
          location.href = `/${lang}/login`
          localStorage.clear()
        })

        break
    }
  }

  useEffect(() => {
    getDict()
  }, [])

  // useEffect(() => {
  console.log(process.env.NODE_ENV)
  if (process.env.MODE === 'production') {
    const meta = document.createElement('meta')
    meta.setAttribute('http-equiv', 'Content-Security-Policy')
    meta.setAttribute('content', 'upgrade-insecure-requests')

    document.head.insertBefore(
      meta,
      document.querySelector('link[rel=icon]') || null
    )
  }
  // }, [])

  // 监听路由变化，显示进度条
  const prevPathnameRef = useRef(pathname)
  const isConfiguredRef = useRef(false)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 只在第一次配置 nprogress
    if (!isConfiguredRef.current) {
      NProgress.configure({
        showSpinner: false,
        minimum: 0.3,
        easing: 'ease',
        speed: 400,
        trickleSpeed: 200
      })
      isConfiguredRef.current = true
    }

    // 监听所有链接点击，立即显示进度条
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link?.href) {
        try {
          const url = new URL(link.href)
          const currentUrl = new URL(globalThis.window.location.href)
          // 如果是同域内的链接，立即显示进度条
          if (
            url.origin === currentUrl.origin &&
            url.pathname !== currentUrl.pathname
          ) {
            NProgress.start()
            // 清除之前的定时器
            if (progressTimerRef.current) {
              clearTimeout(progressTimerRef.current)
            }
          }
        } catch {
          // 忽略无效的 URL
        }
      }
    }

    // 监听路由变化，完成进度条
    if (prevPathnameRef.current !== pathname) {
      // 路径已变化，延迟完成进度条以确保页面已加载
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current)
      }
      progressTimerRef.current = setTimeout(() => {
        NProgress.done()
        progressTimerRef.current = null
      }, 150)
    }

    // 添加全局点击监听
    document.addEventListener('click', handleLinkClick, true)

    prevPathnameRef.current = pathname

    return () => {
      document.removeEventListener('click', handleLinkClick, true)
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current)
      }
    }
  }, [pathname])

  useEffect(() => {
    if (userStore.permissionList.length !== 0 && !set.has(str)) {
      // 更新面包屑
      userStore.getBreadcrumb()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, userStore.menuPermission])

  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang)
  }

  return (
    <html lang={lng} dir={lng}>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <style>{`
          #nprogress .bar {
            background: #1677ff !important;
            height: 4px !important;
          }
          #nprogress .peg {
            box-shadow: 0 0 10px #1677ff, 0 0 5px #1677ff !important;
          }
        `}</style>
        {/* <meta
          httpEquiv="Content-Security-Policy"
          content="upgrade-insecure-requests"
        /> */}
      </head>
      <body
        style={{
          minWidth: '1200px'
        }}
      >
        <AntdRegistry>
          {/* <NavigationEvents /> */}
          <ProgressProvider
            height="4px"
            color="#1677ff"
            options={{ showSpinner: false }}
            shallowRouting={false}
          >
            <ProgressHandler />
            <ConfigProvider locale={locale[lng as keyof typeof locale]}>
              {set.has(str) ? (
                children
              ) : (
                <Layout
                  style={{
                    width: '100vw',
                    minHeight: '100vh'
                  }}
                >
                  <Header
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <Space align="center">
                      <Dropdown
                        menu={{
                          defaultSelectedKeys: [lng],
                          items: Object.entries(languages).map((item) => {
                            const [key, label] = item

                            return {
                              label,
                              key
                            }
                          }),
                          onClick(info) {
                            const str = pathname.replace(lng, info.key)
                            console.log(str, info, lng)
                            localStorage.setItem('language', info.key)
                            location.pathname = str
                            // router.replace(str)
                          }
                        }}
                        placement="bottom"
                      >
                        <Space>
                          <span
                            style={{
                              color: 'white'
                            }}
                          >
                            {languages[lng]}
                          </span>
                        </Space>
                      </Dropdown>
                      {headUser.id ? (
                        <Tag
                          color={
                            dataScopeKey === 'platform'
                              ? 'gold'
                              : dataScopeKey === 'chain'
                                ? 'blue'
                                : 'cyan'
                          }
                          style={{ marginInline: 4 }}
                        >
                          {tUser(`dataScope.${dataScopeKey}`)}
                        </Tag>
                      ) : null}
                      {headUser.id &&
                      headUser.dataScope === 'chain' &&
                      headUser.brandName ? (
                        <Tag color="blue" style={{ marginInline: 4, maxWidth: 280 }} title={headUser.brandName}>
                          {t('header.myBrand')}：{headUser.brandName}
                        </Tag>
                      ) : null}
                      {headUser.id &&
                      headUser.dataScope === 'cinema' &&
                      (headUser.cinemaNames?.length || headUser.cinemaIds?.length) ? (
                        <Tooltip
                          title={
                            headUser.cinemaNames?.length
                              ? headUser.cinemaNames.join('、')
                              : (headUser.cinemaIds || []).map((id) => `#${id}`).join('、')
                          }
                        >
                          <Tag color="geekblue" style={{ marginInline: 4, maxWidth: 280, cursor: 'default' }}>
                            {t('header.myCinemas')}：{myCinemaSummary || `#${(headUser.cinemaIds || [])[0]}`}
                          </Tag>
                        </Tooltip>
                      ) : null}
                      <Dropdown
                        menu={{ items, onClick: userDropDownMenuClick }}
                        placement="bottom"
                      >
                        <Space>
                          <Avatar src={getURL(headUser.cover || url)} />
                          <span
                            style={{
                              color: 'white'
                            }}
                          >
                            {headUser.name}
                          </span>
                        </Space>
                      </Dropdown>
                    </Space>
                  </Header>
                  <Layout>
                    <Sider width={250} style={{ background: colorBgContainer }}>
                      <Menu data={menu}></Menu>
                    </Sider>
                    <Layout
                      style={{
                        padding: '20px',
                        height: 'calc(100vh - 64px)',
                        overflow: 'auto'
                      }}
                      id="page-container"
                    >
                      <Space direction="vertical" size={20}>
                        <Breadcrumb
                          separator=">"
                          items={userStore.breadcrumb.map((item) => {
                            return {
                              href: processPath(item.pathName),
                              title: t(item.i18nKey)
                            }
                          })}
                        />
                        <section
                          style={
                            str !== 'dataChart'
                              ? {
                                  padding: 24,
                                  margin: 0,
                                  minHeight: 280,
                                  background: colorBgContainer,
                                  borderRadius: borderRadiusLG
                                }
                              : {}
                          }
                          className="main-container"
                        >
                          {children}
                        </section>
                      </Space>
                    </Layout>
                  </Layout>
                </Layout>
              )}
            </ConfigProvider>
          </ProgressProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}

export default RootLayout
