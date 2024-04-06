'use client'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import React from 'react'

import type { MenuProps } from 'antd'
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
import jp from 'antd/locale/ja_JP'
import 'dayjs/locale/ja'
import { DownOutlined } from '@ant-design/icons'
import { usePathname } from 'next/navigation'
import { menu } from '../config/menu'
import '../assets/css/normalize.scss'

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const { Header, Content, Sider } = Layout
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()
  const pathname = usePathname()
  const onClick: MenuProps['onClick'] = (e) => {}
  const pathnames = pathname.split('/').filter((x) => x)

  console.log(pathnames, pathname)
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

  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ConfigProvider locale={jp}>
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
                <Dropdown menu={{ items }} placement="bottom">
                  <Avatar src={url} />
                </Dropdown>
              </Header>
              <Layout>
                <Sider width={200} style={{ background: colorBgContainer }}>
                  <Menu
                    onClick={onClick}
                    defaultSelectedKeys={['/movie']}
                    // theme="dark"
                    mode="inline"
                    items={menu.map((item) => {
                      return {
                        label: item.name,
                        key: item.router
                      }
                    })}
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
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
