// components/MyMenu.js
import React, { useEffect, useState } from 'react'
import { Menu as AntdMenu } from 'antd'
import Link from 'next/link'
import { permission } from '@/dialog/rolePermission'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'
import { processPath } from '@/config/router'
import { ItemType, MenuItemType } from 'antd/es/menu/interface'

interface Props {
  data: permission[]
}

function findMatchedKey(
  menu: permission[],
  pathname: string
): string | undefined {
  for (const item of menu) {
    if (pathname.startsWith(item.path)) {
      if (item.children?.length) {
        const childKey = findMatchedKey(item.children, pathname)
        if (childKey) return childKey
      }
      return item.path
    }
  }
  return undefined
}

export function Menu(props: Readonly<Props>) {
  const { t } = useTranslation(navigator.language as languageType, 'common')

  const recursion = (menu: permission[]): ItemType<MenuItemType>[] => {
    return menu.map((item) => {
      const name = t(item.i18nKey)

      if (Array.isArray(item.children)) {
        return {
          key: `${item.path}`,
          label: !Array.isArray(item.children) ? (
            <Link href={processPath(item.pathName)}>{name}</Link>
          ) : (
            name
          ),
          children: recursion(item.children)
        }
      } else {
        return {
          key: `${item.path}`,
          label: <Link href={processPath(item.pathName)}>{name}</Link>,
          children: null
        }
      }
    })
  }

  // 获取当前路径（去除语言前缀）
  const removeLangPrefix = () => {
    return location.pathname.split(navigator.language).slice(1).join('')
  }
  const currentPath = removeLangPrefix()
  const matchedKey = findMatchedKey(props.data, currentPath) ?? currentPath
  const openKey = '/' + removeLangPrefix().split('/')[1]

  const [selectedKeys, setSelectedKeys] = useState<string[]>([matchedKey])
  const [openKeys, setOpenKeys] = useState<string[]>([openKey])

  useEffect(() => {
    setSelectedKeys([matchedKey])
    setOpenKeys([openKey])
  }, [location.pathname, matchedKey, openKey])

  return (
    <AntdMenu
      mode="inline"
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      items={recursion(props.data)}
    />
  )
}
