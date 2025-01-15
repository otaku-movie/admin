
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export type ApiPaginationResponse<T> = ApiResponse<T> & {
  page: number
  total: number
  pageSize: number,
  list: T
}

export interface HelloMovie {
  id: number
  code: number
  date: string
}

export interface Cinema {
  id: number
  name: string
  description: string
  homePage: string
  tel: string
  address: string
  maxSelectSeatCount: number
}

export interface theaterHall {
  id: number
  name: string
  cinemaSpecId: number
  cinemaSpecName: string
}

export interface DictItem {
  id: number
  name: string
  code: number
  dictId: number
}

export interface SpecItem {
  id: number
  name: string
  description: string
}

export interface Tag {
  id: number
  name: string
}

export interface Movie {
  id: number
  cover: string
  name: string
  originalName: string
  description: string
  homePage: string
  time: number
  status: 1 | 2 | 3
  levelId: number
  levelName: string
  spec: SpecItem[]
  tags: Tag[]
  helloMovie: HelloMovie[]
}

export interface user {
  id: number
  cover: string
  username: string
  email: string
  createTime: string
}

export interface menuItem {
  parentId: number | null
  id: number
  name: string
  i18nKey: string
  path: string
  pathName: string
  show: boolean
}

export type buttonItem = menuItem & {
  children: buttonItem[]
  selected: number[]
  checked: boolean
  button: {
    id: number
    name: string
    i18nKey: string
    apiCode: string
    checked: boolean
  }[]
}

export type userInfo = user & {
  token: string
}
export interface base {
  id: number
  name: string
  description: string
}

export interface role {
  id: number
  name: string
}

export interface position {
  id: number
  name: string
}

export type character = base

export type staff = base

export type level = base

export interface Area {
  id?: number
  color?: string
  name?: string
  price?: number
  hover: boolean
  selected?: boolean
  // selected: boolean
}

export interface SeatItem {
  id: number
  type: 'seat' | 'aisle'
  seatPositionGroup: string | null
  show: boolean
  disabled: boolean
  wheelChair: boolean
  rowName?: string
  seatName?: string
  x: number
  y: number
  z: number
  selectSeatState: 1 | 2 | 3 | 4
  // 代表 selectSeatState的 1 2， 1为false 2 为true
  selected: boolean
  left?: number
  top?: number
  area: Area | null
}
