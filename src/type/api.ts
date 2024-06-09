export interface paginationResponse<T> {
  page: number
  total: number
  pageSize: number,
  list: T
}
export interface response<T = any> {
  code: number
  message: string
  data: paginationResponse<T> | T
}


export interface Cinema {
  id: number
  name: string
  description: string
  homePage: string
  tel: string
  address: string
}

export interface theaterHall {
  id: number
  name: string
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

export interface seatItem {
  id: number
  seatType: number
  xaxis: number
  xname: string
  yaxis: number
  zaxis: number
  selected: boolean
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
