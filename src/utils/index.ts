'use client'
export const emailRegExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
// 数字、字母、下划线 .
export const passwordRegExp = /^[A-Za-z0-9_\-.]{6,16}$/
export const usernameRegExp = /^[A-Za-z0-9_\-.]{6,16}$/

export const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo')

  console.log(userInfo)
  try {
    return userInfo ? JSON.parse(userInfo) : {}
  } catch (err) {

  }
}

export const camelCase = (key: string) => key.replace(/[-_](.)/g, (_, char) => char.toUpperCase())

export function toCamelCase(input: any): any {
  if (input === null || typeof input !== 'object') {
    return input
  }

  if (Array.isArray(input)) {
    return input.map((item) => toCamelCase(item))
  }

  if (typeof input === 'object') {
    const result: any = {}
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        const newKey = camelCase(key)
        result[newKey] = toCamelCase(input[key])
      }
    }
    return result
  }

  return input
}

interface TreeNode<T> {
  parent?: T | null
  parentId: number | null
  id: number
  depth?: number
  children?: TreeNode<T>[] | null
}

export function callTree<T extends TreeNode<T>>(arr: T[], fn: (item: T) => void, parent: T | null = null, depth = 1): void {
  arr?.forEach(item => {
    item.parent = parent
    item.depth = depth
    fn(item)
    if (Array.isArray(item.children)) {
      callTree(item.children as any, fn, item, item.depth + 1)
    }
  })
}

export function listToTree<T extends TreeNode<T>>(data: T[]) {
  const arr = data.filter(item => item.parentId === null).map(item => {
    return {
      ...item,
      children: null
    }
  })

  const fn = (menuList: T[], childrenMenu: T[]): T[] => {
    // debugger
    return childrenMenu.map(item => {
      const children = menuList.reduce<T[]>((prev, current) => {
        return current.parentId === item.id ? prev.concat(current) : prev
      }, [])
      return {
        ...item,
        children: children.length > 0 ? fn(menuList, children) : null
      }
    })
  }

  return fn(data.filter(item => item.parentId !== null), arr)
}


export const flattern = <T extends any[] = Record<string, any>[]>(arr: T, key = 'children'): Record<string, any>[] => {
  return arr.reduce((total, current) => {
    const isArray = Array.isArray(current[key])
    total.push(current)

    if (isArray) {
      total.push(...flattern(current[key], key))
    }

    return total
  }, [])
}

export const hasChecked = (node: any): boolean => {
  // debugger
  if (node?.children?.length === 0 && node.checked !== false) return true
  return node.children?.length !== 0 && node.children?.every((item: any) => item.checked)
}
export const hasIndeterminate = (node: any): boolean => {
  return !hasChecked(node) && node.children?.some((item: any) => item.checked || item.indeterminate)
}

export function setCheckedStatus (nodes: any[], selectedIds: number[]): void {
  // debugger
  // Step 1: Set the checked status based on the selected IDs
  const updateCheckedStatus = (nodes: any[]) => {
    nodes.forEach(node => {
      node.checked = selectedIds.includes(node.id)
      if (Array.isArray(node.children) && node.children.length > 0) {
        updateCheckedStatus(node.children)
      }
    })
  }
  
  
  updateCheckedStatus(nodes)

  // Step 2: Update the halfChecked and parent checked status recursively
  const updateParentStatus = (nodes: any[]): void => {
    nodes.forEach(node => {
      if (Array.isArray(node.children) && node.children.length > 0) {
        updateParentStatus(node.children)
        const allChecked = node.children.every((child: any) => child.checked)
        const someChecked = node.children.some((child: any) => child.checked || child.halfChecked)

        if (allChecked) {
          node.checked = true
          node.indeterminate = false
        } else if (someChecked) {
          node.checked = false
          node.indeterminate = true
        } else {
          node.checked = false
          node.indeterminate = false
        }
      }
    })
  }
  updateParentStatus(nodes)
}
