export interface PaginationQuery {
  page: number
  pageSize: number
}

export type MovieListQuery = PaginationQuery & {
  status?: number
}


export interface GetDetailQuery {
  id: number
}