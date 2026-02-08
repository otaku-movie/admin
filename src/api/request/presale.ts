import http from '@/api/index'
import { ApiResponse } from '@/type/api'
import type {
  PresaleTicket,
  PresaleSpecification,
  PresaleDeliveryType,
  PresaleDiscountMode,
  MubitikeTicketType
} from '@/store/usePricingStrategyStore'

export interface PresaleSpecItemDto {
  id?: number
  name?: string
  skuCode?: string
  ticketType?: number
  audienceType?: number
  deliveryType: number
  /** 已废弃，以 priceItems 为准 */
  price?: number
  /** 多档价格 [{label,price}] */
  priceItems?: Array<{ label: string; price: number }>
  /** 规格级特典名称 */
  bonusTitle?: string
  /** 规格级特典图片URL数组 */
  bonusImages?: string[]
  /** 规格级特典说明 */
  bonusDescription?: string
  /** 规格级特典数量 */
  bonusQuantity?: number
  stock?: number
  points?: number
  shipDays?: number
  /** 规格图集（多张），每规格独立 */
  images?: string[]
  bonusIncluded?: boolean
}

/** 后端返回：类型字段为 dict_item.code（整数） */
export interface PresaleDetailResponseDto {
  id: number
  code: string
  title: string
  deliveryType: number
  discountMode?: number
  mubitikeType: number
  price: number
  amount?: number
  totalQuantity: number
  launchTime?: string
  endTime?: string
  usageStart?: string
  usageEnd?: string
  perUserLimit: number
  movieId?: number
  /** 关联影片名称，用于展示 */
  movieName?: string
  pickupNotes?: string
  cover?: string
  gallery?: string[]
  createTime?: string
  updateTime?: string
  specifications?: PresaleSpecItemDto[]
}

export interface PresaleListItemDto {
  id: number
  code: string
  title: string
  deliveryType: number
  discountMode?: number
  mubitikeType: number
  price: number
  totalQuantity: number
  launchTime?: string
  endTime?: string
  usageStart?: string
  usageEnd?: string
  perUserLimit?: number
  movieId?: number
  movieName?: string
  cover?: string
  gallery?: string[]
  createTime?: string
  updateTime?: string
  specifications?: PresaleSpecItemDto[]
}

export interface PresaleSpecSaveItemDto {
  id?: number
  name?: string
  skuCode?: string
  ticketType?: number
  deliveryType: number
  /** 多档价格 [{label,price}] */
  priceItems?: Array<{ label: string; price: number }>
  /** 规格级特典名称 */
  bonusTitle?: string
  /** 规格级特典图片URL数组 */
  bonusImages?: string[]
  /** 规格级特典说明 */
  bonusDescription?: string
  /** 规格级特典数量 */
  bonusQuantity?: number
  stock?: number
  points?: number
  shipDays?: number
  images?: string[]
  bonusIncluded?: boolean
}

/** 提交 body：类型字段为 dict_item.code（整数） */
export interface PresaleSaveQueryDto {
  id?: number
  code?: string
  title: string
  deliveryType: number
  discountMode?: number
  mubitikeType: number
  amount?: number
  totalQuantity: number
  launchTime?: string
  endTime?: string
  usageStart?: string
  usageEnd?: string
  perUserLimit: number
  movieId?: number
  pickupNotes?: string
  cover?: string
  gallery?: string[]
  specifications?: PresaleSpecSaveItemDto[]
}

const DELIVERY_MAP: Record<number, PresaleDeliveryType> = {
  1: 'virtual',
  2: 'physical'
}
const DELIVERY_TO_CODE: Record<PresaleDeliveryType, number> = {
  virtual: 1,
  physical: 2
}
const MUBITIKE_MAP: Record<number, MubitikeTicketType> = {
  1: 'online',
  2: 'card',
  3: 'combo',
  4: 'movieticket'
}
const MUBITIKE_TO_CODE: Record<MubitikeTicketType, number> = {
  online: 1,
  card: 2,
  combo: 3,
  movieticket: 4
}
const DISCOUNT_MAP: Record<number, PresaleDiscountMode> = {
  1: 'fixed',
  2: 'percentage'
}
const DISCOUNT_TO_CODE: Record<PresaleDiscountMode, number> = {
  fixed: 1,
  percentage: 2
}

function dtoSpecToStore(d: PresaleSpecItemDto): PresaleSpecification {
  const price = d.price ?? (d.priceItems?.[0] ? Number(d.priceItems[0].price) : undefined)
  return {
    id: d.id?.toString(),
    name: d.name,
    skuCode: d.skuCode,
    ticketType: d.ticketType != null ? MUBITIKE_MAP[d.ticketType] : undefined,
    deliveryType: (DELIVERY_MAP[d.deliveryType] ?? 'virtual') as PresaleSpecification['deliveryType'],
    price: price ?? 0,
    priceItems: d.priceItems,
    bonusTitle: d.bonusTitle,
    bonusImages: d.bonusImages,
    bonusDescription: d.bonusDescription,
    bonusQuantity: d.bonusQuantity,
    stock: d.stock,
    points: d.points,
    shipDays: d.shipDays,
    images: d.images ?? [],
    bonusIncluded: d.bonusIncluded !== false
  }
}

function dtoToPresaleTicket(d: PresaleDetailResponseDto): PresaleTicket {
  return {
    id: d.id,
    code: d.code,
    title: d.title,
    type: 'presale',
    deliveryType: DELIVERY_MAP[d.deliveryType] ?? 'virtual',
    discountMode: (d.discountMode != null ? DISCOUNT_MAP[d.discountMode] : 'fixed') ?? 'fixed',
    mubitikeType: MUBITIKE_MAP[d.mubitikeType] ?? 'online',
    price: d.price,
    amount: d.amount ?? d.price,
    totalQuantity: d.totalQuantity,
    launchTime: d.launchTime,
    endTime: d.endTime,
    usageStart: d.usageStart,
    usageEnd: d.usageEnd,
    perUserLimit: d.perUserLimit,
    movieIds: d.movieId != null ? [d.movieId] : undefined,
    movieNames: d.movieName != null ? [d.movieName] : undefined,
    pickupNotes: d.pickupNotes,
    cover: d.cover ?? '',
    gallery: d.gallery,
    updatedAt: d.updateTime ?? d.createTime ?? '',
    specifications: d.specifications?.map(dtoSpecToStore)
  }
}

function listDtoToPresaleTicket(d: PresaleListItemDto): PresaleTicket {
  return {
    id: d.id,
    code: d.code,
    title: d.title,
    type: 'presale',
    deliveryType: DELIVERY_MAP[d.deliveryType] ?? 'virtual',
    discountMode: (d.discountMode != null ? DISCOUNT_MAP[d.discountMode] : 'fixed') ?? 'fixed',
    mubitikeType: MUBITIKE_MAP[d.mubitikeType] ?? 'online',
    price: d.price,
    amount: d.price,
    totalQuantity: d.totalQuantity,
    launchTime: d.launchTime,
    endTime: d.endTime,
    usageStart: d.usageStart,
    usageEnd: d.usageEnd,
    perUserLimit: d.perUserLimit ?? 0,
    movieIds: d.movieId != null ? [d.movieId] : undefined,
    movieNames: d.movieName != null ? [d.movieName] : undefined,
    cover: d.cover ?? '',
    gallery: d.gallery,
    updatedAt: d.updateTime ?? d.createTime ?? '',
    specifications: d.specifications?.map(dtoSpecToStore)
  }
}

export interface PresaleListQueryDto {
  title?: string
  code?: string
  movieId?: number
  page?: number
  pageSize?: number
}

export interface PresaleListResponseDto {
  list: PresaleListItemDto[]
  page: number
  total: number
  pageSize: number
}

/** 获取预售券详情（返回与 store 一致的 PresaleTicket 形状，便于表单/列表使用） */
export const getPresaleDetail = async (
  id: number
): Promise<PresaleTicket | null> => {
  const res = await http<PresaleDetailResponseDto>({
    url: '/admin/presale/detail',
    method: 'get',
    params: { id }
  })
  const raw = res?.data
  if (!raw) return null
  return dtoToPresaleTicket(raw)
}

/** 获取预售券分页列表（返回与 store 一致的 PresaleTicket 形状） */
export const getPresaleList = async (
  query: PresaleListQueryDto
): Promise<{ list: PresaleTicket[]; page: number; total: number; pageSize: number }> => {
  const res = await http<PresaleListResponseDto>({
    url: '/admin/presale/list',
    method: 'post',
    data: {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
      title: query.title,
      code: query.code,
      movieId: query.movieId
    }
  })
  const data = res?.data
  const list = (data?.list ?? []).map(listDtoToPresaleTicket)
  return {
    list,
    page: data?.page ?? 1,
    total: data?.total ?? 0,
    pageSize: data?.pageSize ?? 10
  }
}

/** 构建保存 body：将表单的 string 枚举转为后端整数 code */
export function buildPresaleSaveBody(params: {
  id?: number
  code?: string
  title: string
  deliveryType: PresaleDeliveryType
  discountMode?: PresaleDiscountMode
  mubitikeType: MubitikeTicketType
  amount?: number
  totalQuantity: number
  launchTime?: string
  endTime?: string
  usageStart?: string
  usageEnd?: string
  perUserLimit: number
  movieId?: number
  pickupNotes?: string
  cover?: string
  gallery?: string[]
  specifications?: Array<{
    id?: number
    name?: string
    ticketType?: MubitikeTicketType
    deliveryType: PresaleDeliveryType
    priceItems?: Array<{ label: string; price: number }>
    bonusTitle?: string
    bonusImages?: string[]
    bonusDescription?: string
    bonusQuantity?: number
    stock?: number
    points?: number
    shipDays?: number
    image?: string
    images?: string[]
    bonusIncluded?: boolean
  }>
}): PresaleSaveQueryDto {
  return {
    id: params.id,
    code: params.code,
    title: params.title,
    deliveryType: DELIVERY_TO_CODE[params.deliveryType],
    discountMode: params.discountMode ? DISCOUNT_TO_CODE[params.discountMode] : 1,
    mubitikeType: MUBITIKE_TO_CODE[params.mubitikeType],
    amount: params.amount,
    totalQuantity: params.totalQuantity,
    launchTime: params.launchTime,
    endTime: params.endTime,
    usageStart: params.usageStart,
    usageEnd: params.usageEnd,
    perUserLimit: params.perUserLimit,
    movieId: params.movieId,
    pickupNotes: params.pickupNotes,
    cover: params.cover,
    gallery: params.gallery,
    specifications: params.specifications?.map((s) => ({
      id: s.id,
      name: s.name,
      ticketType: s.ticketType != null ? MUBITIKE_TO_CODE[s.ticketType] : undefined,
      deliveryType: DELIVERY_TO_CODE[s.deliveryType],
      priceItems: s.priceItems,
      bonusTitle: s.bonusTitle,
      bonusImages: s.bonusImages,
      bonusDescription: s.bonusDescription,
      bonusQuantity: s.bonusQuantity,
      stock: s.stock,
      points: s.points,
      shipDays: s.shipDays,
      images: s.images,
      bonusIncluded: s.bonusIncluded !== false
    }))
  }
}

/** 保存预售券（新增/更新） */
export const savePresale = (body: PresaleSaveQueryDto) =>
  http<ApiResponse<void>>({
    url: '/admin/presale/save',
    method: 'post',
    data: body
  })

/** 删除预售券 */
export const removePresaleApi = (id: number) =>
  http<ApiResponse<void>>({
    url: '/admin/presale/remove',
    method: 'delete',
    params: { id }
  })
