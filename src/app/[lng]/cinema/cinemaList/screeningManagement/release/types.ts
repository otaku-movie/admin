import type { Dayjs } from 'dayjs'

/** 发布场次表单状态：Step1 基础信息 + Step2 是否公开 + Step3 定价与补价 */
export interface ReleaseFormState {
  /** 场次 id，编辑时存在，提交时带上传给后端做更新 */
  id?: number
  cinemaId?: number
  movieId?: number
  movieName?: string
  screeningDate?: Dayjs
  theaterHallId?: number
  startTime?: Dayjs
  endTime?: Dayjs
  subtitleId?: number[]
  movieVersionId?: number
  dimensionType?: number
  open?: boolean
  /** 公开方式：立即公开 / 定时公开 */
  publishMode?: 'immediate' | 'scheduled'
  /** 定时公开时间（仅当 publishMode=scheduled 时生效） */
  publishAt?: Dayjs
  /** 是否设置开放购票时间（开关打开时才提交 saleOpenAt） */
  enableSaleOpenAt?: boolean
  /** 开放购票时间 */
  saleOpenAt?: Dayjs
  pricingMode?: number
  activityId?: number
  /** 系统活动时勾选的规则（活动）ID 列表，接口获取后多选 */
  activityIds?: number[]
  fixedAmount?: number
  surcharge?: number
  allowPresale?: boolean
  specIds?: number[]
  /** 场次标签 id 列表（多选） */
  showTimeTagId?: number[]
  /** 默认规则下，本场次票种临时调价：票种 id -> 覆盖价格（未覆盖的用票种默认价） */
  ticketTypeOverrides?: Record<number, number>
  /** 默认规则下，本场次票种是否启用：票种 id -> 是否启用（仅限该场次，默认 true） */
  ticketTypeEnabled?: Record<number, boolean>
}

/** 定价模式：系统活动 / 固定价格 / 无 */

export const PRICING_MODE_SYSTEM = 1
export const PRICING_MODE_FIXED = 2
export const PRICING_MODE_NONE = 0

/** 活动项（含其下规则列表），接口 /admin/promotion/list 返回 */
export interface PromotionWithRules {
  id: number
  name: string
  remark?: string
  monthlyDays?: { id?: number; name?: string; dayOfMonth?: number; price?: number }[]
  weeklyDays?: { id?: number; name?: string; weekday?: number; price?: number }[]
  specificDates?: { id?: number; name?: string; date?: string; price?: number }[]
  timeRanges?: { id?: number; name?: string; applicableScope?: string; startTime?: string; endTime?: string; price?: number; remark?: string }[]
}
