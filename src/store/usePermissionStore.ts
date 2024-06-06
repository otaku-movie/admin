import { create } from 'zustand'
import http from '@/api'
import { menuItem } from '@/type/api'
import { listToTree } from '../utils'

export interface permissionStoreOptions {
  menu: menuItem[]
  getMenu(flattern?: boolean): void
}

export const usePermissionStore = create<permissionStoreOptions>((set) => {
  return {
    menu: [],
    async getMenu(flattern: boolean = false) {
      const res = await http({
        url: 'admin/permission/menu/list',
        method: 'post',
        data: {
          flattern
        }
      })

      const result = listToTree<menuItem>(res.data)
      

      set({
        menu: flattern ? res.data : result
      })
    }
  }
})