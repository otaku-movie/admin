// components/MyMenu.js
import React from 'react'
import { Menu as AntdMenu } from 'antd'
import Link from 'next/link'
import { permission } from '@/dialog/rolePermission'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'
import { processPath } from '@/config/router'
import { ItemType, MenuItemType } from 'antd/es/menu/hooks/useItems'

interface Props {
  data: permission[]
}

export function Menu(props: Props) {
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
  const removeLangPrefix = () => {
    return location.pathname.split(navigator.language).slice(1) + ''
  }
  const openKey = '/' + removeLangPrefix().split('/')[1]

  return (
    <AntdMenu
      mode="inline"
      // defaultOpenKeys={[openKey]}
      // defaultSelectedKeys={[removeLangPrefix()]}
      items={recursion(props.data)}
    >
    </AntdMenu>
  )
}
