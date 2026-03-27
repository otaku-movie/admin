export interface PaginationQuery {
  page: number
  pageSize: number
}

export type MovieListQuery = PaginationQuery & {
  status?: number
  name?: string
  /** null/undefined=全部，1=仅重映，0=仅未重映 */
  hasReRelease?: 0 | 1
}


export interface GetDetailQuery {
  id: number
}