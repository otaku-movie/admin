
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

/** 重复电影候选组里的单行（也用于手动搜索结果） */
export interface MovieDuplicateItem {
  id: number
  name: string
  movieKey?: string
  tmdbId?: number
  /** 0=活跃 1=已软删 */
  deleted: number
  kind: string
  releaseDate?: string
  /** 当前挂着的未删除场次数 */
  showCount: number
  /** 合并前关联计数摘要，如 show=12,comment=1 */
  referenceSummary?: string
}

/** 一组疑似同一部电影的重复候选行 */
export interface MovieDuplicateGroup {
  /** same_tmdb=同 tmdb_id；same_name=名字完全相同 */
  reason: 'same_tmdb' | 'same_name'
  groupValue: string
  recommendedSurvivorId: number
  items: MovieDuplicateItem[]
}

/** 合并结果回包 */
export interface MovieMergeResult {
  survivorId: number
  survivorName: string
  mergedCount: number
  survivorShowCount: number
}

/** 合并详情对比页：单部候选电影的关联表结构化计数 */
export interface MovieMergeDetailCounts {
  show: number
  reRelease: number
  benefit: number
  presale: number
  comment: number
  rate: number
  staff: number
  character: number
  spec: number
  tag: number
  version: number
}

/** 合并详情对比页：场次按影院分布 */
export interface MovieMergeShowtimeByCinema {
  cinemaId?: number
  cinemaName?: string
  count: number
  firstDate?: string
  lastDate?: string
}

/** 合并详情对比页：staff 名单样本 */
export interface MovieMergeStaffBrief {
  name?: string
  position?: string
}

/** 合并详情对比页：版本（原版/配音 + 语言） */
export interface MovieMergeVersionBrief {
  /** 1=原版 2=配音版 */
  versionCode?: number
  language?: string
}

/** 合并详情对比页：单部候选电影完整信息 */
export interface MovieMergeDetail {
  id: number
  name: string
  originalName?: string
  movieKey?: string
  tmdbId?: number
  deleted: number
  kind: string
  releaseDate?: string
  runtime?: number
  cover?: string
  description?: string
  levelId?: number
  levelName?: string
  counts: MovieMergeDetailCounts
  showtimesByCinema: MovieMergeShowtimeByCinema[]
  staff: MovieMergeStaffBrief[]
  characters: string[]
  versions: MovieMergeVersionBrief[]
  tags: string[]
  specs: string[]
}

/** 合并详情对比页：字段级覆盖（逐项「应用」的结果，合并时写回保留行） */
export interface MovieMergeFieldOverrides {
  name?: string
  originalName?: string
  releaseDate?: string
  runtime?: number
  cover?: string
  description?: string
  tmdbId?: number
  levelId?: number
}

/** crawler 发现但需要人工确认的灰区匹配 */
export interface MoviePendingMatch {
  id: number
  confidence: number
  matchReason: string
  status: string
  createTime: string
  updateTime: string
  recommendedSurvivorId: number
  items: MovieDuplicateItem[]
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
  startDate?: string
  endDate?: string
  versionCode?: number
  dubbingStartDate?: string
  dubbingEndDate?: string
  hasReRelease?: boolean
}

export interface user {
  id?: number
  cover?: string
  /** 后台用户名字段（与接口 name 一致） */
  name?: string
  username?: string
  email?: string
  createTime?: string
  dataScope?: string
  brandId?: number | null
  cinemaIds?: number[]
  /** 用户列表：关联影院名称（与 cinemaIds 顺序一致） */
  cinemaNames?: string[]
  /** 当前用户院线级：品牌名称（顶栏等） */
  brandName?: string | null
}

export interface menuItem {
  parentId: number | null
  id: number
  name: string
  i18nKey: string
  path: string
  pathName: string
  show: boolean
  orderNum?: number
  children?: menuItem[] | null
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
  /** 管理后台登录：platform / chain / cinema */
  dataScope?: string
  brandId?: number | null
  cinemaIds?: number[]
  brandName?: string | null
  cinemaNames?: string[]
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

export type staff = base

export interface character extends base {
  cover?: string
  staff?: staff[]
}

export type level = base

// 电影版本相关类型
export interface MovieVersion {
  id?: number
  movieId: number
  versionCode: number
  startDate?: string
  endDate?: string
  languageId?: number
  characters: character[]
}

export interface MovieVersionCharacter {
  id: number
  staffIds: number[]
}

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
