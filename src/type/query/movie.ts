import { MovieMergeFieldOverrides } from '@/type/api'

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

/** 重复电影候选组分页查询 */
export type MovieDuplicateQuery = PaginationQuery

/** 手动搜索可合并电影 */
export interface MovieMergeSearchQuery {
  keyword: string
}

/** 合并详情对比：批量按 id 拉取候选电影完整信息 */
export interface MovieMergeDetailQuery {
  ids: number[]
}

/** 合并请求体 */
export interface MovieMergeBody {
  survivorId: number
  loserIds: number[]
  newName?: string
  fieldOverrides?: MovieMergeFieldOverrides
}

/** 处理待确认重复匹配 */
export interface MoviePendingMatchResolveBody {
  pendingId: number
  action: 'merge' | 'ignore'
  survivorId?: number
  loserIds?: number[]
  newName?: string
  fieldOverrides?: MovieMergeFieldOverrides
}