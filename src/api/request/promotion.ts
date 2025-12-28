import http from '@/api/index'
import { ApiResponse } from '@/type/api'

export interface PromotionMonthlyDay {
  id?: number
  name: string
  dayOfMonth: number
  price: number
}

export interface PromotionWeeklyDay {
  id?: number
  name: string
  weekday: number
  price: number
}

export interface PromotionSpecificDate {
  id?: number
  name: string
  date: string
  price: number
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
}

export interface PromotionDetailResponse {
  promotionId?: number
  name: string
  remark?: string
  monthlyDays: PromotionMonthlyDay[]
  weeklyDays: PromotionWeeklyDay[]
  specificDates: PromotionSpecificDate[]
  timeRanges: PromotionTimeRange[]
}

export interface PromotionSaveQuery {
  id?: number
  cinemaId: number
  name: string
  remark?: string
  monthlyDays?: PromotionMonthlyDay[]
  weeklyDays?: PromotionWeeklyDay[]
  specificDates?: PromotionSpecificDate[]
  timeRanges?: PromotionTimeRange[]
}

export const getPromotionDetail = async (
  cinemaId: number,
  promotionId?: number
): Promise<ApiResponse<PromotionDetailResponse> | null> => {
  const res = await http<ApiResponse<PromotionDetailResponse>>({
    url: '/admin/promotion/detail',
    method: 'get',
    params: { cinemaId, ...(promotionId ? { promotionId } : {}) }
  })
  // http 返回的是 ApiResponse，res.data 就是 PromotionDetailResponse
  return res?.data
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
  return res.data
}

