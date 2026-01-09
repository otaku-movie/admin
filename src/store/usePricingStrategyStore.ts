import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type StrategyUpdater<T> = (strategy: T) => void

type StrategyRemover = (id: number) => void

export type PresaleDeliveryType = 'virtual' | 'physical'
export type PresaleDiscountMode = 'fixed' | 'percentage'
export type MubitikeTicketType = 'online' | 'card' | 'combo'
export type MubitikeBonusType = 'digital' | 'physical' | 'voucher'
export type PresaleAudienceType =
  | 'general'
  | 'junior'
  | 'child'
  | 'student'
  | 'senior'
  | 'pair'

export interface PresaleSpecification {
  id?: string
  name?: string
  skuCode?: string
  ticketType?: MubitikeTicketType
  audienceType?: PresaleAudienceType
  deliveryType: PresaleDeliveryType
  price: number
  stock?: number
  points?: number
  shipDays?: number
  image?: string
}

export interface PresaleTicket {
  id: number
  code: string
  title: string
  type: 'presale'
  deliveryType: PresaleDeliveryType
  discountMode: PresaleDiscountMode
  mubitikeType: MubitikeTicketType
  price: number
  amount: number
  extraFee?: string
  totalQuantity: number
  launchTime?: string
  endTime?: string
  usageStart?: string
  usageEnd?: string
  perUserLimit: number
  movieIds?: number[]
  movieNames?: string[]
  benefits?: string[]
  bonusTitle?: string
  bonusType?: MubitikeBonusType
  bonusDelivery?: PresaleDeliveryType
  bonusDescription?: string
  pickupNotes?: string
  remark?: string
  cover: string
  gallery?: string[]
  description?: string
  updatedAt: string
  specifications?: PresaleSpecification[]
}

interface PresaleState {
  presales: PresaleTicket[]
  addPresale: StrategyUpdater<PresaleTicket>
  updatePresale: StrategyUpdater<PresaleTicket>
  removePresale: StrategyRemover
}

const STORAGE_KEY = 'pricing-strategy-store-v4'
const createId = () => Date.now() + Math.floor(Math.random() * 1000)

export const usePricingStrategyStore = create<PresaleState>()(
  persist(
    (set) => ({
      presales: [],
      addPresale: (ticket) =>
        set((state) => ({ presales: [...state.presales, ticket] })),
      updatePresale: (ticket) =>
        set((state) => ({
          presales: state.presales.map((item) =>
            item.id === ticket.id ? { ...item, ...ticket } : item
          )
        })),
      removePresale: (id) =>
        set((state) => ({
          presales: state.presales.filter((item) => item.id !== id)
        }))
    }),
    {
      name: STORAGE_KEY,
      version: 6,
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState
        const ensureSpecifications = (ticket: any) => {
          if (
            Array.isArray(ticket.specifications) &&
            ticket.specifications.length > 0
          ) {
            return ticket.specifications.map((item: any) => ({
              ...item,
              id: item.id ?? createId(),
              deliveryType: item.deliveryType ?? ticket.deliveryType ?? 'virtual',
              audienceType: item.audienceType ?? undefined,
              ticketType:
                item.ticketType ??
                (item.deliveryType === 'physical' ? 'card' : 'online'),
              skuCode: item.skuCode,
              price: item.price,
              stock: item.stock,
              points: item.points,
              shipDays: item.shipDays,
              image: item.image
            }))
          }
          if (Array.isArray(ticket.agePricing) && ticket.agePricing.length > 0) {
            return ticket.agePricing.map((item: any) => ({
              id: createId(),
              name: item.label,
              skuCode: item.skuCode,
              ticketType:
                item.ticketType ??
                (item.deliveryType === 'physical' ? 'card' : 'online'),
              audienceType: item.audienceType ?? undefined,
              deliveryType: item.deliveryType ?? ticket.deliveryType ?? 'virtual',
              price: item.price,
              stock: item.stock,
              points: item.points,
              shipDays: item.shipDays,
              image: item.image
            }))
          }
          if (typeof ticket.price === 'number') {
            return [
              {
                id: createId(),
                name: undefined,
                skuCode: ticket.skuCode,
                ticketType:
                  ticket.ticketType ??
                  (ticket.deliveryType === 'physical' ? 'card' : 'online'),
                audienceType: undefined,
                deliveryType: ticket.deliveryType ?? 'virtual',
                price: ticket.price,
                stock: ticket.stock,
                points: ticket.points,
                shipDays: ticket.shipDays,
                image: ticket.image
              }
            ]
          }
          return []
        }
        const ensureGallery = (ticket: any) => {
          if (Array.isArray(ticket.gallery) && ticket.gallery.length > 0) {
            return ticket.gallery
          }
          if (Array.isArray(ticket.images) && ticket.images.length > 0) {
            return ticket.images
          }
          if (Array.isArray(ticket.assets) && ticket.assets.length > 0) {
            return ticket.assets
          }
          if (typeof ticket.cover === 'string' && ticket.cover) {
            return [ticket.cover]
          }
          if (typeof ticket.poster === 'string' && ticket.poster) {
            return [ticket.poster]
          }
          return []
        }
        const mapDeliveryToMubitike = (
          delivery: PresaleDeliveryType | undefined
        ): MubitikeTicketType => {
          if (delivery === 'physical') return 'card'
          return 'online'
        }
        const normalizeTicket = (item: any) => {
          const { startTime, ...rest } = item
          const gallery = ensureGallery(item)
          const cover =
            rest.cover ?? gallery[0] ?? rest.poster ?? rest.image ?? ''
          return {
            type: 'presale',
            ...rest,
            cover,
            gallery,
            title: rest.title ?? rest.displayName ?? rest.description ?? rest.code,
            launchTime: rest.launchTime ?? startTime,
            mubitikeType:
              rest.mubitikeType ??
              mapDeliveryToMubitike(rest.deliveryType ?? 'virtual'),
            usageStart:
              rest.usageStart ??
              rest.validFrom ??
              rest.launchTime ??
              startTime ??
              rest.startDate,
            usageEnd:
              rest.usageEnd ??
              rest.validUntil ??
              rest.endTime ??
              rest.finishDate ??
              rest.stopDate,
            bonusTitle: rest.bonusTitle ?? rest.benefits?.[0],
            bonusType:
              rest.bonusType ??
              (rest.deliveryType === 'physical' ? 'physical' : 'digital'),
            bonusDelivery:
              rest.bonusDelivery ?? (rest.deliveryType ?? 'virtual'),
            bonusDescription: rest.bonusDescription ?? rest.bonusDetail,
            pickupNotes: rest.pickupNotes,
            specifications: ensureSpecifications(item)
          }
        }
        if (Array.isArray(persistedState.coupons)) {
          const presales = persistedState.coupons.map(normalizeTicket)
          return { presales }
        }
        if (Array.isArray(persistedState.presales)) {
          const presales = persistedState.presales.map(normalizeTicket)
          return { presales }
        }
        return persistedState
      }
    }
  )
)

