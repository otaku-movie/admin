'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Typography,
  message
} from 'antd'
import type { TableColumnsType } from 'antd'
import { HolderOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import {
  getPromotionDetail,
  savePromotion,
  type PromotionDetailResponse,
  type PromotionSaveQuery,
  type PromotionSpecificDate,
  type PromotionWeeklyDay,
  type PromotionTimeRange
} from '@/api/request/promotion'
import {
  generateThirtyHourOptions,
  normalizeThirtyHourString,
  parseThirtyHourString
} from '@/utils/thirtyHourTime'
import { useRouter, useSearchParams } from 'next/navigation'
import { processPath } from '@/config/router'
import { CheckPermission } from '@/components/checkPermission'

const { Title, Paragraph } = Typography
const { Item: FormItem } = Form
type PricingMode = 'unified' | 'individual'
type TimeScope =
  | 'daily'
  | 'weekday'
  | 'weekend'
  | 'specific'
  | 'weekdaySpecific'
type ModalType = 'monthly' | 'weekly' | 'specific' | 'timePeriod'

/** 规则类型 key，顺序即优先级（索引 0 最高） */
const RULE_TYPE_KEYS = [
  'monthly',
  'weekly',
  'specificDate',
  'timeRange',
  'fixedPrice',
  'ticketType'
] as const
type RuleTypeKey = (typeof RULE_TYPE_KEYS)[number]

/** 有下方配置卡片的规则类型（固定票价、票种规则暂无配置卡片） */
const RULE_TYPE_KEYS_WITH_CARDS: RuleTypeKey[] = [
  'monthly',
  'weekly',
  'specificDate',
  'timeRange'
]

function orderToFormValues(
  order: RuleTypeKey[]
): Record<string, number> {
  const idx = (key: RuleTypeKey) => order.indexOf(key)
  return {
    monthlyPriority: idx('monthly'),
    weeklyPriority: idx('weekly'),
    specificDatePriority: idx('specificDate'),
    timeRangePriority: idx('timeRange'),
    fixedPricePriority: idx('fixedPrice'),
    ticketTypePriority: idx('ticketType')
  }
}

function formValuesToOrder(values: {
  monthlyPriority?: number
  weeklyPriority?: number
  specificDatePriority?: number
  timeRangePriority?: number
  fixedPricePriority?: number
  ticketTypePriority?: number
}): RuleTypeKey[] {
  const items: { key: RuleTypeKey; priority: number }[] = RULE_TYPE_KEYS.map(
    (key) => ({
      key,
      priority:
        key === 'monthly'
          ? (values.monthlyPriority ?? 0)
          : key === 'weekly'
            ? (values.weeklyPriority ?? 0)
            : key === 'specificDate'
              ? (values.specificDatePriority ?? 0)
              : key === 'timeRange'
                ? (values.timeRangePriority ?? 0)
                : key === 'fixedPrice'
                  ? (values.fixedPricePriority ?? 0)
                  : (values.ticketTypePriority ?? 0)
    })
  )
  items.sort((a, b) => a.priority - b.priority || RULE_TYPE_KEYS.indexOf(a.key) - RULE_TYPE_KEYS.indexOf(b.key))
  return items.map((i) => i.key)
}

function SortableRuleTypeRow({
  id,
  label,
  rank,
  dragAriaLabel
}: {
  id: RuleTypeKey
  label: string
  rank: number
  dragAriaLabel?: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '8px 12px',
    marginBottom: 4,
    background: isDragging ? 'var(--ant-color-primary-bg)' : 'var(--ant-color-fill-quaternary)',
    borderRadius: 6,
    transform: CSS.Transform.toString(transform),
    transition
  }
  return (
    <div ref={setNodeRef} style={style}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 500, minWidth: 24 }}>{rank}.</span>
        <span>{label}</span>
      </span>
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', touchAction: 'none', display: 'flex', alignItems: 'center', color: 'var(--ant-color-text-tertiary)' }}
        aria-label={dragAriaLabel}
      >
        <HolderOutlined />
      </span>
    </div>
  )
}

/** 规则表格可拖拽行：顺序即优先级，通过拖拽调整 */
function SortableRuleTableRow(props: React.HTMLAttributes<HTMLTableRowElement> & { 'data-row-key'?: string }) {
  const id = props['data-row-key'] ?? ''
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const { style, ...restProps } = props // eslint-disable-line react/prop-types -- typed via TypeScript
  return (
    <tr
      ref={setNodeRef}
      {...restProps}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
        ...(isDragging ? { opacity: 0.8 } : {})
      }}
    >
      {props.children != null && Array.isArray(props.children)
        ? props.children.map((child, i) =>
            i === 0 && React.isValidElement(child) && child.type === 'td' ? (
              <td key="drag" {...(child.props as React.TdHTMLAttributes<HTMLTableCellElement>)}>
                <span
                  ref={setActivatorNodeRef}
                  {...attributes}
                  {...listeners}
                  style={{ cursor: 'grab', touchAction: 'none', display: 'inline-flex' }}
                >
                  <HolderOutlined />
                </span>
              </td>
            ) : (
              child
            )
          )
        : props.children}
    </tr>
  )
}

interface PromotionFormValues {
  name?: string
  pricingMode: PricingMode
  unifiedPrice?: number
  remark?: string
  allowMuviticket?: boolean
  monthlyPriority?: number
  weeklyPriority?: number
  specificDatePriority?: number
  timeRangePriority?: number
  fixedPricePriority?: number
  ticketTypePriority?: number
}

interface PricingRuleEntry {
  id?: number
  audienceType: number
  value: number
  priority: number
}

type PricingRuleRow = PricingRuleEntry & { index: number }

interface MonthlyEntry {
  id?: number
  name: string
  day: number
  price: number
  enabled?: boolean
  priority?: number
}

interface WeeklyEntry {
  id?: number
  name: string
  weekday: string
  price: number
  enabled?: boolean
  priority?: number
}

interface SpecificEntry {
  id?: number
  name: string
  date: Dayjs
  price: number
  enabled?: boolean
  priority?: number
}

interface TimePeriodEntry {
  id?: number
  name: string
  scope: TimeScope
  weekday?: string
  date?: Dayjs
  startTime: string
  endTime: string
  price: number
  remark?: string
  enabled?: boolean
  priority?: number
}

const WEEKDAY_NUMBER_TO_KEY: Record<number, string> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  7: 'sunday'
}

const WEEKDAY_KEY_TO_NUMBER: Record<string, number> = Object.entries(
  WEEKDAY_NUMBER_TO_KEY
).reduce(
  (acc, [num, key]) => ({
    ...acc,
    [key]: Number(num)
  }),
  {} as Record<string, number>
)

const normalizeWeekdayKey = (value?: string | number | null) => {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number') {
    return WEEKDAY_NUMBER_TO_KEY[value]
  }
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) {
    return undefined
  }
  if (WEEKDAY_KEY_TO_NUMBER[trimmed] !== undefined) {
    return trimmed
  }
  const numeric = Number.parseInt(trimmed, 10)
  if (!Number.isNaN(numeric)) {
    return WEEKDAY_NUMBER_TO_KEY[numeric]
  }
  return undefined
}

const normalizeScopeFromApi = (scope?: string): TimeScope => {
  const value = scope?.trim().toLowerCase()
  switch (value) {
    case 'weekday':
    case 'weekdays':
    case 'workday':
    case 'workdays':
      return 'weekday'
    case 'weekend':
    case 'weekends':
      return 'weekend'
    case 'specific':
    case 'date':
      return 'specific'
    case 'weekdayspecific':
    case 'weekday_specific':
    case 'weekday-specific':
    case 'specificweekday':
      return 'weekdaySpecific'
    default:
      return 'daily'
  }
}

export default function PromotionDetailPage({ params: { lng } }: PageProps) {
  const { t } = useTranslation(
    lng as 'zh-CN' | 'ja' | 'en-US',
    'pricingStrategy'
  )
  const { t: common } = useTranslation(
    lng as 'zh-CN' | 'ja' | 'en-US',
    'common'
  )
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form] = Form.useForm<PromotionFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modalForm] = Form.useForm()
  const [modalState, setModalState] = useState<{
    type: ModalType
    index?: number
  } | null>(null)

  const cinemaIdParam = searchParams.get('cinemaId')
  const promotionIdParam = searchParams.get('promotionId')
  const cinemaNameParam = searchParams.get('cinemaName')
  const cinemaId = cinemaIdParam ? Number(cinemaIdParam) : undefined
  const cinemaName = cinemaNameParam
    ? decodeURIComponent(cinemaNameParam)
    : undefined
  const promotionIdFromQuery = promotionIdParam
    ? Number(promotionIdParam)
    : undefined
  const hasPromotionId =
    promotionIdFromQuery !== undefined && !Number.isNaN(promotionIdFromQuery)

  const pricingMode =
    Form.useWatch('pricingMode', form) || ('individual' as PricingMode)
  const unifiedPriceValue = Form.useWatch('unifiedPrice', form)
  const [monthlyList, setMonthlyList] = useState<MonthlyEntry[]>([])
  const [weeklyList, setWeeklyList] = useState<WeeklyEntry[]>([])
  const [specificList, setSpecificList] = useState<SpecificEntry[]>([])
  const [timePeriodList, setTimePeriodList] = useState<TimePeriodEntry[]>([])
  const [pricingRuleList, setPricingRuleList] = useState<PricingRuleEntry[]>([])
  /** 规则类型优先级顺序（从上到下 = 优先级从高到低），用于拖拽排序 */
  const [typePriorityOrder, setTypePriorityOrder] = useState<RuleTypeKey[]>([
    ...RULE_TYPE_KEYS
  ])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleTypePriorityDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over == null || active.id === over.id) return
      setTypePriorityOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as RuleTypeKey)
        const newIndex = prev.indexOf(over.id as RuleTypeKey)
        if (oldIndex === -1 || newIndex === -1) return prev
        const next = arrayMove(prev, oldIndex, newIndex)
        form.setFieldsValue(orderToFormValues(next))
        return next
      })
    },
    [form]
  )

  /** 有配置卡片的规则类型按优先级顺序排列，用于左侧表单列展示顺序 */
  const cardOrder = useMemo(
    () =>
      typePriorityOrder.filter((k) =>
        RULE_TYPE_KEYS_WITH_CARDS.includes(k)
      ),
    [typePriorityOrder]
  )

  const resetPromotionState = useCallback(() => {
    setMonthlyList([])
    setWeeklyList([])
    setSpecificList([])
    setTimePeriodList([])
    setPricingRuleList([])
    setTypePriorityOrder([...RULE_TYPE_KEYS])
    form.setFieldsValue({
      pricingMode: 'individual',
      unifiedPrice: undefined,
      remark: undefined,
      name: undefined,
      ...orderToFormValues([...RULE_TYPE_KEYS])
    })
  }, [form])

  const hydratePromotionDetail = useCallback(
    (detail: PromotionDetailResponse) => {
      if (!detail) {
        console.warn('Cannot hydrate: detail is null or undefined')
        return
      }
      console.log('Hydrating promotion detail:', detail)
      form.setFieldsValue({
        name: detail.name || '',
        remark: detail.remark || undefined,
        pricingMode: 'individual',
        unifiedPrice: undefined,
        monthlyPriority: detail.monthlyPriority ?? 0,
        weeklyPriority: detail.weeklyPriority ?? 0,
        specificDatePriority: detail.specificDatePriority ?? 0,
        timeRangePriority: detail.timeRangePriority ?? 0,
        fixedPricePriority: detail.fixedPricePriority ?? 0,
        ticketTypePriority: detail.ticketTypePriority ?? 0
      })
      const order = formValuesToOrder({
        monthlyPriority: detail.monthlyPriority ?? 0,
        weeklyPriority: detail.weeklyPriority ?? 0,
        specificDatePriority: detail.specificDatePriority ?? 0,
        timeRangePriority: detail.timeRangePriority ?? 0,
        fixedPricePriority: detail.fixedPricePriority ?? 0,
        ticketTypePriority: detail.ticketTypePriority ?? 0
      })
      setTypePriorityOrder(order)

      const monthlyData = (detail.monthlyDays || []).map((item) => ({
        id: item.id,
        name: item.name || '',
        day: item.dayOfMonth,
        price: item.price,
        enabled: item.enabled ?? true,
        priority: item.priority ?? 0
      }))
      console.log('Setting monthlyList:', monthlyData)
      setMonthlyList(monthlyData)

      setWeeklyList(
        (detail.weeklyDays || []).reduce<WeeklyEntry[]>((acc, item) => {
          const weekday = normalizeWeekdayKey(item.weekday)
          if (!weekday) {
            return acc
          }
          acc.push({
            id: item.id,
            name: item.name || '',
            weekday,
            price: item.price,
            enabled: item.enabled ?? true,
            priority: item.priority ?? 0
          })
          return acc
        }, [])
      )

      setSpecificList(
        (detail.specificDates || []).reduce<SpecificEntry[]>((acc, item) => {
          const date = item.date ? dayjs(item.date, 'YYYY-MM-DD') : undefined
          if (!date || !date.isValid()) {
            return acc
          }
          acc.push({
            id: item.id,
            name: item.name || '',
            date,
            price: item.price,
            enabled: item.enabled ?? true,
            priority: item.priority ?? 0
          })
          return acc
        }, [])
      )

      setTimePeriodList(
        (detail.timeRanges || []).reduce<TimePeriodEntry[]>((acc, item) => {
          const scope = normalizeScopeFromApi(item.applicableScope)
          const startTime =
            normalizeThirtyHourString(item.startTime) ?? item.startTime
          const endTime =
            normalizeThirtyHourString(item.endTime) ?? item.endTime
          if (!startTime || !endTime) {
            return acc
          }

          const entry: TimePeriodEntry = {
            id: item.id,
            name: item.name || '',
            scope,
            startTime,
            endTime,
            price: item.price,
            remark: item.remark,
            enabled: item.enabled ?? true,
            priority: item.priority ?? 0
          }

          if (scope === 'weekdaySpecific') {
            const weekday = normalizeWeekdayKey(item.applicableDays)
            if (!weekday) {
              return acc
            }
            entry.weekday = weekday
          }

          if (scope === 'specific') {
            const dateValue = item.applicableDays
              ? dayjs(item.applicableDays, 'YYYY-MM-DD')
              : undefined
            if (!dateValue || !dateValue.isValid()) {
              return acc
            }
            entry.date = dateValue
          }

          acc.push(entry)
          return acc
        }, [])
      )

      setPricingRuleList([])
    },
    [form]
  )

  const fetchPromotionDetail = useCallback(async () => {
    if (!cinemaId || Number.isNaN(cinemaId)) {
      resetPromotionState()
      return
    }
    try {
      setLoading(true)
      const detail = await getPromotionDetail(
        cinemaId,
        hasPromotionId ? promotionIdFromQuery : undefined
      )
      console.log('Fetched promotion detail:', detail)
      if (detail) {
        hydratePromotionDetail(detail)
      } else {
        console.warn('Promotion detail is null or undefined')
        resetPromotionState()
      }
    } catch (error) {
      resetPromotionState()
      console.error('Error fetching promotion detail:', error)
    } finally {
      setLoading(false)
    }
  }, [
    cinemaId,
    hasPromotionId,
    promotionIdFromQuery,
    hydratePromotionDetail,
    resetPromotionState
  ])

  useEffect(() => {
    fetchPromotionDetail()
  }, [fetchPromotionDetail])

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 31 }, (_, index) => ({
        value: index + 1,
        label: `${index + 1}`
      })),
    []
  )

  const weekdayOptions = useMemo(
    () =>
      [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ].map((key) => ({
        value: key,
        label: t(`promotion.serviceDay.weekdays.${key}`)
      })),
    [t]
  )

  const timeScopeOptions = useMemo(
    () => [
      {
        value: 'daily',
        label: t('promotion.serviceDay.timePeriod.scopeOptions.daily')
      },
      {
        value: 'weekday',
        label: t('promotion.serviceDay.timePeriod.scopeOptions.weekday')
      },
      {
        value: 'weekend',
        label: t('promotion.serviceDay.timePeriod.scopeOptions.weekend')
      },
      {
        value: 'weekdaySpecific',
        label: t('promotion.serviceDay.timePeriod.scopeOptions.weekdaySpecific')
      },
      {
        value: 'specific',
        label: t('promotion.serviceDay.timePeriod.scopeOptions.specific')
      }
    ],
    [t]
  )

  const thirtyHourOptions = useMemo(() => generateThirtyHourOptions(), [])

  const formatPrice = useMemo(
    () => (value?: number) =>
      value !== undefined && value !== null
        ? `${value} ${common('unit.jpy')}`
        : '--',
    [common]
  )

  const weekdayLabel = useCallback(
    (weekday?: string) =>
      weekday ? t(`promotion.serviceDay.weekdays.${weekday}` as const) : '--',
    [t]
  )

  const scopeLabel = useCallback(
    (scope: TimeScope) =>
      t(`promotion.serviceDay.timePeriod.scopeOptions.${scope}` as const),
    [t]
  )

  const formatDate = useCallback((value?: Dayjs | string) => {
    if (!value) return '--'
    if (dayjs.isDayjs(value)) {
      return value.format('YYYY-MM-DD')
    }
    return dayjs(value).format('YYYY-MM-DD')
  }, [])

  const formatTimeRange = useCallback((start?: string, end?: string) => {
    const normalizedStart = normalizeThirtyHourString(start)
    const normalizedEnd = normalizeThirtyHourString(end)
    if (!normalizedStart || !normalizedEnd) return '--'
    return `${normalizedStart} ~ ${normalizedEnd}`
  }, [])

  const validatePairDiscount = useCallback(
    (_: any, value?: number) => {
      if (value === undefined || value === null || value === 0) {
        return Promise.resolve()
      }
      if (value < 1 || value > 100) {
        return Promise.reject(
          t('promotion.serviceDay.validation.pairDiscountRange')
        )
      }
      return Promise.resolve()
    },
    [t]
  )

  const displayPrice = useCallback(
    (value?: number) =>
      pricingMode === 'unified'
        ? formatPrice(unifiedPriceValue ?? value)
        : formatPrice(value),
    [formatPrice, pricingMode, unifiedPriceValue]
  )

  /*
   * Event activity helpers/commented-out table.
   * Re-enable together with the event activities card if needed.
   *
   * const activityAgeRangeText = useCallback(
   *   (activity: EventActivityEntry) =>
   *     formatAgeRange(activity.ageFrom, activity.ageTo),
   *   [formatAgeRange]
   * )
   *
   * const summarizeActivityDiscount = useCallback(
   *   (activity: EventActivityEntry) => {
   *     if (
   *       activity.discountPercent === undefined ||
   *       activity.discountPercent === null
   *     ) {
   *       return '--'
   *     }
   *     return `${activity.discountPercent}%`
   *   },
   *   []
   * )
   *
   * const summarizeActivityRules = useCallback(
   *   (activity: EventActivityEntry) => {
   *     const parts: string[] = []
   *     if (activity.monthlyRules.length) {
   *       parts.push(
   *         `${t('promotion.serviceDay.eventRule.summary.monthly')}: ${activity.monthlyRules
   *           .map(
   *             (rule) =>
   *               `${rule.day ?? '--'}${t('promotion.serviceDay.eventRule.summary.daySuffix')} (${formatPrice(rule.price)})`
   *           )
   *           .join(', ')}`
   *       )
   *     }
   *     if (activity.weeklyRules.length) {
   *       parts.push(
   *         `${t('promotion.serviceDay.eventRule.summary.weekly')}: ${activity.weeklyRules
   *           .map(
   *             (rule) =>
   *               `${weekdayLabel(rule.weekday)} (${formatPrice(rule.price)})`
   *           )
   *           .join(', ')}`
   *       )
   *     }
   *     if (activity.dailyRules.length) {
   *       parts.push(
   *         `${t('promotion.serviceDay.eventRule.summary.daily')}: ${activity.dailyRules
   *           .map((rule) =>
   *             rule.dateRange && rule.dateRange.length === 2
   *               ? `${rule.dateRange[0].format('YYYY-MM-DD')} ~ ${rule.dateRange[1].format('YYYY-MM-DD')} (${formatPrice(rule.price)})`
   *               : '--'
   *           )
   *           .join(', ')}`
   *       )
   *     }
   *     if (activity.specificRules.length) {
   *       parts.push(
   *         `${t('promotion.serviceDay.eventRule.summary.specific')}: ${activity.specificRules
   *           .map((rule) =>
   *             rule.date
   *               ? `${rule.date.format('YYYY-MM-DD')} (${formatPrice(rule.price)})`
   *               : '--'
   *           )
   *           .join(', ')}`
   *       )
   *     }
   *     return parts.length ? parts.join('；') : '--'
   *   },
   *   [formatPrice, t, weekdayLabel]
   * )
   */

  const monthlyDataSource = useMemo(
    () => monthlyList.map((item, index) => ({ ...item, index })),
    [monthlyList]
  )

  const weeklyDataSource = useMemo(
    () => weeklyList.map((item, index) => ({ ...item, index })),
    [weeklyList]
  )

  const specificDataSource = useMemo(
    () => specificList.map((item, index) => ({ ...item, index })),
    [specificList]
  )

  const timePeriodDataSource = useMemo(
    () => timePeriodList.map((item, index) => ({ ...item, index })),
    [timePeriodList]
  )

  const monthlySortableIds = useMemo(
    () => monthlyDataSource.map((_, i) => `monthly-${i}`),
    [monthlyDataSource]
  )
  const weeklySortableIds = useMemo(
    () => weeklyDataSource.map((_, i) => `weekly-${i}`),
    [weeklyDataSource]
  )
  const specificSortableIds = useMemo(
    () => specificDataSource.map((_, i) => `specific-${i}`),
    [specificDataSource]
  )
  const timePeriodSortableIds = useMemo(
    () => timePeriodDataSource.map((_, i) => `timePeriod-${i}`),
    [timePeriodDataSource]
  )

  const audienceTypeOptions = useMemo(
    () =>
      [1, 2, 3, 4].map((n) => ({
        value: n,
        label: t(`promotion.serviceDay.audienceType.${n}` as const)
      })),
    [t]
  )

  const _pricingRuleDataSource = useMemo<PricingRuleRow[]>(
    () => pricingRuleList.map((item, index) => ({ ...item, index })),
    [pricingRuleList]
  )

  /*
   * const eventActivityDataSource = useMemo(
   *   () => eventActivities.map((item, index) => ({ ...item, index })),
   *   [eventActivities]
   * )
   */

  const removeEntry = useCallback((type: ModalType, index: number) => {
    switch (type) {
      case 'monthly':
        setMonthlyList((prev) => prev.filter((_, i) => i !== index))
        break
      case 'weekly':
        setWeeklyList((prev) => prev.filter((_, i) => i !== index))
        break
      case 'specific':
        setSpecificList((prev) => prev.filter((_, i) => i !== index))
        break
      case 'timePeriod':
        setTimePeriodList((prev) => prev.filter((_, i) => i !== index))
        break
      default:
        break
    }
  }, [])

  const removePricingRule = useCallback((index: number) => {
    setPricingRuleList((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleMonthlyDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over == null || active.id === over.id) return
    const from = Number(String(active.id).replace('monthly-', ''))
    const to = Number(String(over.id).replace('monthly-', ''))
    if (Number.isNaN(from) || Number.isNaN(to)) return
    setMonthlyList((prev) => arrayMove(prev, from, to))
  }, [])
  const handleWeeklyDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over == null || active.id === over.id) return
    const from = Number(String(active.id).replace('weekly-', ''))
    const to = Number(String(over.id).replace('weekly-', ''))
    if (Number.isNaN(from) || Number.isNaN(to)) return
    setWeeklyList((prev) => arrayMove(prev, from, to))
  }, [])
  const handleSpecificDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over == null || active.id === over.id) return
    const from = Number(String(active.id).replace('specific-', ''))
    const to = Number(String(over.id).replace('specific-', ''))
    if (Number.isNaN(from) || Number.isNaN(to)) return
    setSpecificList((prev) => arrayMove(prev, from, to))
  }, [])
  const handleTimePeriodDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over == null || active.id === over.id) return
    const from = Number(String(active.id).replace('timePeriod-', ''))
    const to = Number(String(over.id).replace('timePeriod-', ''))
    if (Number.isNaN(from) || Number.isNaN(to)) return
    setTimePeriodList((prev) => arrayMove(prev, from, to))
  }, [])

  const openModal = useCallback(
    (type: ModalType, index?: number) => {
      modalForm.resetFields()

      if (type === 'monthly') {
        if (index !== undefined) {
          modalForm.setFieldsValue({ ...monthlyList[index] })
        } else {
          modalForm.setFieldsValue({
            price: unifiedPriceValue,
            day: undefined,
            name: '',
            enabled: true,
            priority: 0
          })
        }
      }
      if (type === 'weekly') {
        if (index !== undefined) {
          modalForm.setFieldsValue({ ...weeklyList[index] })
        } else {
          modalForm.setFieldsValue({
            price: unifiedPriceValue,
            weekday: undefined,
            name: '',
            enabled: true,
            priority: 0
          })
        }
      }
      if (type === 'specific') {
        if (index !== undefined) {
          modalForm.setFieldsValue({ ...specificList[index] })
        } else {
          modalForm.setFieldsValue({
            price: unifiedPriceValue,
            name: '',
            date: undefined,
            enabled: true,
            priority: 0
          })
        }
      }
      if (type === 'timePeriod') {
        if (index !== undefined) {
          modalForm.setFieldsValue({ ...timePeriodList[index] })
        } else {
          modalForm.setFieldsValue({
            scope: 'daily',
            price: unifiedPriceValue,
            startTime: undefined,
            endTime: undefined,
            name: '',
            enabled: true,
            priority: 0
          })
        }
      }

      setModalState({ type, index })
    },
    [
      modalForm,
      monthlyList,
      specificList,
      timePeriodList,
      unifiedPriceValue,
      weeklyList
    ]
  )

  const handleModalCancel = useCallback(() => {
    setModalState(null)
    modalForm.resetFields()
  }, [modalForm])

  const handleModalOk = useCallback(() => {
    if (!modalState) return
    modalForm.validateFields().then((values) => {
      const next = { ...values }

      if (modalState.type === 'timePeriod') {
        if (next.scope !== 'weekdaySpecific') {
          next.weekday = undefined
        }
        if (next.scope !== 'specific') {
          next.date = undefined
        }
      }

      switch (modalState.type) {
        case 'monthly':
          setMonthlyList((prev) => {
            const list = [...prev]
            const existing =
              modalState.index !== undefined
                ? list[modalState.index]
                : undefined
            const entry: MonthlyEntry = {
              id: existing?.id,
              name: (next as MonthlyEntry).name,
              day: Number((next as MonthlyEntry).day),
              price: Number((next as MonthlyEntry).price ?? 0),
              enabled: (next as MonthlyEntry).enabled ?? true,
              priority: Number((next as MonthlyEntry).priority ?? 0)
            }
            if (modalState.index !== undefined) {
              list[modalState.index] = entry
            } else {
              list.push(entry)
            }
            return list
          })
          break
        case 'weekly':
          setWeeklyList((prev) => {
            const list = [...prev]
            const existing =
              modalState.index !== undefined
                ? list[modalState.index]
                : undefined
            const entry: WeeklyEntry = {
              id: existing?.id,
              name: (next as WeeklyEntry).name,
              weekday: (next as WeeklyEntry).weekday,
              price: Number((next as WeeklyEntry).price ?? 0),
              enabled: (next as WeeklyEntry).enabled ?? true,
              priority: Number((next as WeeklyEntry).priority ?? 0)
            }
            if (modalState.index !== undefined) {
              list[modalState.index] = entry
            } else {
              list.push(entry)
            }
            return list
          })
          break
        case 'specific':
          setSpecificList((prev) => {
            const list = [...prev]
            const existing =
              modalState.index !== undefined
                ? list[modalState.index]
                : undefined
            const entry: SpecificEntry = {
              id: existing?.id,
              name: (next as SpecificEntry).name,
              date: (next as SpecificEntry).date,
              price: Number((next as SpecificEntry).price ?? 0),
              enabled: (next as SpecificEntry).enabled ?? true,
              priority: Number((next as SpecificEntry).priority ?? 0)
            }
            if (modalState.index !== undefined) {
              list[modalState.index] = entry
            } else {
              list.push(entry)
            }
            return list
          })
          break

        case 'timePeriod':
          setTimePeriodList((prev) => {
            const list = [...prev]
            const timePeriodValues = next as TimePeriodEntry
            const existing =
              modalState.index !== undefined
                ? list[modalState.index]
                : undefined
            const entry: TimePeriodEntry = {
              id: existing?.id,
              name: timePeriodValues.name,
              scope: timePeriodValues.scope,
              weekday: timePeriodValues.weekday,
              date: timePeriodValues.date,
              startTime:
                normalizeThirtyHourString(timePeriodValues.startTime) ??
                timePeriodValues.startTime ??
                '',
              endTime:
                normalizeThirtyHourString(timePeriodValues.endTime) ??
                timePeriodValues.endTime ??
                '',
              price: Number(timePeriodValues.price ?? 0),
              remark: timePeriodValues.remark,
              enabled: timePeriodValues.enabled ?? true,
              priority: Number(timePeriodValues.priority ?? 0)
            }
            if (modalState.index !== undefined) {
              list[modalState.index] = entry
            } else {
              list.push(entry)
            }
            return list
          })
          break
        default:
          break
      }
      handleModalCancel()
    })
  }, [handleModalCancel, modalForm, modalState])

  const modalScope = Form.useWatch('scope', modalForm)

  const modalTypeLabelMap = useMemo<Record<ModalType, string>>(
    () => ({
      monthly: t('promotion.serviceDay.monthly.title'),
      weekly: t('promotion.serviceDay.weekly.title'),
      specific: t('promotion.serviceDay.specific.title'),
      timePeriod: t('promotion.serviceDay.timePeriod.title')
    }),
    [t]
  )

  const renderModalContent = useCallback(() => {
    if (!modalState) return null
    switch (modalState.type) {
      case 'monthly':
        return (
          <>
            <FormItem
              label={t('promotion.serviceDay.monthly.name')}
              name="name"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.nameRequired')
                }
              ]}
            >
              <Input
                placeholder={t('promotion.serviceDay.monthly.namePlaceholder')}
              />
            </FormItem>
            <FormItem
              label={t('promotion.serviceDay.monthly.day')}
              name="day"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.dayRequired')
                }
              ]}
            >
              <Select
                options={monthOptions}
                placeholder={t('promotion.serviceDay.monthly.dayPlaceholder')}
              />
            </FormItem>
            <FormItem
              label={t('promotion.serviceDay.monthly.price')}
              name="price"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.priceRequired')
                }
              ]}
            >
              <InputNumber min={0} step={100} style={{ width: '100%' }} />
            </FormItem>
            <FormItem
              label={t('promotion.table.enabled')}
              name="enabled"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </FormItem>
          </>
        )
      case 'weekly':
        return (
          <>
            <FormItem
              label={t('promotion.serviceDay.weekly.name')}
              name="name"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.nameRequired')
                }
              ]}
            >
              <Input
                placeholder={t('promotion.serviceDay.weekly.namePlaceholder')}
              />
            </FormItem>
            <FormItem
              label={t('promotion.serviceDay.weekly.weekday')}
              name="weekday"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.weekdayRequired')
                }
              ]}
            >
              <Select
                options={weekdayOptions}
                placeholder={t(
                  'promotion.serviceDay.weekly.weekdayPlaceholder'
                )}
              />
            </FormItem>
            <FormItem
              label={t('promotion.serviceDay.weekly.price')}
              name="price"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.priceRequired')
                }
              ]}
            >
              <InputNumber min={0} step={100} style={{ width: '100%' }} />
            </FormItem>
            <FormItem
              label={t('promotion.table.enabled')}
              name="enabled"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </FormItem>
          </>
        )
      case 'specific':
        return (
          <>
            <FormItem
              label={t('promotion.serviceDay.specific.name')}
              name="name"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.nameRequired')
                }
              ]}
            >
              <Input
                placeholder={t('promotion.serviceDay.specific.namePlaceholder')}
              />
            </FormItem>
            <FormItem
              label={t('promotion.serviceDay.specific.date')}
              name="date"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.dateRequired')
                }
              ]}
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: '100%' }}
                placeholder={t('promotion.serviceDay.specific.datePlaceholder')}
              />
            </FormItem>
            <FormItem
              label={t('promotion.serviceDay.specific.price')}
              name="price"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.priceRequired')
                }
              ]}
            >
              <InputNumber min={0} step={100} style={{ width: '100%' }} />
            </FormItem>
            <FormItem
              label={t('promotion.table.enabled')}
              name="enabled"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </FormItem>
          </>
        )
      case 'timePeriod':
        return (
          <>
            <FormItem
              label={t('promotion.serviceDay.timePeriod.name')}
              name="name"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.nameRequired')
                }
              ]}
            >
              <Input
                placeholder={t(
                  'promotion.serviceDay.timePeriod.namePlaceholder'
                )}
              />
            </FormItem>
            <FormItem
              label={t('promotion.serviceDay.timePeriod.scope')}
              name="scope"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.scopeRequired')
                }
              ]}
            >
              <Select options={timeScopeOptions} />
            </FormItem>
            {modalScope === 'weekdaySpecific' && (
              <FormItem
                label={t('promotion.serviceDay.timePeriod.weekday')}
                name="weekday"
                rules={[
                  {
                    required: true,
                    message: t(
                      'promotion.serviceDay.validation.weekdayRequired'
                    )
                  }
                ]}
              >
                <Select
                  options={weekdayOptions}
                  placeholder={t(
                    'promotion.serviceDay.weekly.weekdayPlaceholder'
                  )}
                />
              </FormItem>
            )}
            {modalScope === 'specific' && (
              <FormItem
                label={t('promotion.serviceDay.timePeriod.date')}
                name="date"
                rules={[
                  {
                    required: true,
                    message: t('promotion.serviceDay.validation.dateRequired')
                  }
                ]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                  placeholder={t(
                    'promotion.serviceDay.timePeriod.schedulePlaceholder'
                  )}
                />
              </FormItem>
            )}
            <FormItem
              label={`${t('promotion.serviceDay.timePeriod.startTime')} / ${t(
                'promotion.serviceDay.timePeriod.endTime'
              )}`}
              required
            >
              <Space align="center" size={8} style={{ width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <FormItem
                    name="startTime"
                    noStyle
                    rules={[
                      {
                        required: true,
                        message: t(
                          'promotion.serviceDay.validation.timeRangeRequired'
                        )
                      }
                    ]}
                  >
                    <Select
                      options={thirtyHourOptions}
                      placeholder="HH:mm"
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        ((option?.label as string) || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      style={{ width: '100%' }}
                    />
                  </FormItem>
                </div>
                <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                  ~
                </span>
                <div style={{ flex: 1 }}>
                  <FormItem
                    name="endTime"
                    noStyle
                    rules={[
                      {
                        required: true,
                        message: t(
                          'promotion.serviceDay.validation.timeRangeRequired'
                        )
                      },
                      () => ({
                        validator(_, value?: string) {
                          const start = modalForm.getFieldValue('startTime') as
                            | string
                            | undefined
                          if (!value || !start) {
                            return Promise.resolve()
                          }
                          const startMinutes = parseThirtyHourString(start)
                          const endMinutes = parseThirtyHourString(value)
                          if (
                            startMinutes === undefined ||
                            endMinutes === undefined
                          ) {
                            return Promise.reject(
                              t(
                                'promotion.serviceDay.validation.timeRangeInvalid'
                              )
                            )
                          }
                          if (endMinutes > startMinutes) {
                            return Promise.resolve()
                          }
                          return Promise.reject(
                            t(
                              'promotion.serviceDay.validation.timeRangeInvalid'
                            )
                          )
                        }
                      })
                    ]}
                  >
                    <Select
                      options={thirtyHourOptions}
                      placeholder="HH:mm"
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        ((option?.label as string) || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      style={{ width: '100%' }}
                    />
                  </FormItem>
                </div>
              </Space>
            </FormItem>
            <FormItem
              label={t('promotion.serviceDay.timePeriod.price')}
              name="price"
              rules={[
                {
                  required: true,
                  message: t('promotion.serviceDay.validation.priceRequired')
                }
              ]}
            >
              <InputNumber min={0} step={100} style={{ width: '100%' }} />
            </FormItem>
            <FormItem
              label={t('promotion.serviceDay.timePeriod.remark')}
              name="remark"
            >
              <Input.TextArea
                rows={2}
                placeholder={t(
                  'promotion.serviceDay.timePeriod.remarkPlaceholder'
                )}
              />
            </FormItem>
            <FormItem
              label={t('promotion.table.enabled')}
              name="enabled"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </FormItem>
          </>
        )
      // case 'eventActivity':
      //   return (
      //     <>
      //       <FormItem
      //         label={t('promotion.serviceDay.eventRule.activityName')}
      //         name="name"
      //         rules={[
      //           {
      //             required: true,
      //             message: t('promotion.serviceDay.validation.nameRequired')
      //           }
      //         ]}
      //       >
      //         <Input
      //           placeholder={t(
      //             'promotion.serviceDay.eventRule.activityNamePlaceholder'
      //           )}
      //         />
      //       </FormItem>
      //       <FormItem
      //         label={t('promotion.serviceDay.eventRule.scope')}
      //         name="scope"
      //       >
      //         <Input
      //           placeholder={t(
      //             'promotion.serviceDay.eventRule.scopePlaceholder'
      //           )}
      //         />
      //       </FormItem>
      //       <FormItem
      //         label={t('promotion.serviceDay.eventRule.discountPercent')}
      //         name="discountPercent"
      //         rules={[{ validator: validatePairDiscount }]}
      //         extra={t('promotion.serviceDay.eventRule.discountHint')}
      //       >
      //         <InputNumber
      //           min={0}
      //           max={100}
      //           step={1}
      //           style={{ width: '100%' }}
      //         />
      //       </FormItem>
      //       <Space
      //         align="center"
      //         size={8}
      //         style={{ width: '100%', marginBottom: 16 }}
      //       >
      //         <FormItem
      //           label={t('promotion.serviceDay.eventRule.ageLimit')}
      //           style={{ marginBottom: 0 }}
      //         >
      //           <Space>
      //             <FormItem name="ageFrom" noStyle>
      //               <InputNumber min={0} max={120} style={{ width: 100 }} />
      //             </FormItem>
      //             <span>~</span>
      //             <FormItem name="ageTo" noStyle>
      //               <InputNumber min={0} max={120} style={{ width: 100 }} />
      //             </FormItem>
      //           </Space>
      //         </FormItem>
      //       </Space>
      //       <Divider />
      //       <Paragraph strong>
      //         {t('promotion.serviceDay.eventRule.section.monthly')}
      //       </Paragraph>
      //       <Form.List name="monthlyRules">
      //         {(fields, { add, remove }) => (
      //           <Space direction="vertical" style={{ width: '100%' }}>
      //             {fields.map((field) => (
      //               <Space key={field.key} align="baseline" wrap>
      //                 <FormItem
      //                   name={[field.name, 'day']}
      //                   rules={[
      //                     {
      //                       required: true,
      //                       message: t(
      //                         'promotion.serviceDay.validation.dayRequired'
      //                       )
      //                     }
      //                   ]}
      //                 >
      //                   <Select
      //                     options={monthOptions}
      //                     placeholder={t(
      //                       'promotion.serviceDay.eventRule.monthlyDayPlaceholder'
      //                     )}
      //                     style={{ width: 160 }}
      //                   />
      //                 </FormItem>
      //                 <FormItem
      //                   name={[field.name, 'price']}
      //                   rules={[
      //                     {
      //                       required: true,
      //                       message: t(
      //                         'promotion.serviceDay.validation.priceRequired'
      //                       )
      //                     }
      //                   ]}
      //                 >
      //                   <InputNumber
      //                     min={0}
      //                     step={100}
      //                     style={{ width: 160 }}
      //                   />
      //                 </FormItem>
      //                 <Button
      //                   type="link"
      //                   danger
      //                   onClick={() => remove(field.name)}
      //                 >
      //                   {common('button.remove')}
      //                 </Button>
      //               </Space>
      //             ))}
      //             <Button type="dashed" onClick={() => add({})}>
      //               {t('promotion.serviceDay.eventRule.addMonthly')}
      //             </Button>
      //           </Space>
      //         )}
      //       </Form.List>
      //       <Divider />
      //       <Paragraph strong>
      //         {t('promotion.serviceDay.eventRule.section.weekly')}
      //       </Paragraph>
      //       <Form.List name="weeklyRules">
      //         {(fields, { add, remove }) => (
      //           <Space direction="vertical" style={{ width: '100%' }}>
      //             {fields.map((field) => (
      //               <Space key={field.key} align="baseline" wrap>
      //                 <FormItem
      //                   name={[field.name, 'weekday']}
      //                   rules={[
      //                     {
      //                       required: true,
      //                       message: t(
      //                         'promotion.serviceDay.validation.weekdayRequired'
      //                       )
      //                     }
      //                   ]}
      //                 >
      //                   <Select
      //                     options={weekdayOptions}
      //                     placeholder={t(
      //                       'promotion.serviceDay.weekly.weekdayPlaceholder'
      //                     )}
      //                     style={{ width: 160 }}
      //                   />
      //                 </FormItem>
      //                 <FormItem
      //                   name={[field.name, 'price']}
      //                   rules={[
      //                     {
      //                       required: true,
      //                       message: t(
      //                         'promotion.serviceDay.validation.priceRequired'
      //                       )
      //                     }
      //                   ]}
      //                 >
      //                   <InputNumber
      //                     min={0}
      //                     step={100}
      //                     style={{ width: 160 }}
      //                   />
      //                 </FormItem>
      //                 <Button
      //                   type="link"
      //                   danger
      //                   onClick={() => remove(field.name)}
      //                 >
      //                   {common('button.remove')}
      //                 </Button>
      //               </Space>
      //             ))}
      //             <Button type="dashed" onClick={() => add({})}>
      //               {t('promotion.serviceDay.eventRule.addWeekly')}
      //             </Button>
      //           </Space>
      //         )}
      //       </Form.List>
      //       <Divider />
      //       <Paragraph strong>
      //         {t('promotion.serviceDay.eventRule.section.daily')}
      //       </Paragraph>
      //       <Form.List name="dailyRules">
      //         {(fields, { add, remove }) => (
      //           <Space direction="vertical" style={{ width: '100%' }}>
      //             {fields.map((field) => (
      //               <Space key={field.key} align="baseline" wrap>
      //                 <FormItem
      //                   name={[field.name, 'dateRange']}
      //                   rules={[
      //                     {
      //                       required: true,
      //                       message: t(
      //                         'promotion.serviceDay.eventRule.dateRangeRequired'
      //                       )
      //                     }
      //                   ]}
      //                 >
      //                   <DateRangePicker style={{ width: 260 }} />
      //                 </FormItem>
      //                 <FormItem
      //                   name={[field.name, 'price']}
      //                   rules={[
      //                     {
      //                       required: true,
      //                       message: t(
      //                         'promotion.serviceDay.validation.priceRequired'
      //                       )
      //                     }
      //                   ]}
      //                 >
      //                   <InputNumber
      //                     min={0}
      //                     step={100}
      //                     style={{ width: 160 }}
      //                   />
      //                 </FormItem>
      //                 <Button
      //                   type="link"
      //                   danger
      //                   onClick={() => remove(field.name)}
      //                 >
      //                   {common('button.remove')}
      //                 </Button>
      //               </Space>
      //             ))}
      //             <Button type="dashed" onClick={() => add({})}>
      //               {t('promotion.serviceDay.eventRule.addDaily')}
      //             </Button>
      //           </Space>
      //         )}
      //       </Form.List>
      //       <Divider />
      //       <Paragraph strong>
      //         {t('promotion.serviceDay.eventRule.section.specific')}
      //       </Paragraph>
      //       <Form.List name="specificRules">
      //         {(fields, { add, remove }) => (
      //           <Space direction="vertical" style={{ width: '100%' }}>
      //             {fields.map((field) => (
      //               <Space key={field.key} align="baseline" wrap>
      //                 <FormItem
      //                   name={[field.name, 'date']}
      //                   rules={[
      //                     {
      //                       required: true,
      //                       message: t(
      //                         'promotion.serviceDay.validation.dateRequired'
      //                       )
      //                     }
      //                   ]}
      //                 >
      //                   <DatePicker
      //                     format="YYYY-MM-DD"
      //                     style={{ width: 160 }}
      //                     placeholder={t(
      //                       'promotion.serviceDay.eventRule.specificDatePlaceholder'
      //                     )}
      //                   />
      //                 </FormItem>
      //                 <FormItem
      //                   name={[field.name, 'price']}
      //                   rules={[
      //                     {
      //                       required: true,
      //                       message: t(
      //                         'promotion.serviceDay.validation.priceRequired'
      //                       )
      //                     }
      //                   ]}
      //                 >
      //                   <InputNumber
      //                     min={0}
      //                     step={100}
      //                     style={{ width: 160 }}
      //                   />
      //                 </FormItem>
      //                 <Button
      //                   type="link"
      //                   danger
      //                   onClick={() => remove(field.name)}
      //                 >
      //                   {common('button.remove')}
      //                 </Button>
      //               </Space>
      //             ))}
      //             <Button type="dashed" onClick={() => add({})}>
      //               {t('promotion.serviceDay.eventRule.addSpecific')}
      //             </Button>
      //           </Space>
      //         )}
      //       </Form.List>
      //     </>
      //   )
      default:
        return null
    }
  }, [
    modalScope,
    modalState,
    modalForm,
    monthOptions,
    pricingMode,
    t,
    timeScopeOptions,
    thirtyHourOptions,
    validatePairDiscount,
    weekdayOptions,
    unifiedPriceValue,
    common
  ])

  const monthlyColumns = useMemo<TableColumnsType<any>>(
    () => [
      { title: '', key: 'drag', width: 48, align: 'center' as const, render: () => null },
      {
        title: t('promotion.serviceDay.monthly.name'),
        dataIndex: 'name',
        render: (value: string) => value || '--'
      },
      {
        title: t('promotion.serviceDay.monthly.day'),
        dataIndex: 'day',
        render: (value: number) => (value !== undefined ? value : '--')
      },
      {
        title: t('promotion.serviceDay.monthly.price'),
        dataIndex: 'price',
        render: (_: number, record: any) => displayPrice(record.price)
      },
      {
        title: t('promotion.table.enabled'),
        dataIndex: 'enabled',
        width: 100,
        align: 'center',
        render: (value: boolean) => (
          <Switch checked={value ?? true} disabled />
        )
      },
      {
        title: common('table.action'),
        key: 'action',
        width: 160,
        align: 'center',
        render: (_: any, record: any) => (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => openModal('monthly', record.index)}
            >
              {common('button.edit')}
            </Button>
            <Button
              type="link"
              size="small"
              danger
              onClick={() => removeEntry('monthly', record.index)}
            >
              {common('button.remove')}
            </Button>
          </Space>
        )
      }
    ],
    [common, displayPrice, openModal, removeEntry, t]
  )

  const weeklyColumns = useMemo<TableColumnsType<any>>(
    () => [
      { title: '', key: 'drag', width: 48, align: 'center' as const, render: () => null },
      {
        title: t('promotion.serviceDay.weekly.name'),
        dataIndex: 'name',
        render: (value: string) => value || '--'
      },
      {
        title: t('promotion.serviceDay.weekly.weekday'),
        dataIndex: 'weekday',
        render: (value: string) => weekdayLabel(value)
      },
      {
        title: t('promotion.serviceDay.weekly.price'),
        dataIndex: 'price',
        render: (_: number, record: any) => displayPrice(record.price)
      },
      {
        title: t('promotion.table.enabled'),
        dataIndex: 'enabled',
        width: 100,
        align: 'center',
        render: (value: boolean) => (
          <Switch checked={value ?? true} disabled />
        )
      },
      {
        title: common('table.action'),
        key: 'action',
        width: 160,
        align: 'center',
        render: (_: any, record: any) => (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => openModal('weekly', record.index)}
            >
              {common('button.edit')}
            </Button>
            <Button
              type="link"
              size="small"
              danger
              onClick={() => removeEntry('weekly', record.index)}
            >
              {common('button.remove')}
            </Button>
          </Space>
        )
      }
    ],
    [common, displayPrice, openModal, removeEntry, t, weekdayLabel]
  )

  const specificColumns = useMemo<TableColumnsType<any>>(
    () => [
      { title: '', key: 'drag', width: 48, align: 'center' as const, render: () => null },
      {
        title: t('promotion.serviceDay.specific.name'),
        dataIndex: 'name',
        render: (value: string) => value || '--'
      },
      {
        title: t('promotion.serviceDay.specific.date'),
        dataIndex: 'date',
        render: (value: Dayjs | string) => formatDate(value)
      },
      {
        title: t('promotion.serviceDay.specific.price'),
        dataIndex: 'price',
        render: (_: number, record: any) => displayPrice(record.price)
      },
      {
        title: t('promotion.table.enabled'),
        dataIndex: 'enabled',
        width: 100,
        align: 'center',
        render: (value: boolean) => (
          <Switch checked={value ?? true} disabled />
        )
      },
      {
        title: common('table.action'),
        key: 'action',
        width: 160,
        align: 'center',
        render: (_: any, record: any) => (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => openModal('specific', record.index)}
            >
              {common('button.edit')}
            </Button>
            <Button
              type="link"
              size="small"
              danger
              onClick={() => removeEntry('specific', record.index)}
            >
              {common('button.remove')}
            </Button>
          </Space>
        )
      }
    ],
    [common, displayPrice, formatDate, openModal, removeEntry, t]
  )

  const _pricingRuleColumns = useMemo<TableColumnsType<PricingRuleRow>>(
    () => [
      {
        title: t('promotion.serviceDay.pricingRulesAudience'),
        dataIndex: 'audienceType',
        width: 140,
        render: (value: number, record: PricingRuleRow) => (
          <Select
            value={value}
            options={audienceTypeOptions}
            onChange={(v) =>
              setPricingRuleList((prev: PricingRuleEntry[]) =>
                prev.map((item: PricingRuleEntry, i: number) =>
                  i === record.index ? { ...item, audienceType: v ?? 1 } : item
                )
              )
            }
            style={{ width: '100%' }}
          />
        )
      },
      {
        title: t('promotion.serviceDay.pricingRulesPrice'),
        dataIndex: 'value',
        width: 120,
        render: (value: number, record: PricingRuleRow) => (
          <InputNumber
            min={0}
            step={100}
            value={value}
            onChange={(v) =>
              setPricingRuleList((prev: PricingRuleEntry[]) =>
                prev.map((item: PricingRuleEntry, i: number) =>
                  i === record.index ? { ...item, value: Number(v ?? 0) } : item
                )
              )
            }
            style={{ width: '100%' }}
          />
        )
      },
      {
        title: t('promotion.serviceDay.pricingRulesPriority'),
        dataIndex: 'priority',
        width: 100,
        render: (value: number, record: PricingRuleRow) => (
          <InputNumber
            min={0}
            value={value}
            onChange={(v) =>
              setPricingRuleList((prev: PricingRuleEntry[]) =>
                prev.map((item: PricingRuleEntry, i: number) =>
                  i === record.index ? { ...item, priority: Number(v ?? 0) } : item
                )
              )
            }
            style={{ width: '100%' }}
          />
        )
      },
      {
        title: common('table.action'),
        key: 'action',
        width: 80,
        align: 'center',
        render: (_: unknown, record: PricingRuleRow) => (
          <Button
            type="link"
            size="small"
            danger
            onClick={() => removePricingRule(record.index)}
          >
            {common('button.remove')}
          </Button>
        )
      }
    ],
    [audienceTypeOptions, common, removePricingRule, t]
  )

  const timePeriodColumns = useMemo<TableColumnsType<any>>(
    () => [
      { title: '', key: 'drag', width: 48, align: 'center' as const, render: () => null },
      {
        title: t('promotion.serviceDay.timePeriod.name'),
        dataIndex: 'name',
        render: (value: string) => value || '--'
      },
      {
        title: t('promotion.serviceDay.timePeriod.scope'),
        dataIndex: 'scope',
        render: (value: TimeScope) => scopeLabel(value)
      },
      {
        title: t('promotion.serviceDay.timePeriod.schedule'),
        dataIndex: 'schedule',
        render: (_: any, record: any) => {
          if (record.scope === 'weekdaySpecific') {
            return weekdayLabel(record.weekday)
          }
          if (record.scope === 'specific') {
            return formatDate(record.date)
          }
          return '--'
        }
      },
      {
        title: `${t('promotion.serviceDay.timePeriod.startTime')} / ${t(
          'promotion.serviceDay.timePeriod.endTime'
        )}`,
        dataIndex: 'startTime',
        render: (_: any, record: any) =>
          formatTimeRange(record.startTime, record.endTime)
      },
      {
        title: t('promotion.serviceDay.timePeriod.price'),
        dataIndex: 'price',
        render: (_: number, record: any) => displayPrice(record.price)
      },
      {
        title: t('promotion.table.enabled'),
        dataIndex: 'enabled',
        width: 80,
        align: 'center',
        render: (value: boolean) => (
          <Switch checked={value ?? true} disabled />
        )
      },
      {
        title: t('promotion.serviceDay.timePeriod.remark'),
        dataIndex: 'remark',
        render: (value: string) => value || '--'
      },
      {
        title: common('table.action'),
        key: 'action',
        width: 160,
        align: 'center',
        render: (_: any, record: any) => (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => openModal('timePeriod', record.index)}
            >
              {common('button.edit')}
            </Button>
            <Button
              type="link"
              size="small"
              danger
              onClick={() => removeEntry('timePeriod', record.index)}
            >
              {common('button.remove')}
            </Button>
          </Space>
        )
      }
    ],
    [
      common,
      displayPrice,
      formatDate,
      formatTimeRange,
      openModal,
      removeEntry,
      scopeLabel,
      t,
      weekdayLabel
    ]
  )

  /*
   * const handleRemoveActivity = useCallback(
   *   (index: number) => {
   *     Modal.confirm({
   *       title: common('button.remove'),
   *       content: t('promotion.serviceDay.eventRule.deleteConfirm'),
   *       onOk: () =>
   *         setEventActivities((prev) => prev.filter((_, i) => i !== index))
   *     })
   *   },
   *   [common, setEventActivities, t]
   * )
   */

  // const eventActivityColumns = useMemo<TableColumnsType<any>>(
  //   () => [
  //     {
  //       title: t('promotion.serviceDay.eventRule.activityName'),
  //       dataIndex: 'name',
  //       render: (value: string) => value || '--'
  //     },
  //     {
  //       title: t('promotion.serviceDay.eventRule.scope'),
  //       dataIndex: 'scope',
  //       render: (value: string) => value || '--'
  //     },
  //     {
  //       title: t('promotion.serviceDay.eventRule.discountPercent'),
  //       dataIndex: 'discountPercent',
  //       render: (_: number, record: EventActivityEntry) =>
  //         summarizeActivityDiscount(record)
  //     },
  //     {
  //       title: t('promotion.serviceDay.eventRule.ageLimit'),
  //       dataIndex: 'ageRange',
  //       render: (_: any, record: EventActivityEntry) =>
  //         activityAgeRangeText(record)
  //     },
  //     {
  //       title: t('promotion.serviceDay.eventRule.summary.title'),
  //       dataIndex: 'rules',
  //       render: (_: any, record: EventActivityEntry) =>
  //         summarizeActivityRules(record)
  //     },
  //     {
  //       title: common('table.action'),
  //       key: 'action',
  //       width: 180,
  //       align: 'center',
  //       render: (_: any, record: any) => (
  //         <Space>
  //           <Button
  //             type="link"
  //             size="small"
  //             onClick={() => openModal('eventActivity', record.index)}
  //           >
  //             {common('button.edit')}
  //           </Button>
  //           <Button
  //             type="link"
  //             size="small"
  //             danger
  //             onClick={() => handleRemoveActivity(record.index)}
  //           >
  //             {common('button.remove')}
  //           </Button>
  //         </Space>
  //       )
  //     }
  //   ],
  //   [common, handleRemoveActivity, openModal, t]
  // )

  const handleBackToList = () => {
    if (!cinemaId) {
      router.back()
      return
    }

    router.push(
      processPath({
        name: 'promotion',
        query: {
          cinemaId,
          cinemaName: cinemaName ? encodeURIComponent(cinemaName) : ''
        }
      })
    )
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!cinemaId || Number.isNaN(cinemaId)) {
        return
      }

      setSubmitting(true)
      const unifiedPrice = values.unifiedPrice
      const unifiedPriceValue =
        pricingMode === 'unified' ? unifiedPrice ?? 0 : undefined
      const resolvePrice = (price?: number) =>
        pricingMode === 'unified' ? unifiedPriceValue ?? 0 : Number(price ?? 0)

      const monthlyDays = monthlyList
        .filter((item) => item.day !== undefined)
        .map((item, index) => ({
          id: item.id,
          name: item.name,
          dayOfMonth: item.day,
          price: resolvePrice(item.price),
          enabled: item.enabled ?? true,
          priority: index
        }))

      const weeklyDays = weeklyList.reduce<PromotionWeeklyDay[]>(
        (acc, item, index) => {
          const weekdayNumber = WEEKDAY_KEY_TO_NUMBER[item.weekday]
          if (!weekdayNumber) {
            return acc
          }
          acc.push({
            id: item.id,
            name: item.name,
            weekday: weekdayNumber,
            price: resolvePrice(item.price),
            enabled: item.enabled ?? true,
            priority: index
          })
          return acc
        },
        []
      )

      const specificDates = specificList.reduce<PromotionSpecificDate[]>(
        (acc, item, index) => {
          if (!item.date || !dayjs.isDayjs(item.date)) {
            return acc
          }
          acc.push({
            id: item.id,
            name: item.name,
            date: item.date.format('YYYY-MM-DD'),
            price: resolvePrice(item.price),
            enabled: item.enabled ?? true,
            priority: index
          })
          return acc
        },
        []
      )

      const timeRanges = timePeriodList.reduce<PromotionTimeRange[]>(
        (acc, item) => {
          const startTime =
            normalizeThirtyHourString(item.startTime) ?? item.startTime
          const endTime =
            normalizeThirtyHourString(item.endTime) ?? item.endTime

          const startMinutes = parseThirtyHourString(startTime)
          const endMinutes = parseThirtyHourString(endTime)

          if (
            !startTime ||
            !endTime ||
            startMinutes === undefined ||
            endMinutes === undefined ||
            endMinutes <= startMinutes
          ) {
            return acc
          }

          let applicableDays: string | undefined
          switch (item.scope) {
            case 'weekdaySpecific': {
              const weekdayNumber = item.weekday
                ? WEEKDAY_KEY_TO_NUMBER[item.weekday]
                : undefined
              if (!weekdayNumber) {
                return acc
              }
              applicableDays = String(weekdayNumber)
              break
            }
            case 'specific': {
              if (!item.date) {
                return acc
              }
              applicableDays = item.date.format('YYYY-MM-DD')
              break
            }
            case 'weekday':
              applicableDays = 'weekday'
              break
            case 'weekend':
              applicableDays = 'weekend'
              break
            default:
              applicableDays = undefined
          }

          acc.push({
            id: item.id,
            name: item.name,
            applicableScope: item.scope,
            applicableDays,
            startTime,
            endTime,
            price: resolvePrice(item.price),
            remark: item.remark,
            enabled: item.enabled ?? true,
            priority: acc.length
          })
          return acc
        },
        []
      )

      const payload: PromotionSaveQuery = {
        id: promotionIdParam ? Number(promotionIdParam) : undefined,
        cinemaId,
        name: values.name ?? '',
        remark: values.remark ?? '',
        allowMuviticket: false,
        monthlyPriority: values.monthlyPriority ?? 0,
        weeklyPriority: values.weeklyPriority ?? 0,
        specificDatePriority: values.specificDatePriority ?? 0,
        timeRangePriority: values.timeRangePriority ?? 0,
        fixedPricePriority: values.fixedPricePriority ?? 0,
        ticketTypePriority: values.ticketTypePriority ?? 0,
        monthlyDays,
        weeklyDays,
        specificDates,
        timeRanges,
        pricingRules: []
      }

      await savePromotion(payload)

      message.success(t('promotion.serviceDay.message.saveSuccess'))
      handleBackToList()
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!cinemaId) {
    return null
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Spin spinning={loading}>
        <Form
          layout="vertical"
          form={form}
          disabled={loading}
          initialValues={{
            name: '',
            pricingMode: 'individual',
            unifiedPrice: undefined,
            remark: undefined,
            ...orderToFormValues([...RULE_TYPE_KEYS])
          }}
        >
          <Row gutter={24}>
            <Col xs={24} lg={18}>
              <Space size={40} direction="vertical" style={{ width: '100%' }}>
                {cardOrder.map((key) => {
                  if (key === 'monthly') {
                    return (
                      <Card
                        key="monthly"
                        variant="outlined"
                        title={
                          <Title style={{ margin: '12px 0' }} level={4}>
                            {t('promotion.serviceDay.monthly.title')}
                          </Title>
                        }
                        size="small"
                      >
                        <Paragraph type="secondary" style={{ marginTop: 0 }}>
                          {t('promotion.serviceDay.monthly.description')}
                        </Paragraph>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMonthlyDragEnd}>
                            <SortableContext items={monthlySortableIds} strategy={verticalListSortingStrategy}>
                              <Table
                                size="small"
                                pagination={false}
                                dataSource={monthlyDataSource}
                                columns={monthlyColumns}
                                rowKey={(r) => `monthly-${r.index}`}
                                components={{ body: { row: SortableRuleTableRow } }}
                                locale={{ emptyText: t('empty') }}
                              />
                            </SortableContext>
                          </DndContext>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => openModal('monthly')}
                            style={{ width: 'fit-content' }}
                          >
                            {t('promotion.serviceDay.monthly.add')}
                          </Button>
                        </Space>
                      </Card>
                    )
                  }
                  if (key === 'weekly') {
                    return (
                      <Card
                        key="weekly"
                        variant="outlined"
                        title={
                          <Title style={{ margin: '12px 0' }} level={4}>
                            {t('promotion.serviceDay.weekly.title')}
                          </Title>
                        }
                        size="small"
                      >
                        <Paragraph type="secondary" style={{ marginTop: 0 }}>
                          {t('promotion.serviceDay.weekly.description')}
                        </Paragraph>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleWeeklyDragEnd}>
                            <SortableContext items={weeklySortableIds} strategy={verticalListSortingStrategy}>
                              <Table
                                size="small"
                                pagination={false}
                                dataSource={weeklyDataSource}
                                columns={weeklyColumns}
                                rowKey={(r) => `weekly-${r.index}`}
                                components={{ body: { row: SortableRuleTableRow } }}
                                locale={{ emptyText: t('empty') }}
                              />
                            </SortableContext>
                          </DndContext>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => openModal('weekly')}
                            style={{ width: 'fit-content' }}
                          >
                            {t('promotion.serviceDay.weekly.add')}
                          </Button>
                        </Space>
                      </Card>
                    )
                  }
                  if (key === 'specificDate') {
                    return (
                      <Card
                        key="specific"
                        variant="borderless"
                        title={
                          <Title style={{ margin: '12px 0' }} level={4}>
                            {t('promotion.serviceDay.specific.title')}
                          </Title>
                        }
                        size="small"
                      >
                        <Paragraph type="secondary" style={{ marginTop: 0 }}>
                          {t('promotion.serviceDay.specific.description')}
                        </Paragraph>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSpecificDragEnd}>
                            <SortableContext items={specificSortableIds} strategy={verticalListSortingStrategy}>
                              <Table
                                size="small"
                                pagination={false}
                                dataSource={specificDataSource}
                                columns={specificColumns}
                                rowKey={(r) => `specific-${r.index}`}
                                components={{ body: { row: SortableRuleTableRow } }}
                                locale={{ emptyText: t('empty') }}
                              />
                            </SortableContext>
                          </DndContext>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => openModal('specific')}
                            style={{ width: 'fit-content' }}
                          >
                            {t('promotion.serviceDay.specific.add')}
                          </Button>
                        </Space>
                      </Card>
                    )
                  }
                  if (key === 'timeRange') {
                    return (
                      <Card
                        key="timePeriod"
                        variant="borderless"
                        title={
                          <Title style={{ margin: '12px 0' }} level={4}>
                            {t('promotion.serviceDay.timePeriod.title')}
                          </Title>
                        }
                        size="small"
                      >
                        <Paragraph type="secondary" style={{ marginTop: 0 }}>
                          {t('promotion.serviceDay.timePeriod.description')}
                        </Paragraph>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTimePeriodDragEnd}>
                            <SortableContext items={timePeriodSortableIds} strategy={verticalListSortingStrategy}>
                              <Table
                                size="small"
                                pagination={false}
                                dataSource={timePeriodDataSource}
                                columns={timePeriodColumns}
                                rowKey={(r) => `timePeriod-${r.index}`}
                                components={{ body: { row: SortableRuleTableRow } }}
                                locale={{ emptyText: t('empty') }}
                                scroll={{ x: 960 }}
                              />
                            </SortableContext>
                          </DndContext>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => openModal('timePeriod')}
                            style={{ width: 'fit-content' }}
                          >
                            {t('promotion.serviceDay.timePeriod.add')}
                          </Button>
                        </Space>
                      </Card>
                    )
                  }
                  return null
                })}
                <Card size="small">
                  <FormItem
                    label={t('promotion.serviceDay.remark.label')}
                    name="remark"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder={t('promotion.serviceDay.remark.placeholder')}
                    />
                  </FormItem>
                </Card>
              </Space>
            </Col>
            <Col xs={24} lg={6}>
              <Card variant="outlined" size="small">
                <Paragraph strong style={{ marginTop: 0 }}>
                  {t('promotion.serviceDay.typePriority.title')}
                </Paragraph>
                <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 16 }}>
                  {t('promotion.serviceDay.typePriority.description')}
                </Paragraph>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleTypePriorityDragEnd}
                >
                  <SortableContext
                    items={typePriorityOrder}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {typePriorityOrder.map((key, index) => (
                        <SortableRuleTypeRow
                          key={key}
                          id={key}
                          label={t(`promotion.serviceDay.typePriority.${key}` as const)}
                          rank={index + 1}
                          dragAriaLabel={t('promotion.serviceDay.typePriority.dragHint')}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </Card>
            </Col>
          </Row>
        </Form>
      </Spin>
      <Modal
        open={!!modalState}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        destroyOnHidden
        width={720}
        title={
          modalState
            ? `${
                modalState.index !== undefined
                  ? common('button.edit')
                  : common('button.add')
              } ${modalTypeLabelMap[modalState.type]}`
            : ''
        }
        okText={common('button.save')}
        cancelText={common('button.cancel')}
      >
        <Form form={modalForm} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          {renderModalContent()}
        </Form>
      </Modal>
      <Divider style={{ margin: 0 }} />
      <Space>
        <Button onClick={handleBackToList}>{common('button.cancel')}</Button>
        <CheckPermission code="promotion.save">
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            {common('button.save')}
          </Button>
        </CheckPermission>
      </Space>
    </section>
  )
}
