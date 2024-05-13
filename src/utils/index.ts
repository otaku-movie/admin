'use client'
export const emailRegExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
// 数字、字母、下划线 .
export const passwordRegExp = /^[A-Za-z0-9_\-.]{6,16}$/

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
