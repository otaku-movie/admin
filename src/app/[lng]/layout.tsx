'use client'
/* eslint-disable react/prop-types */
import { AntdRegistry } from '@ant-design/nextjs-registry'
import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { MenuProps } from 'antd'
import Link from 'next/link'
import {
  ConfigProvider,
  Menu,
  Breadcrumb,
  Layout,
  theme,
  Dropdown,
  Space,
  Avatar
} from 'antd'
import ja from 'antd/locale/ja_JP'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/ja'
import '@/assets/css/normalize.scss'
import { languages } from '@/config'
import { useTranslation } from '@/app/i18n/client'
import { processPath } from '@/config/router'
import { useUserStore } from '@/store/useUserStore'
import { getUserInfo, listToTree } from '@/utils'
import { permission } from '@/dialog/rolePermission'
import { ItemType, MenuItemType } from 'antd/es/menu/hooks/useItems'

export interface PageProps {
  children: React.ReactNode
  params: {
    lng: keyof typeof languages
  }
}

function RootLayout({ children, params: { lng } }: PageProps) {
  const { Header, Content, Sider } = Layout
  const pathname = usePathname()
  const getPermission = useUserStore((state) => state.permission)
  const menu = useUserStore((state) => listToTree(state.menuPermission))

  const { t } = useTranslation(lng, 'common')

  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const items: MenuProps['items'] = [
    {
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.antgroup.com"
        >
          1st menu item
        </a>
      ),
      key: '0'
    },
    {
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.aliyun.com"
        >
          2nd menu item
        </a>
      ),
      key: '1'
    }
  ]

  const url =
    'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg'

  const locale = {
    ja,
    'zh-CN': zhCN
  }
  const split = usePathname()
    .split('/')
    .filter((item) => item !== '')
  const set = new Set(['login'])

  useEffect(() => {
    const roleId = localStorage.getItem('roleId')
    if (roleId) {
      getPermission(+roleId)
    }
  }, [])
  const userInfo = getUserInfo()

  const recursion = (menu: permission[]): ItemType<MenuItemType>[] => {
    return menu.map((item) => {
      if (Array.isArray(item.children)) {
        return {
          key: `${item.path}`,
          label: !Array.isArray(item.children) ? (
            <Link href={processPath(item.pathName)}>{t(item.i18nKey)}</Link>
          ) : (
            t(item.i18nKey)
          ),
          children: recursion(item.children)
        }
      } else {
        return {
          key: `${item.path}`,
          label: (
            <Link href={processPath(item.pathName)}>{t(item.i18nKey)}</Link>
          ),
          children: null
        }
      }
    })
  }

  return (
    <html lang={lng} dir={lng}>
      <body>
        <AntdRegistry>
          <ConfigProvider locale={locale[lng as keyof typeof locale]}>
            {set.has(split[1]) ? (
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
                          console.log(str, info)
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
                          {languages[lng as keyof typeof languages]}
                        </span>
                        <span style={{
                          color: 'white'
                        }}>{userInfo.name}</span>                        
                      </Space>
                    </Dropdown>
                    <Dropdown menu={{ items }} placement="bottom">
                      <Avatar src={userInfo.cover || url} />
                    </Dropdown>
                  </Space>
                </Header>
                <Layout>
                  <Sider width={200} style={{ background: colorBgContainer }}>
                    <Menu
                      defaultSelectedKeys={[pathname]}
                      // theme="dark"
                      mode="inline"
                      items={recursion(menu)}
                    />
                  </Sider>
                  <Layout style={{ padding: '20px' }}>
                    <Space direction="vertical" size={20}>
                      <Breadcrumb
                        separator=">"
                        items={[
                          {
                            title: 'Home'
                          },
                          {
                            title: 'Application Center',
                            href: ''
                          },
                          {
                            title: 'Application List',
                            href: ''
                          },
                          {
                            title: 'An Application'
                          }
                        ]}
                      />
                      <Content
                        style={{
                          padding: 24,
                          margin: 0,
                          minHeight: 280,
                          background: colorBgContainer,
                          borderRadius: borderRadiusLG
                        }}
                      >
                        {children}
                      </Content>
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
