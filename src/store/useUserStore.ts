import { userInfo, role } from './../type/api'
import { permission } from '../dialog/rolePermission'
import { create } from 'zustand'
import http from '@/api'

import { message } from 'antd'
import dayjs from 'dayjs'

interface Query {
  email: string
  password: string
}
export interface userInfoStore {
  userInfo: Partial<userInfo>
  roleInfo: Partial<role>,
  buttonPermission: Set<string>
  menuPermission: permission[]
  breadcrumb: permission[]
  login(query: Query): Promise<boolean>
  permission(roleId: number): Promise<boolean>
  getBreadcrumb(data: permission[]): void
}

export const useUserStore = create<userInfoStore>((set, get) => {
  return {
    userInfo: {},
    roleInfo: {},
    buttonPermission: new Set([]),
    menuPermission: [],
    breadcrumb: [],
    getBreadcrumb (data) {
      const map = new Map(
        data.map(item => {
          return [item.pathName, item]
        })
      )
      const path = location.pathname.split('/').slice(2)
      const breadcrumb = path.map(item => {
        const data = map.get(item)

        return {
          ...data,
          path: path.at(-1) === data?.pathName ? `${data?.path}${location.search}` : data?.path
        }
      }) as permission[]

      console.log(breadcrumb)
      
      if (path) {
        set({
          breadcrumb
        })
      }
    },
    async permission(roleId: number) {
      const permission = await http({
        url: 'admin/permission/role/permission',
        method: 'get',
        params: {
          id: localStorage.getItem('roleId')
        }
      })
      if (permission.data.length !== 0) {
        const filter = permission.data.filter((item: permission) => item.show)
        set({
          menuPermission: filter,
          buttonPermission: new Set(
            permission.data.reduce((total: string[], current: permission) => {
              return total.concat(
                current.button.map(children => children.code)
              )
            }, [])
          )
        })

        get().getBreadcrumb(permission.data)
        localStorage.setItem('route', JSON.stringify(permission.data))
        localStorage.setItem('roleId', `${roleId}`)
        return Promise.resolve(true)
      } else {
        return Promise.resolve(false)
      }
    },
    async login (query: Query) {
      const userInfo = await http({
        url: 'user/login',
        method: 'post',
        data: query
      })
      localStorage.setItem('token', userInfo.data.token)

      const userRole = await http({
        url: 'admin/user/role',
        method: 'get',
        params: {
          id: userInfo.data.id
        }
      })
      
      localStorage.setItem('userInfo', JSON.stringify(userInfo.data))
      localStorage.setItem('token', userInfo.data.token)
      localStorage.setItem('loginTime', dayjs().format('YYYY-MM-DD HH:mm:ss'))
      // eslint-disable-next-line no-unsafe-optional-chaining
      const first: role = userRole.data.shift()
      
      if (userRole) {
        const result = await get().permission(first.id)

        if (!result) {
          message.info('没有权限')
          return Promise.resolve(false)
        }
  
        return Promise.resolve(true)
      } else {
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(false)
      }
    }
  }
})