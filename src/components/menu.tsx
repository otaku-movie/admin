// components/MyMenu.js
import React, { useEffect, useMemo, useState } from 'react'
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
    const hasChildren = Array.isArray(item.children) && item.children.length > 0

    // 先按当前节点 path 做前缀匹配；如果失败，则仍然尝试向下找（用于我们插入的虚拟分组层）
    if (pathname.startsWith(item.path)) {
      if (hasChildren) {
        const childKey = findMatchedKey(item.children, pathname)
        if (childKey) return childKey
      }
      return item.path
    }

    if (hasChildren) {
      const childKey = findMatchedKey(item.children, pathname)
      if (childKey) return childKey
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
          label: name,
          children: recursion(item.children)
        }
      }

      return {
        key: `${item.path}`,
        label: <Link href={processPath(item.pathName)}>{name}</Link>,
        children: null
      }
    })
  }

  // 展示层菜单重组：按 common.json 的 menu2 结构分组展示（不改后端/DB 结构）
  const displayData = useMemo(() => {
    const nextId = (() => {
      let id = -1000
      return () => id--
    })()

    const collectByI18nKeys = (nodes: permission[] | null | undefined, keys: string[]) => {
      const set = new Set(keys)
      const res: permission[] = []
      const dfs = (arr: permission[] | null | undefined) => {
        if (!Array.isArray(arr)) return
        for (const n of arr) {
          if (typeof n?.i18nKey === 'string' && set.has(n.i18nKey)) res.push(n)
          if (Array.isArray(n.children) && n.children.length) dfs(n.children)
        }
      }
      dfs(nodes)
      return res
    }

    const makeGroup = (rootPath: string, i18nKey: string, children: permission[]): permission => {
      return {
        id: nextId(),
        parentId: null,
        name: '',
        i18nKey,
        path: `${rootPath}/_group/${i18nKey}`,
        pathName: rootPath,
        show: true,
        orderNum: 0,
        children
      } as any
    }

    const cloneWithI18nKey = (node: permission, i18nKey: string, children?: permission[] | null): permission => {
      return {
        ...node,
        i18nKey,
        ...(children !== undefined ? { children } : {})
      }
    }

    const operationsRoot = props.data.find((n) => n.i18nKey === 'menu.pricingStrategy.name')
    const contentRoot = props.data.find((n) => n.i18nKey === 'menu.movie.name')
    const cinemaRoot = props.data.find((n) => n.i18nKey === 'menu.cinema.name')
    const dataRoot = props.data.find((n) => n.i18nKey === 'menu.dataChart')
    const systemRoot = props.data.find((n) => n.i18nKey === 'menu.permission.name')

    const out: permission[] = []

    if (operationsRoot) {
      const showTimeNode =
        collectByI18nKeys([operationsRoot], ['menu.showTime.name'])[0] ??
        collectByI18nKeys([operationsRoot], ['menu.showTime.children.showTimeList'])[0]
      const benefitNode = collectByI18nKeys([operationsRoot], ['menu.movie.children.benefitList'])[0]
      const presaleNode = collectByI18nKeys([operationsRoot], ['menu.pricingStrategy.children.presale'])[0]
      const orderListNode = collectByI18nKeys([operationsRoot], ['menu.orderList'])[0]

      const children: permission[] = []
      if (showTimeNode) children.push(cloneWithI18nKey(showTimeNode, 'menu2.operationsCenter.children.showTime'))
      if (benefitNode) children.push(cloneWithI18nKey(benefitNode, 'menu2.operationsCenter.children.benefitList'))
      if (presaleNode) children.push(cloneWithI18nKey(presaleNode, 'menu2.operationsCenter.children.presale'))
      if (orderListNode) {
        const orderGroup = makeGroup(operationsRoot.path, 'menu2.operationsCenter.children.orderManagement.name', [
          cloneWithI18nKey(orderListNode, 'menu2.operationsCenter.children.orderManagement.children.orderList')
        ])
        children.push(orderGroup)
      }

      out.push(cloneWithI18nKey(operationsRoot, 'menu2.operationsCenter.name', children))
    }

    if (contentRoot) {
      const movieListNode = collectByI18nKeys([contentRoot], ['menu.movie.children.movieList'])[0]
      const commentNode = collectByI18nKeys([contentRoot], ['menu.movie.children.commentList'])[0]
      const staffNode = collectByI18nKeys([contentRoot], ['menu.movie.children.staffList'])[0]
      const attrNode = collectByI18nKeys([contentRoot], ['menu.movie.children.levelList'])[0]

      const children: permission[] = []
      if (movieListNode) children.push(makeGroup(contentRoot.path, 'menu2.contentManagement.children.movieManagement.name', [
        cloneWithI18nKey(movieListNode, 'menu2.contentManagement.children.movieManagement.children.movieList', movieListNode.children ?? null)
      ]))
      if (commentNode) children.push(makeGroup(contentRoot.path, 'menu2.contentManagement.children.commentManagement.name', [
        cloneWithI18nKey(commentNode, 'menu2.contentManagement.children.commentManagement.children.commentList', commentNode.children ?? null)
      ]))
      if (staffNode) children.push(makeGroup(contentRoot.path, 'menu2.contentManagement.children.staffManagement.name', [
        cloneWithI18nKey(staffNode, 'menu2.contentManagement.children.staffManagement.children.staffList', staffNode.children ?? null)
      ]))
      if (attrNode) children.push(makeGroup(contentRoot.path, 'menu2.contentManagement.children.attributeConfig.name', [
        cloneWithI18nKey(attrNode, 'menu2.contentManagement.children.attributeConfig.children.levelList', attrNode.children ?? null)
      ]))

      out.push(cloneWithI18nKey(contentRoot, 'menu2.contentManagement.name', children))
    }

    if (cinemaRoot) {
      const cinemaListNode = collectByI18nKeys([cinemaRoot], ['menu.cinema.children.cinemaList'])[0]
      const cinemaDetailNode = collectByI18nKeys([cinemaRoot], ['menu.cinema.children.cinemaDetail'])[0]
      const hallNode = collectByI18nKeys([cinemaRoot], ['menu.cinema.children.theaterHall'])[0]

      const children: permission[] = []
      if (cinemaListNode) children.push(cloneWithI18nKey(cinemaListNode, 'menu2.cinemaManagement.children.cinemaList'))
      if (cinemaDetailNode) children.push(cloneWithI18nKey(cinemaDetailNode, 'menu2.cinemaManagement.children.cinemaDetail'))
      if (hallNode) children.push(cloneWithI18nKey(hallNode, 'menu2.cinemaManagement.children.theaterHall'))

      out.push(cloneWithI18nKey(cinemaRoot, 'menu2.cinemaManagement.name', children))
    }

    if (dataRoot) {
      const wrapper = {
        id: nextId(),
        parentId: null,
        name: '',
        i18nKey: 'menu2.dataChart.name',
        path: dataRoot.path,
        pathName: dataRoot.pathName,
        show: true,
        orderNum: dataRoot.orderNum,
        children: [cloneWithI18nKey(dataRoot, 'menu2.dataChart.children.dataChart')]
      } as any
      out.push(wrapper)
    }

    if (systemRoot) {
      const roleNode = collectByI18nKeys([systemRoot], ['menu.permission.children.roleList'])[0]
      const menuNode = collectByI18nKeys([systemRoot], ['menu.permission.children.menuList'])[0]
      const buttonNode = collectByI18nKeys([systemRoot], ['menu.permission.children.buttonList'])[0]
      const userNode = collectByI18nKeys(props.data, ['menu.userList'])[0]
      const appVersionNode = collectByI18nKeys(props.data, ['menu.appVersionList'])[0]
      const dictNode = collectByI18nKeys(props.data, ['menu.dictList'])[0]

      const children: permission[] = []
      const permissionChildren: permission[] = []
      if (roleNode) permissionChildren.push(cloneWithI18nKey(roleNode, 'menu2.systemManagement.children.permissionManagement.children.role'))
      if (menuNode) permissionChildren.push(cloneWithI18nKey(menuNode, 'menu2.systemManagement.children.permissionManagement.children.menu'))
      if (buttonNode) permissionChildren.push(cloneWithI18nKey(buttonNode, 'menu2.systemManagement.children.permissionManagement.children.button'))
      if (permissionChildren.length) {
        children.push(makeGroup(systemRoot.path, 'menu2.systemManagement.children.permissionManagement.name', permissionChildren))
      }

      if (userNode) {
        children.push(makeGroup(systemRoot.path, 'menu2.systemManagement.children.userManagement.name', [
          cloneWithI18nKey(userNode, 'menu2.systemManagement.children.userManagement.children.userList')
        ]))
      }

      if (appVersionNode) {
        children.push(makeGroup(systemRoot.path, 'menu2.systemManagement.children.appVersionManagement.name', [
          cloneWithI18nKey(appVersionNode, 'menu2.systemManagement.children.appVersionManagement.children.appVersionList')
        ]))
      }

      if (dictNode) children.push(cloneWithI18nKey(dictNode, 'menu2.systemManagement.children.dictList'))

      out.push(cloneWithI18nKey(systemRoot, 'menu2.systemManagement.name', children))
    }

    // 如果识别不到任何根节点，退回原始菜单，避免空白
    return out.length ? out : props.data
  }, [props.data])

  // 获取当前路径（去除语言前缀）
  const removeLangPrefix = () => {
    return location.pathname.split(navigator.language).slice(1).join('')
  }
  const currentPath = removeLangPrefix()
  const matchedKey = findMatchedKey(displayData, currentPath) ?? currentPath
  const openKeyFallback = '/' + removeLangPrefix().split('/')[1]

  // 根据 matchedKey 在树中的祖先链计算 openKeys，避免「按 URL 第一段」导致的误折叠
  const computedOpenKeys = useMemo(() => {
    const keys: string[] = []

    const dfs = (nodes: permission[]): boolean => {
      for (const n of nodes) {
        const hasChildren = Array.isArray(n.children) && n.children.length > 0

        if (n.path === matchedKey) {
          if (hasChildren) keys.push(n.path)
          return true
        }

        if (hasChildren) {
          keys.push(n.path)
          if (dfs(n.children)) return true
          keys.pop()
        }
      }
      return false
    }

    dfs(displayData)
    return keys
  }, [displayData, matchedKey])

  const [selectedKeys, setSelectedKeys] = useState<string[]>([matchedKey])
  const [openKeys, setOpenKeys] = useState<string[]>([openKeyFallback])

  useEffect(() => {
    setSelectedKeys([matchedKey])
    setOpenKeys(computedOpenKeys.length ? computedOpenKeys : [openKeyFallback])
  }, [location.pathname, matchedKey, computedOpenKeys, openKeyFallback])

  return (
    <AntdMenu
      mode="inline"
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      items={recursion(displayData)}
    />
  )
}
