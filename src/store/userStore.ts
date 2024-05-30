import { permission } from './../dialog/rolePermission';
import { create } from 'zustand'
import http, { ApiResponse } from '@/api'
import { AxiosResponse } from 'axios'
import { userInfo, response, role } from '@/type/api'
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
  login(query: Query): Promise<boolean>
  permission(roleId: number): Promise<boolean>
}

export const userStore = create<userInfoStore>((set, get) => {
  return {
    userInfo: {},
    roleInfo: {},
    buttonPermission: new Set([]),
    menuPermission: [],
    async permission(roleId: number) {
      const permission = await http({
        url: 'permission/role/permission',
        method: 'get',
        params: {
          id: roleId
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
      const userRole = await http({
        url: 'user/role',
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
      

      const result = await get().permission(first.id)

      if (!result) {
        message.info('没有权限')
        return Promise.resolve(false)
      }

      return Promise.resolve(true)
    }
  }
})