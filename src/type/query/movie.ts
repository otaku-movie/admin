export interface PaginationQuery {
  page: number
  pageSize: number
}

export type MovieListSortField =
  | 'cinemaCount'
  | 'theaterCount'
  | 'commentCount'
  | 'watchedCount'
  | 'wantToSeeCount'
  | 'startDate'
  | 'endDate'

export type MovieListQuery = PaginationQuery & {
  status?: number
  name?: string
  /** null/undefined=全部，1=仅重映，0=仅未重映 */
  hasReRelease?: 0 | 1
  /** 与后端 MovieListQuery.ALLOWED_SORT_FIELDS 严格对应；未设置时走默认 update_time DESC */
  sortField?: MovieListSortField
  /** 仅允许 asc / desc，其它值会被后端忽略 */
  sortOrder?: 'asc' | 'desc'
}


export interface GetDetailQuery {
  id: number
}