import http from '@/api/index'
import { ApiResponse } from '@/type/api'

export interface PromotionMonthlyDay {
  id?: number
  name: string
  dayOfMonth: number
  price: number
  enabled?: boolean
  priority?: number
}

export interface PromotionWeeklyDay {
  id?: number
  name: string
  weekday: number
  price: number
  enabled?: boolean
  priority?: number
}

export interface PromotionSpecificDate {
  id?: number
  name: string
  date: string
  price: number
  enabled?: boolean
  priority?: number
}

export interface PromotionTimeRange {
  id?: number
  name: string
  applicableScope: string
  applicableDays?: string
  startTime: string
  endTime: string
  price: number
  remark?: string
  enabled?: boolean
  priority?: number
}

/** 定价规则项：人群 + 票价 + 优先级 */
export interface PricingRuleItem {
  id?: number
  audienceType: number
  value: number
  priority: number
}

export interface PromotionDetailResponse {
  promotionId?: number
  name: string
  remark?: string
  /** 是否支持前售券 */
  allowMuviticket?: boolean
  /** 规则类型优先级：月度/周度/固定日/时段，数值越小越优先 */
  monthlyPriority?: number
  weeklyPriority?: number
  specificDatePriority?: number
  timeRangePriority?: number
  fixedPricePriority?: number
  ticketTypePriority?: number
  monthlyDays: PromotionMonthlyDay[]
  weeklyDays: PromotionWeeklyDay[]
  specificDates: PromotionSpecificDate[]
  timeRanges: PromotionTimeRange[]
  /** 前售券定价规则（人群+票价+优先级） */
  pricingRules?: PricingRuleItem[]
}

export interface PromotionSaveQuery {
  id?: number
  cinemaId: number
  name: string
  remark?: string
  /** 是否支持前售券 */
  allowMuviticket?: boolean
  priority?: number
  monthlyPriority?: number
  weeklyPriority?: number
  specificDatePriority?: number
  timeRangePriority?: number
  fixedPricePriority?: number
  ticketTypePriority?: number
  monthlyDays?: PromotionMonthlyDay[]
  weeklyDays?: PromotionWeeklyDay[]
  specificDates?: PromotionSpecificDate[]
  timeRanges?: PromotionTimeRange[]
  /** 前售券定价规则 */
  pricingRules?: PricingRuleItem[]
}

export const getPromotionDetail = async (
  cinemaId: number,
  promotionId?: number
): Promise<PromotionDetailResponse | null> => {
  const res = await http<ApiResponse<PromotionDetailResponse>>({
    url: '/admin/promotion/detail',
    method: 'get',
    params: { cinemaId, ...(promotionId ? { promotionId } : {}) }
  })
  const data = res?.data as unknown as PromotionDetailResponse | undefined
  return data ?? null
}

export const savePromotion = (body: PromotionSaveQuery) =>
  http<ApiResponse<void>>({
    url: '/admin/promotion/save',
    method: 'post',
    data: body
  })

export const removePromotion = (id: number) =>
  http<ApiResponse<void>>({
    url: `/admin/promotion/remove`,
    params: { id },
    method: 'delete'
  })

export interface PromotionListItem {
  id: number
  cinemaId: number
  name: string
  remark?: string
  createTime?: string
  updateTime?: string
  monthlyDays: PromotionMonthlyDay[]
  weeklyDays: PromotionWeeklyDay[]
  specificDates: PromotionSpecificDate[]
  timeRanges: PromotionTimeRange[]
}

export interface PromotionListQuery {
  cinemaId: number
  page: number
  pageSize: number
}

export interface PromotionListResponse {
  page: number
  total: number
  pageSize: number
  list: PromotionListItem[]
}

export const getPromotionList = async (
  query: PromotionListQuery
): Promise<PromotionListResponse> => {
  const res = await http<ApiResponse<PromotionListResponse>>({
    url: '/admin/promotion/list',
    method: 'post',
    data: query
  })
  return res.data as unknown as PromotionListResponse
}

/** 单条规则的展平项 */
export interface FlattenedRuleItem {
  id?: number
  ruleType: 'monthly' | 'weekly' | 'specificDate' | 'timeRange'
  name: string
  effectContent: string
  price: number
  enabled: boolean
  priority: number
  originalData: PromotionMonthlyDay | PromotionWeeklyDay | PromotionSpecificDate | PromotionTimeRange
}

/** 规则列表查询参数 */
export interface RuleListQuery {
  cinemaId: number
  page: number
  pageSize: number
  ruleType?: 'monthly' | 'weekly' | 'specificDate' | 'timeRange'
}

/** 规则列表响应 */
export interface RuleListResponse {
  page: number
  total: number
  pageSize: number
  list: FlattenedRuleItem[]
}

/** 获取规则列表（规则平铺） */
export const getRuleList = async (
  query: RuleListQuery
): Promise<RuleListResponse> => {
  const res = await http<ApiResponse<RuleListResponse>>({
    url: '/admin/promotion/rule-list',
    method: 'post',
    data: query
  })
  return res.data as unknown as RuleListResponse
}

/** 删除单条规则 */
export const removeRule = async (
  ruleType: 'monthly' | 'weekly' | 'specificDate' | 'timeRange',
  ruleId: number
) => {
  return http<ApiResponse<void>>({
    url: `/admin/promotion/remove-rule`,
    method: 'delete',
    params: { ruleType, ruleId }
  })
}

/** 更新单条规则的启用状态 */
export const updateRuleEnabled = async (
  ruleType: 'monthly' | 'weekly' | 'specificDate' | 'timeRange',
  ruleId: number,
  enabled: boolean
) => {
  return http<ApiResponse<void>>({
    url: `/admin/promotion/update-rule-enabled`,
    method: 'post',
    data: { ruleType, ruleId, enabled }
  })
}
