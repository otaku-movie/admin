'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Divider, Modal, Space, Table, Typography, message } from 'antd'
import type { TableColumnsType } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import { useRouter, useSearchParams } from 'next/navigation'
import { processPath } from '@/config/router'
import dayjs from 'dayjs'
import {
  getPromotionList,
  removePromotion,
  type PromotionListItem
} from '@/api/request/promotion'
import { normalizeThirtyHourString } from '@/utils/thirtyHourTime'
import { CheckPermission } from '@/components/checkPermission'

const { Title } = Typography

const WEEKDAY_NUMBER_TO_KEY: Record<number, string> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  7: 'sunday'
}

export default function PricingStrategyPage({ params: { lng } }: PageProps) {
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

  const cinemaIdParam = searchParams.get('cinemaId')
  const cinemaNameParam = searchParams.get('cinemaName')

  const cinemaId = cinemaIdParam ? Number(cinemaIdParam) : undefined
  const cinemaName = cinemaNameParam
    ? decodeURIComponent(cinemaNameParam)
    : undefined

  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<PromotionListItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!cinemaId) {
      message.error(common('message.notPermission'))
      router.push(`/${lng}/cinema`)
    }
  }, [cinemaId, common, lng, router])

  const fetchPromotions = useCallback(
    async (nextPage = 1, nextPageSize = pageSize) => {
      if (!cinemaId) return
      try {
        setLoading(true)
        const res = await getPromotionList({
          cinemaId,
          page: nextPage,
          pageSize: nextPageSize
        })
        setDataSource(res.list || [])
        setPage(res.page || nextPage)
        setPageSize(res.pageSize || nextPageSize)
        setTotal(res.total || 0)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    },
    [cinemaId, pageSize]
  )

  useEffect(() => {
    if (!cinemaId) return
    fetchPromotions(1, pageSize)
  }, [cinemaId, fetchPromotions, pageSize])

  const handleRemove = useCallback(
    (id: number) => {
      Modal.confirm({
        title: t('promotion.message.deleteConfirm'),
        okText: common('button.remove'),
        cancelText: common('button.cancel'),
        okButtonProps: { danger: true },
        onOk: async () => {
          await removePromotion(id)
          message.success(t('promotion.message.deleteSuccess'))
          fetchPromotions(page, pageSize)
        }
      })
    },
    [common, fetchPromotions, page, pageSize, t]
  )

  const weekdayLabel = useCallback(
    (weekday?: number) => {
      if (!weekday) return '--'
      const key = WEEKDAY_NUMBER_TO_KEY[weekday]
      if (!key) return '--'
      return t(`promotion.serviceDay.weekdays.${key}` as const)
    },
    [t]
  )

  const formatDate = useCallback(
    (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '--'),
    []
  )

  const formatDateTime = useCallback(
    (value?: string) =>
      value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '--',
    []
  )

  const formatPrice = useCallback(
    (value?: number) =>
      value !== undefined && value !== null
        ? `${value.toLocaleString()} ${common('unit.jpy')}`
        : '--',
    [common]
  )

  const summarizeRules = useCallback(
    (items: Array<{ name: string }>, formatter: (item: any) => string) => {
      if (!items || items.length === 0) return '--'
      return items.map((item) => formatter(item)).join(' / ')
    },
    []
  )

  const summarizeTimeRanges = useCallback(
    (items: PromotionListItem['timeRanges']) => {
      if (!items || items.length === 0) return '--'
      return items
        .map((range) => {
          const start = normalizeThirtyHourString(range.startTime) ?? '--'
          const end = normalizeThirtyHourString(range.endTime) ?? '--'
          return `${range.name || '--'} (${start}-${end})`
        })
        .join(' / ')
    },
    []
  )

  const expandedRowRender = useCallback(
    (item: PromotionListItem) => (
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <Typography.Text>
          <Typography.Text strong>
            {t('promotion.table.remark')}:
          </Typography.Text>{' '}
          {item.remark || '--'}
        </Typography.Text>

        <div>
          <Typography.Title level={5} style={{ marginBottom: 8 }}>
            {t('promotion.serviceDay.monthly.title')}
          </Typography.Title>
          {item.monthlyDays.length ? (
            <Table
              size="small"
              rowKey={(rule) => rule.id ?? `${rule.dayOfMonth}`}
              pagination={false}
              columns={[
                {
                  title: t('promotion.serviceDay.monthly.name'),
                  dataIndex: 'name',
                  key: 'name',
                  render: (value: string) => value || '--'
                },
                {
                  title: t('promotion.serviceDay.monthly.day'),
                  dataIndex: 'dayOfMonth',
                  key: 'dayOfMonth',
                  render: (value: number) =>
                    value !== undefined ? `${value}${common('unit.day')}` : '--'
                },
                {
                  title: t('promotion.serviceDay.monthly.price'),
                  dataIndex: 'price',
                  key: 'price',
                  render: (value: number) => formatPrice(value)
                }
              ]}
              dataSource={item.monthlyDays}
            />
          ) : (
            <Typography.Text type="secondary">{t('empty')}</Typography.Text>
          )}
        </div>

        <Divider style={{ margin: 0 }} />

        <div>
          <Typography.Title level={5} style={{ marginBottom: 8 }}>
            {t('promotion.serviceDay.weekly.title')}
          </Typography.Title>
          {item.weeklyDays.length ? (
            <Table
              size="small"
              rowKey={(rule) => rule.id ?? `${rule.weekday}`}
              pagination={false}
              columns={[
                {
                  title: t('promotion.serviceDay.weekly.name'),
                  dataIndex: 'name',
                  key: 'name',
                  render: (value: string) => value || '--'
                },
                {
                  title: t('promotion.serviceDay.weekly.weekday'),
                  dataIndex: 'weekday',
                  key: 'weekday',
                  render: (value: number) => weekdayLabel(value)
                },
                {
                  title: t('promotion.serviceDay.weekly.price'),
                  dataIndex: 'price',
                  key: 'price',
                  render: (value: number) => formatPrice(value)
                }
              ]}
              dataSource={item.weeklyDays}
            />
          ) : (
            <Typography.Text type="secondary">{t('empty')}</Typography.Text>
          )}
        </div>

        <Divider style={{ margin: 0 }} />

        <div>
          <Typography.Title level={5} style={{ marginBottom: 8 }}>
            {t('promotion.serviceDay.specific.title')}
          </Typography.Title>
          {item.specificDates.length ? (
            <Table
              size="small"
              rowKey={(rule) => rule.id ?? rule.date}
              pagination={false}
              columns={[
                {
                  title: t('promotion.serviceDay.specific.name'),
                  dataIndex: 'name',
                  key: 'name',
                  render: (value: string) => value || '--'
                },
                {
                  title: t('promotion.serviceDay.specific.date'),
                  dataIndex: 'date',
                  key: 'date',
                  render: (value: string) => formatDate(value)
                },
                {
                  title: t('promotion.serviceDay.specific.price'),
                  dataIndex: 'price',
                  key: 'price',
                  render: (value: number) => formatPrice(value)
                }
              ]}
              dataSource={item.specificDates}
            />
          ) : (
            <Typography.Text type="secondary">{t('empty')}</Typography.Text>
          )}
        </div>

        <Divider style={{ margin: 0 }} />

        <div>
          <Typography.Title level={5} style={{ marginBottom: 8 }}>
            {t('promotion.serviceDay.timePeriod.title')}
          </Typography.Title>
          {item.timeRanges.length ? (
            <Table
              size="small"
              rowKey={(range) => range.id ?? range.name}
              pagination={false}
              columns={[
                {
                  title: t('promotion.serviceDay.timePeriod.name'),
                  dataIndex: 'name',
                  key: 'name',
                  render: (value: string) => value || '--'
                },
                {
                  title: t('promotion.serviceDay.timePeriod.scope'),
                  dataIndex: 'applicableScope',
                  key: 'applicableScope',
                  render: (value: string) => value || '--'
                },
                {
                  title: t('promotion.serviceDay.timePeriod.schedule'),
                  dataIndex: 'applicableDays',
                  key: 'applicableDays',
                  render: (value: string) => value || '--'
                },
                {
                  title: `${t('promotion.serviceDay.timePeriod.startTime')} ~ ${t(
                    'promotion.serviceDay.timePeriod.endTime'
                  )}`,
                  key: 'timeRange',
                  render: (_, range) => {
                    const start =
                      normalizeThirtyHourString(range.startTime) ?? '--'
                    const end = normalizeThirtyHourString(range.endTime) ?? '--'
                    return `${start} ~ ${end}`
                  }
                },
                {
                  title: t('promotion.serviceDay.timePeriod.price'),
                  dataIndex: 'price',
                  key: 'price',
                  render: (value: number) => formatPrice(value)
                },
                {
                  title: t('promotion.serviceDay.timePeriod.remark'),
                  dataIndex: 'remark',
                  key: 'remark',
                  render: (value: string) => value || '--'
                }
              ]}
              dataSource={item.timeRanges}
            />
          ) : (
            <Typography.Text type="secondary">{t('empty')}</Typography.Text>
          )}
        </div>
      </Space>
    ),
    [formatDate, formatPrice, t, weekdayLabel]
  )

  const columns: TableColumnsType<PromotionListItem> = useMemo(
    () => [
      {
        title: t('promotion.table.name'),
        dataIndex: 'name',
        width: 220
      },
      {
        title: t('promotion.table.monthlyRules'),
        key: 'monthlyDays',
        render: (_, record) =>
          summarizeRules(record.monthlyDays || [], (item) => {
            const suffix = t('promotion.serviceDay.unit.daySuffix', {
              defaultValue: '日'
            })
            return `${item.name || '--'} (${item.dayOfMonth}${suffix})`
          })
      },
      {
        title: t('promotion.table.weeklyRules'),
        key: 'weeklyDays',
        render: (_, record) =>
          summarizeRules(record.weeklyDays || [], (item) => {
            const weekday = weekdayLabel(item.weekday)
            return `${item.name || '--'} (${weekday})`
          })
      },
      {
        title: t('promotion.table.specificRules'),
        key: 'specificDates',
        render: (_, record) =>
          summarizeRules(record.specificDates || [], (item) => {
            const date = formatDate(item.date)
            return `${item.name || '--'} (${date})`
          })
      },
      {
        title: t('promotion.table.timePeriodRules'),
        key: 'timeRanges',
        render: (_, record) => summarizeTimeRanges(record.timeRanges)
      },
      {
        title: t('promotion.table.updatedAt'),
        dataIndex: 'updateTime',
        width: 180,
        render: (value?: string) => formatDateTime(value)
      },
      {
        title: common('table.action'),
        key: 'action',
        width: 160,
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                router.push(
                  processPath({
                    name: 'promotionDetail',
                    query: {
                      cinemaId: record.cinemaId,
                      promotionId: record.id,
                      cinemaName: encodeURIComponent(cinemaName || '')
                    }
                  })
                )
              }}
            >
              {t('promotion.serviceDay.action.configure')}
            </Button>
            <Button size="small" danger onClick={() => handleRemove(record.id)}>
              {common('button.remove')}
            </Button>
          </Space>
        )
      }
    ],
    [
      cinemaName,
      common,
      formatDateTime,
      handleRemove,
      router,
      summarizeRules,
      summarizeTimeRanges,
      t
    ]
  )

  if (!cinemaId) {
    return null
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <Space direction="vertical" size={4}>
            <Title level={3} style={{ margin: 0 }}>
              {t('promotion.title')}
            </Title>
            <Typography.Text type="secondary">
              {cinemaName || t('promotion.table.remarkEmpty')}
            </Typography.Text>
          </Space>
          <CheckPermission code="promotion.save">
            <Button
              type="primary"
              onClick={() => {
                router.push(
                  processPath({
                    name: 'promotionDetail',
                    query: {
                      cinemaId,
                      cinemaName: cinemaNameParam || ''
                    }
                  })
                )
              }}
            >
              {common('button.add')}
            </Button>
          </CheckPermission>
        </div>
      </header>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        expandable={{
          expandedRowRender
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (current, size) => {
            setPage(current)
            setPageSize(size)
            fetchPromotions(current, size)
          }
        }}
        locale={{ emptyText: t('empty') }}
      />
    </section>
  )
}
