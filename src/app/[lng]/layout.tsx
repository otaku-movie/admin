'use client'
/* eslint-disable react/prop-types */
import { AntdRegistry } from '@ant-design/nextjs-registry'
import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
import { TranslationOutlined } from '@ant-design/icons'
import '@/assets/css/normalize.scss'
import { languages } from '@/config'
import { useTranslation } from '@/app/i18n/client'
import { processPath } from '@/config/router'

export interface PageProps {
  children: React.ReactNode
  params: {
    lng: keyof typeof languages
  }
}

function RootLayout({ children, params: { lng } }: PageProps) {
  const { Header, Content, Sider } = Layout
  const pathname = usePathname()
  const router = useRouter()
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
  return (
    <html lang={lng} dir={lng}>
      <body>
        <AntdRegistry>
          <ConfigProvider locale={locale[lng as keyof typeof locale]}>
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
                      <TranslationOutlined
                        style={{
                          // fill: 'white',
                          verticalAlign: 'middle',
                          color: 'white',
                          fontSize: '24px'
                        }}
                      />
                    </Space>
                  </Dropdown>
                  <Dropdown menu={{ items }} placement="bottom">
                    <Avatar src={url} />
                  </Dropdown>
                </Space>
              </Header>
              <Layout>
                <Sider width={200} style={{ background: colorBgContainer }}>
                  <Menu
                    defaultSelectedKeys={[processPath('movie')]}
                    // theme="dark"
                    mode="inline"
                    items={[
                      {
                        key: '/cinema',
                        label: (
                          <Link href={processPath('cinema')}>
                            {t('menu.cinemaList')}
                          </Link>
                        )
                      },
                      {
                        key: '/movie',
                        label: (
                          <Link href={processPath('movie')}>
                            {t('menu.movieList')}
                          </Link>
                        )
                      },
                      {
                        key: '/showTime',
                        label: (
                          <Link href={processPath('showTime')}>
                            {t('menu.showTimeList')}
                          </Link>
                        )
                      },
                      // {
                      //   key: '/selectSeat',
                      //   label: (
                      //     <Link href={'selectSeat'}>
                      //       {t('menu.selectSeat')}
                      //     </Link>
                      //   )
                      // },
                      {
                        key: '/orderList',
                        label: (
                          <Link href={processPath('orderList')}>
                            {t('menu.orderList')}
                          </Link>
                        )
                      },
                      {
                        key: '/user',
                        label: (
                          <Link href={processPath('user')}>
                            {t('menu.userList')}
                          </Link>
                        )
                      },
                      {
                        key: '/dict',
                        label: (
                          <Link href={processPath('dict')}>
                            {t('menu.dictList')}
                          </Link>
                        )
                      }
                    ]}
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

export default RootLayout
