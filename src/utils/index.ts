import { menuItem } from './../type/api';
'use client'
export const emailRegExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
// 数字、字母、下划线 .
export const passwordRegExp = /^[A-Za-z0-9_\-.]{6,16}$/
export const usernameRegExp = /^[A-Za-z0-9_\-.]{6,16}$/

export const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo')

  try {
    return userInfo ? JSON.parse(userInfo) : {}
  } catch (err) {

  }
}

export const camelCase = key => key.replace(/[-_](.)/g, (_, char) => char.toUpperCase())

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

export function listToTree<T extends menuItem>(data: T[]): T[] {
  const arr = data.filter(item => item.parentId === null)

  const fn = (menuList: T[], childrenMenu: T[]): T[] => {
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

export function callTree<T extends { children: T[]}> (arr: T[], fn: (item: T) => void): void {
  arr?.forEach(item => {
    fn(item)
    if (item.children?.length > 0) { 
      callTree(item.children, fn)
    }
  })
}

export function flattern<T extends { children: T[] }> (arr: T[]): T[] {
  return arr.reduce((total, current) => {
    return total.concat(
      Array.isArray(current.children)
        ? flattern(current.children)
        : current
    );
  }, [] as T[]);
}