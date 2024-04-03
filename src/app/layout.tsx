
"use client"
import { AntdRegistry } from '@ant-design/nextjs-registry'
import React from 'react'

import type { MenuProps } from 'antd'
import { Menu, Breadcrumb, Layout, theme } from 'antd'
import { usePathname } from 'next/navigation'
import { menu } from '../config/menu'
import '../assets/css/normalize.scss'



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { Header, Content, Sider } = Layout
  const {
   token: { colorBgContainer, borderRadiusLG }
 } = theme.useToken()


 const onClick: MenuProps['onClick'] = (e) => {
 };
 
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <Layout style={{
            height: '100vh'
          }}>
            <Header style={{ display: 'flex', alignItems: 'center' }}>
              <div className="demo-logo" />
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
              <Layout style={{ padding: '0 24px 24px' }}>
                <Content
                  style={{
                    padding: 24,
                    margin: 0,
                    minHeight: 280,
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG,
                  }}
                >
                  {children}
                </Content>
              </Layout>
            </Layout>
          </Layout>
        </AntdRegistry>
      </body>
    </html>
  );
}