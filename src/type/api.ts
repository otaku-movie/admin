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

export interface Movie {
  id: number
  cover: string
  name: string
  description: string
}

export interface Cinema {
  name: string
  description: string
  homePage: string
  tel: string
  address: string
}