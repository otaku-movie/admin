import { create } from 'zustand'
import http from '@/api'
import { DictItem } from '@/type/api'

export interface dictStore {
  dict: Record<string, DictItem[]>
  getDict(code: string[]): void
}

export const dictStore = create<dictStore>((set, get) => {
  return {
    dict: {},
    async getDict(code: string[]) {
      const res = await http({
        url: 'dict/specify',
        method: 'post',
        data: { code }
      })

      return set({ 
        dict: Object.keys(res.data).reduce((map, current) => {
          map[current] = res.data[current]
          return map
        }, get().dict) 
      })
    }
  }
})