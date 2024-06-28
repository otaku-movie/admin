import { create } from 'zustand'
import http from '@/api'
import { DictItem, character, position, staff, level } from '@/type/api'

interface CharacterQuery {
  name?: string
  id?: number[]
}

interface PositionListQuery {
  name?: string
  id?: number
}
interface StaffListQuery {
  name?: string
  id?: number[]
}

export interface commonStore {
  characterList: character[]
  positionList: position[]
  levelList: level[]
  staffList: staff[]
  dict: Record<string, DictItem[]>
  getDict(code: string): Promise<Record<string, DictItem[]>>
  getCharacterList(query?: CharacterQuery): Promise<character[]>
  getPositionList(query?: PositionListQuery): void
  getStaffList(query?: StaffListQuery): Promise<staff[]>
  getLevelList (): void
}



export const useCommonStore = create<commonStore>((set, get) => {
  return {
    positionList: [],
    characterList: [],
    staffList: [],
    levelList: [],
    dict: {},
    getDict(code: string) {
      return new Promise((resolve) => {
        if (!get().dict[code]) {
          http({
            url: 'dict/specify',
            method: 'post',
            data: { code }
          }).then((res) => {
            const dict =  Object.keys(res.data).reduce((map, current) => {
              map[current] = res.data[current]
              return map
            }, get().dict)
  
            set({ 
              dict
            })
  
            resolve(dict)
          })
        } else {
          resolve(get().dict)
        }
      })
    },
    getLevelList () {
      http({
        url: 'movie/level/list',
        method: 'post',
        data: {
          page: 1,
          pageSize: 10
        }
      }).then(res => {
        set({
          levelList: res.data.list
        })
      })
    },
    getCharacterList (query: CharacterQuery = {}) {
      return new Promise((resolve) => {
        http({
          url: '/character/list',
          method: 'post',
          data: {
            page: 1,
            pageSize: 10,
            ...query
          }
        }).then((res) => {
          set({
            characterList: res.data.list
          })
          resolve(res.data.list)
        })
      })
    },
    getPositionList (query: PositionListQuery = {}) {
      http({
        url: '/position/list',
        method: 'post',
        data: {
          page: 1,
          pageSize: 10,
          ...query
        }
      }).then((res) => {
        set({
          positionList: res.data.list
        })
      })
    },
    getStaffList (query: StaffListQuery = {}) {
      return new Promise((resolve) => {
        http({
          url: '/staff/list',
          method: 'post',
          data: {
            page: 1,
            pageSize: 10,
            ...query
          }
        }).then((res) => {
          set({
            staffList: res.data.list
          })
          resolve(res.data.list)
        })
      })
      
    }
  }
})