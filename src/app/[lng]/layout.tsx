'use client'
/* eslint-disable react/prop-types */
import { AntdRegistry } from '@ant-design/nextjs-registry'
import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { MenuProps } from 'antd'
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'

import {
  ConfigProvider,
  Breadcrumb,
  Layout,
  theme,
  Dropdown,
  Space,
  Avatar,
  message,
  FloatButton
} from 'antd'
import ja from 'antd/locale/ja_JP'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'

import 'dayjs/locale/ja'
import '@/assets/css/normalize.scss'
import { languages } from '@/config'
import { useTranslation } from '@/app/i18n/client'
import { processPath } from '@/config/router'
import { useUserStore } from '@/store/useUserStore'
import { getURL, getUserInfo, listToTree } from '@/utils'
import { Menu } from '@/components/menu'
import Cookies from 'js-cookie'
import { useCommonStore } from '@/store/useCommonStore'
import { useRouter } from 'next/router'
import http from '@/api'

export interface PageProps {
  children: React.ReactNode
  params: {
    lng: keyof typeof languages
  }
}

function RootLayout({ children, params: { lng } }: PageProps) {
  const { Header, Sider } = Layout
  const pathname = usePathname()
  const userStore = useUserStore()
  // const breadcrumb = useUserStore((state) => state.breadcrumb)
  const getDict = useCommonStore((state) => state.getDict)
  const getPermission = useUserStore((state) => state.permission)
  const menu = useUserStore((state) => listToTree(state.menuPermission))
  const { t } = useTranslation(lng, 'common')

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

  const userInfo = getUserInfo()
  const lang = pathname.split('/')[1]

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
                    <Dropdown
                      menu={{ items, onClick: userDropDownMenuClick }}
                      placement="bottom"
                    >
                      <Space>
                        <Avatar src={getURL(userInfo.cover || url)} />
                        <span
                          style={{
                            color: 'white'
                          }}
                        >
                          {userInfo.name}
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
                        <ProgressBar
                          height="4px"
                          color="#1677ff"
                          options={{ showSpinner: true }}
                          shallowRouting
                        />
                      </section>
                    </Space>
                  </Layout>
                </Layout>
              </Layout>
            )}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}

export default RootLayout
