'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Typography,
  message,
  Table,
  Modal
} from 'antd'
import type { TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
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

interface PromotionFormValues {
  name?: string
  pricingMode: PricingMode
  unifiedPrice?: number
  remark?: string
}

interface MonthlyEntry {
  id?: number
  name: string
  day: number
  price: number
}

interface WeeklyEntry {
  id?: number
  name: string
  weekday: string
  price: number
}

interface SpecificEntry {
  id?: number
  name: string
  date: Dayjs
  price: number
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

  const resetPromotionState = useCallback(() => {
    setMonthlyList([])
    setWeeklyList([])
    setSpecificList([])
    setTimePeriodList([])
    form.setFieldsValue({
      pricingMode: 'individual',
      unifiedPrice: undefined,
      remark: undefined,
      name: undefined
    })
  }, [form])

  const hydratePromotionDetail = useCallback(
    (detail: PromotionDetailResponse) => {
      form.setFieldsValue({
        name: detail.name || '',
        remark: detail.remark || undefined,
        pricingMode: 'individual',
        unifiedPrice: undefined
      })

      setMonthlyList(
        (detail.monthlyDays || []).map((item) => ({
          id: item.id,
          name: item.name || '',
          day: item.dayOfMonth,
          price: item.price
        })) 
      )

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
            price: item.price
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
            price: item.price
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
            remark: item.remark
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
    },
    [form]
  )

  const fetchPromotionDetail = useCallback(async () => {
    if (!cinemaId || Number.isNaN(cinemaId)) {
      resetPromotionState()
      return
    }
    if (!hasPromotionId) {
      resetPromotionState()
      return
    }
    try {
      setLoading(true)
      const detail = await getPromotionDetail(cinemaId)
      hydratePromotionDetail(detail)
    } catch (error) {
      resetPromotionState()
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [cinemaId, hasPromotionId, hydratePromotionDetail, resetPromotionState])

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

  const openModal = useCallback(
    (type: ModalType, index?: number) => {
      modalForm.resetFields()

      if (type === 'monthly') {
        if (index !== undefined) {
          modalForm.setFieldsValue(monthlyList[index])
        } else {
          modalForm.setFieldsValue({
            price: unifiedPriceValue,
            day: undefined,
            name: ''
          })
        }
      }
      if (type === 'weekly') {
        if (index !== undefined) {
          modalForm.setFieldsValue(weeklyList[index])
        } else {
          modalForm.setFieldsValue({
            price: unifiedPriceValue,
            weekday: undefined,
            name: ''
          })
        }
      }
      if (type === 'specific') {
        if (index !== undefined) {
          modalForm.setFieldsValue(specificList[index])
        } else {
          modalForm.setFieldsValue({
            price: unifiedPriceValue,
            name: '',
            date: undefined
          })
        }
      }
      if (type === 'timePeriod') {
        if (index !== undefined) {
          modalForm.setFieldsValue(timePeriodList[index])
        } else {
          modalForm.setFieldsValue({
            scope: 'daily',
            price: unifiedPriceValue,
            startTime: undefined,
            endTime: undefined,
            name: ''
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
              price: Number((next as MonthlyEntry).price ?? 0)
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
              price: Number((next as WeeklyEntry).price ?? 0)
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
              price: Number((next as SpecificEntry).price ?? 0)
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
              remark: timePeriodValues.remark
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
    [common, openModal, removeEntry, t, weekdayLabel]
  )

  const specificColumns = useMemo<TableColumnsType<any>>(
    () => [
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
    [common, formatDate, openModal, removeEntry, t]
  )

  const timePeriodColumns = useMemo<TableColumnsType<any>>(
    () => [
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
        .map((item) => ({
          id: item.id,
          name: item.name,
          dayOfMonth: item.day,
          price: resolvePrice(item.price)
        }))

      const weeklyDays = weeklyList.reduce<PromotionWeeklyDay[]>(
        (acc, item) => {
          const weekdayNumber = WEEKDAY_KEY_TO_NUMBER[item.weekday]
          if (!weekdayNumber) {
            return acc
          }
          acc.push({
            id: item.id,
            name: item.name,
            weekday: weekdayNumber,
            price: resolvePrice(item.price)
          })
          return acc
        },
        []
      )

      const specificDates = specificList.reduce<PromotionSpecificDate[]>(
        (acc, item) => {
          if (!item.date || !dayjs.isDayjs(item.date)) {
            return acc
          }
          acc.push({
            id: item.id,
            name: item.name,
            date: item.date.format('YYYY-MM-DD'),
            price: resolvePrice(item.price)
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
            remark: item.remark
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
        monthlyDays,
        weeklyDays,
        specificDates,
        timeRanges
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
            remark: undefined
          }}
        >
          <FormItem
            label={t('promotion.serviceDay.eventRule.activityName')}
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
                'promotion.serviceDay.eventRule.activityNamePlaceholder'
              )}
            />
          </FormItem>
          <Space size={40} direction="vertical">
            <Card
              variant="borderless"
              title={
                <Title style={{ margin: '12px 0' }} level={4}>
                  {t('promotion.serviceDay.monthly.title')}
                </Title>
              }
              size="small"
              bordered
            >
              <Paragraph type="secondary" style={{ marginTop: 0 }}>
                {t('promotion.serviceDay.monthly.description')}
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={monthlyDataSource}
                  columns={monthlyColumns}
                  rowKey="index"
                  locale={{ emptyText: t('empty') }}
                />
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

            <Card
              variant="borderless"
              title={
                <Title style={{ margin: '12px 0' }} level={4}>
                  {t('promotion.serviceDay.weekly.title')}
                </Title>
              }
              size="small"
              bordered
            >
              <Paragraph type="secondary" style={{ marginTop: 0 }}>
                {t('promotion.serviceDay.weekly.description')}
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={weeklyDataSource}
                  columns={weeklyColumns}
                  rowKey="index"
                  locale={{ emptyText: t('empty') }}
                />
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

            <Card
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
                <Table
                  size="small"
                  pagination={false}
                  dataSource={specificDataSource}
                  columns={specificColumns}
                  rowKey="index"
                  locale={{ emptyText: t('empty') }}
                />
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
            <Card
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
                <Table
                  size="small"
                  pagination={false}
                  dataSource={timePeriodDataSource}
                  columns={timePeriodColumns}
                  rowKey="index"
                  locale={{ emptyText: t('empty') }}
                  scroll={{ x: 960 }}
                />
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

            {/* <Card
          title={t('promotion.serviceDay.eventRule.title')}
          size="small"
        >
          <Paragraph type="secondary" style={{ marginTop: 0 }}>
            {t('promotion.serviceDay.eventRule.description')}
          </Paragraph>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Table
              size="small"
              pagination={false}
              dataSource={eventActivityDataSource}
              columns={eventActivityColumns}
              rowKey="index"
              locale={{ emptyText: t('empty') }}
              scroll={{ x: 960 }}
            />
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => openModal('eventActivity')}
              style={{ width: 'fit-content' }}
            >
              {t('promotion.serviceDay.eventRule.add')}
            </Button>
          </Space>
        </Card> */}

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
        </Form>
      </Spin>
      <Modal
        open={!!modalState}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        destroyOnClose
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
        <Form form={modalForm}>{renderModalContent()}</Form>
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
