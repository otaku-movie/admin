'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Switch, Modal, Space, Table, Typography, message } from 'antd'
import type { TableColumnsType } from 'antd'
import { HolderOutlined } from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import { useRouter, useSearchParams } from 'next/navigation'
import { processPath } from '@/config/router'
import dayjs from 'dayjs'
import {
  getPromotionList,
  type PromotionListItem,
  type FlattenedRuleItem
} from '@/api/request/promotion'
import { normalizeThirtyHourString } from '@/utils/thirtyHourTime'
import { CheckPermission } from '@/components/checkPermission'

const { Title } = Typography

function rowId(record: FlattenedRuleItem, index: number) {
  return record.id != null ? `${record.ruleType}-${record.id}` : `row-${record.ruleType}-${index}`
}

/* eslint-disable react/prop-types -- Ant Table row injects style/children */
function SortableTableRow(props: React.HTMLAttributes<HTMLTableRowElement> & { 'data-row-key'?: string }) {
  const id = props['data-row-key'] ?? ''
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const { style, ...restProps } = props
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
      {restProps.children != null && Array.isArray(restProps.children)
        ? restProps.children.map((child, i) =>
            i === 0 && React.isValidElement(child) ? (
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
        : restProps.children}
    </tr>
  )
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

/** 将活动列表数据展平为规则列表 */
const flattenPromotionToRules = (
  promotions: PromotionListItem[],
  t: (key: string, options?: Record<string, string | number>) => string
): FlattenedRuleItem[] => {
  const rules: FlattenedRuleItem[] = []

  promotions.forEach((promotion) => {
    // 月度规则
    promotion.monthlyDays.forEach((rule) => {
      rules.push({
        id: rule.id,
        ruleType: 'monthly',
        name: rule.name,
        effectContent: t('promotion.serviceDay.monthly.effectLabel', {
          day: rule.dayOfMonth
        }),
        price: rule.price,
        enabled: rule.enabled ?? true,
        priority: rule.priority ?? 0,
        originalData: rule
      })
    })

    // 周度规则
    promotion.weeklyDays.forEach((rule) => {
      const weekdayKey = WEEKDAY_NUMBER_TO_KEY[rule.weekday]
      const weekdayLabel = weekdayKey
        ? t(`promotion.serviceDay.weekdays.${weekdayKey}`)
        : '--'
      rules.push({
        id: rule.id,
        ruleType: 'weekly',
        name: rule.name,
        effectContent: t('promotion.serviceDay.weekly.effectLabel', {
          weekday: weekdayLabel
        }),
        price: rule.price,
        enabled: rule.enabled ?? true,
        priority: rule.priority ?? 0,
        originalData: rule
      })
    })

    // 特定日期规则
    promotion.specificDates.forEach((rule) => {
      const d = dayjs(rule.date)
      rules.push({
        id: rule.id,
        ruleType: 'specificDate',
        name: rule.name,
        effectContent: t('promotion.serviceDay.specific.effectLabel', {
          year: d.year(),
          month: d.month() + 1,
          day: d.date()
        }),
        price: rule.price,
        enabled: rule.enabled ?? true,
        priority: rule.priority ?? 0,
        originalData: rule
      })
    })

    // 时段规则
    promotion.timeRanges.forEach((rule) => {
      const start = normalizeThirtyHourString(rule.startTime) ?? rule.startTime
      const end = normalizeThirtyHourString(rule.endTime) ?? rule.endTime

      const scopeKey = rule.applicableScope || ''
      const isDailyScope = scopeKey === 'daily'

      // 基础范围文案：每天 / 每周末 / 工作日 等
      let scopeLabel = ''
      if (scopeKey) {
        if (isDailyScope) {
          scopeLabel = t('promotion.serviceDay.timePeriod.effectDailyPrefix')
        } else {
          scopeLabel =
            t(`promotion.serviceDay.timePeriod.scopeOptions.${scopeKey}`) ||
            scopeKey
        }
      }

      // 如果有具体的适用日期描述（例如：周一/周三），拼在后面
      if (rule.applicableDays) {
        scopeLabel = scopeLabel
          ? `${scopeLabel} (${rule.applicableDays})`
          : rule.applicableDays
      }

      const effectContent = scopeLabel
        ? `${scopeLabel} ${start}-${end}`
        : `${start}-${end}`

      rules.push({
        id: rule.id,
        ruleType: 'timeRange',
        name: rule.name,
        effectContent,
        price: rule.price,
        enabled: rule.enabled ?? true,
        priority: rule.priority ?? 0,
        originalData: rule
      })
    })
  })

  return rules
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
  const [dataSource, setDataSource] = useState<FlattenedRuleItem[]>([])
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
        // 将活动列表展平为规则列表
        const flattenedRules = flattenPromotionToRules(res.list || [], t)
        setDataSource(flattenedRules)
        setPage(res.page || nextPage)
        setPageSize(res.pageSize || nextPageSize)
        setTotal(flattenedRules.length)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    },
    [cinemaId, pageSize, t]
  )

  useEffect(() => {
    if (!cinemaId) return
    fetchPromotions(1, pageSize)
  }, [cinemaId, fetchPromotions, pageSize])

  const handleRemove = useCallback(
    (rule: FlattenedRuleItem) => {
      Modal.confirm({
        title: t('promotion.message.deleteConfirm'),
        okText: common('button.remove'),
        cancelText: common('button.cancel'),
        okButtonProps: { danger: true },
        onOk: async () => {
          if (!rule.id) return
          // TODO: 调用删除单条规则的 API
          // await removeRule(rule.ruleType, rule.id)
          message.success(t('promotion.message.deleteSuccess'))
          fetchPromotions(page, pageSize)
        }
      })
    },
    [common, fetchPromotions, page, pageSize, t]
  )

  const handleToggleEnabled = useCallback(
    async (rule: FlattenedRuleItem, enabled: boolean) => {
      if (!rule.id) return
      try {
        // TODO: 调用更新规则启用状态的 API
        message.success(enabled ? '规则已启用' : '规则已禁用')
        fetchPromotions(page, pageSize)
      } catch (error) {
        console.error(error)
        message.error('更新失败')
      }
    },
    [fetchPromotions, page, pageSize]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over == null || active.id === over.id) return
      setDataSource((prev) => {
        const from = prev.findIndex((r, i) => rowId(r, i) === active.id)
        const to = prev.findIndex((r, i) => rowId(r, i) === over.id)
        if (from === -1 || to === -1) return prev
        const next = arrayMove(prev, from, to)
        // TODO: 调用后端接口保存新顺序（按 priority 更新）
        return next
      })
    },
    []
  )

  const sortableIds = useMemo(
    () => dataSource.map((r, i) => rowId(r, i)),
    [dataSource]
  )

  const dndSensors = useSensors(
    // 使用 PointerSensor，移除较大的激活距离，提升拖拽敏感度
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const formatPrice = useCallback(
    (value?: number) =>
      value !== undefined && value !== null
        ? `${value.toLocaleString()} ${common('unit.jpy')}`
        : '--',
    [common]
  )

  const columns: TableColumnsType<FlattenedRuleItem> = useMemo(
    () => [
      {
        title: '',
        key: 'drag',
        width: 48,
        align: 'center',
        render: () => null
      },
      {
        title: t('promotion.table.priority'),
        key: 'order',
        width: 80,
        align: 'center',
        render: (_: unknown, __: FlattenedRuleItem, index: number) => index + 1
      },
      {
        title: t('promotion.table.ruleType'),
        dataIndex: 'ruleType',
        width: 140,
        render: (value: FlattenedRuleItem['ruleType']) =>
          t(`promotion.ruleTypes.${value}`)
      },
      {
        title: t('promotion.table.ruleName'),
        dataIndex: 'name',
        width: 200,
        render: (value: string) => value || '--'
      },
      {
        title: t('promotion.table.effectContent'),
        dataIndex: 'effectContent',
        width: 220,
        render: (value: string) => value || '--'
      },
      {
        title: t('promotion.table.price'),
        dataIndex: 'price',
        width: 140,
        render: (value: number) => formatPrice(value)
      },
      {
        title: t('promotion.table.enabled'),
        dataIndex: 'enabled',
        width: 100,
        align: 'center',
        render: (value: boolean, record: FlattenedRuleItem) => (
          <Switch
            checked={value}
            onChange={(checked) => handleToggleEnabled(record, checked)}
          />
        )
      },
      {
        title: common('table.action'),
        key: 'action',
        width: 160,
        align: 'center',
        render: (_: unknown, record: FlattenedRuleItem) => (
          <Space>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                router.push(
                  processPath({
                    name: 'promotionDetail',
                    query: {
                      cinemaId,
                      ruleType: record.ruleType,
                      ruleId: record.id,
                      cinemaName: encodeURIComponent(cinemaName || '')
                    }
                  })
                )
              }}
            >
              {t('promotion.serviceDay.action.configure')}
            </Button>
            <Button size="small" danger onClick={() => handleRemove(record)}>
              {common('button.remove')}
            </Button>
          </Space>
        )
      }
    ],
    [
      cinemaId,
      cinemaName,
      common,
      formatPrice,
      handleRemove,
      handleToggleEnabled,
      router,
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
      <DndContext
        sensors={dndSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <Table
            rowKey={(record, index) => rowId(record, index ?? 0)}
            loading={loading}
            columns={columns}
            dataSource={dataSource}
            components={{
              body: {
                row: SortableTableRow
              }
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
            scroll={{ x: 1200 }}
          />
        </SortableContext>
      </DndContext>
    </section>
  )
}
