import type { FormInstance } from 'antd'
import type {
  PresaleTicket,
  PresaleSpecification,
  MubitikeTicketType
} from '@/store/usePricingStrategyStore'
import type dayjs from 'dayjs'

export type PriceItemFormValue = {
  label?: string
  price?: number
}

export type SpecificationFormItem = {
  id?: string
  name?: string
  ticketType?: MubitikeTicketType
  deliveryType?: PresaleSpecification['deliveryType']
  priceItems?: PriceItemFormValue[]
  stock?: number
  points?: number
  shipDays?: number
  image?: string
  images?: string[]
  bonusTitle?: string
  bonusImages?: string[]
  bonusDescription?: string
  bonusQuantity?: number
  bonusIncluded?: boolean
}

export interface PresaleFormValues {
  type?: 'presale'
  code?: string
  title?: string
  cover?: string
  gallery?: string[]
  deliveryType?: PresaleTicket['deliveryType']
  discountMode?: PresaleTicket['discountMode']
  mubitikeType?: MubitikeTicketType
  amount?: number
  extraFee?: string
  totalQuantity?: number
  launchTime?: dayjs.Dayjs
  endTime?: dayjs.Dayjs
  usageStart?: dayjs.Dayjs
  usageEnd?: dayjs.Dayjs
  perUserLimit?: number
  pickupNotes?: string
  movieId?: number
  specifications?: SpecificationFormItem[]
}

export const MUBITIKE_KEYS = ['online', 'card'] as const
export const DELIVERY_KEYS = ['virtual', 'physical'] as const

export const TICKET_TO_DELIVERY: Record<string, 'virtual' | 'physical'> = {
  online: 'virtual',
  card: 'physical'
}

export type StepProps = {
  form: FormInstance<PresaleFormValues>
  t: (key: string, opts?: Record<string, string | number>) => string
  common: (key: string) => string
}
