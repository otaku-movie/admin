'use client'

import React, { useMemo } from 'react'
import {
  Button,
  Image,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import {
  usePricingStrategyStore,
  type PresaleTicket,
  type PresaleSpecification
} from '@/store/usePricingStrategyStore'
import { useRouter } from 'next/navigation'
import { processPath } from '@/config/router'

const { Title } = Typography

export default function PresaleTicketsPage({ params: { lng } }: PageProps) {
  const { t } = useTranslation(
    lng as 'zh-CN' | 'ja' | 'en-US',
    'pricingStrategy'
  )
  const { t: common } = useTranslation(
    lng as 'zh-CN' | 'ja' | 'en-US',
    'common'
  )
  const router = useRouter()

  const presales = usePricingStrategyStore((state) => state.presales)
  const removePresale = usePricingStrategyStore((state) => state.removePresale)

  const formatPrice = (value?: number) => {
    if (value === undefined || value === null) return '--'
    return `${Number(value).toLocaleString()} ${common('unit.jpy')}`
  }

  const formatSaleStatus = (ticket: PresaleTicket) => {
    const now = dayjs()
    const launch = ticket.launchTime ? dayjs(ticket.launchTime) : null
    const end = ticket.endTime ? dayjs(ticket.endTime) : null
    if (launch && now.isBefore(launch)) {
      return {
        key: 'upcoming',
        label: t('presale.table.status.upcoming'),
        color: 'gold'
      } as const
    }
    if (end && now.isAfter(end)) {
      return {
        key: 'ended',
        label: t('presale.table.status.ended'),
        color: 'default' as const
      }
    }
    return {
      key: 'selling',
      label: t('presale.table.status.selling'),
      color: 'green' as const
    }
  }

  const formatDateRange = (
    start?: string,
    end?: string,
    withSeconds = false
  ) => {
    if (!start && !end) return '--'
    const format = withSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm'
    const startText = start ? dayjs(start).format(format) : '—'
    const endText = end ? dayjs(end).format(format) : '—'
    return `${startText} ~ ${endText}`
  }

  const handleAdd = () => {
    router.push(processPath('presaleDetail') as string)
  }
  const handleEdit = (id: number) => {
    router.push(processPath('presaleDetail', { id }) as string)
  }

  const { columns, expandedRowRender } = useMemo(() => {
    const renderDeliveryTags = (record: PresaleTicket) => {
      const types = new Set<string>()
      record.specifications?.forEach((spec) => {
        if (spec.deliveryType) types.add(spec.deliveryType)
      })
      if (types.size === 0 && record.deliveryType) {
        types.add(record.deliveryType)
      }
      if (types.size === 0) return '--'
      return (
        <Space size={[4, 4]} wrap>
          {[...types].map((type) => (
            <Tag key={type} color={type === 'virtual' ? 'cyan' : 'geekblue'}>
              {t(`presale.deliveryType.${type}`)}
            </Tag>
          ))}
        </Space>
      )
    }

    const renderBonus = (record: PresaleTicket) => {
      if (!record.bonusTitle && !record.bonusDescription) {
        return '--'
      }
      return (
        <Space direction="vertical" size={4}>
          {record.bonusTitle && <span>{record.bonusTitle}</span>}
          {record.bonusType && (
            <Tag color="magenta">
              {t(`presale.bonusType.${record.bonusType}`)}
            </Tag>
          )}
          {record.bonusDelivery && (
            <Typography.Text type="secondary">
              {t('presale.table.bonusDelivery', {
                delivery: t(`presale.deliveryType.${record.bonusDelivery}`)
              })}
            </Typography.Text>
          )}
          {record.bonusDescription && (
            <Typography.Text type="secondary">
              {record.bonusDescription}
            </Typography.Text>
          )}
        </Space>
      )
    }

    const expandedRowRender = (record: PresaleTicket) => {
      const skuColumns: TableColumnsType<PresaleSpecification> = [
        {
          title: t('presale.table.skuColumns.name'),
          dataIndex: 'name',
          render: (value: string | undefined, sku) => (
            <Space direction="vertical" size={2}>
              <Typography.Text strong>
                {value || t('presale.table.skuColumns.untitled')}
              </Typography.Text>
              <Space size={[4, 4]} wrap>
                {sku.skuCode && (
                  <Tag color="blue">
                    {t('presale.specifications.sku', { sku: sku.skuCode })}
                  </Tag>
                )}
                {sku.ticketType && (
                  <Tag color="geekblue">
                    {t(`presale.mubitikeType.${sku.ticketType}`)}
                  </Tag>
                )}
                {sku.deliveryType && (
                  <Tag
                    color={sku.deliveryType === 'virtual' ? 'cyan' : 'volcano'}
                  >
                    {t(`presale.deliveryType.${sku.deliveryType}`)}
                  </Tag>
                )}
                {sku.audienceType && (
                  <Tag color="purple">
                    {t(`presale.specifications.audience.${sku.audienceType}`)}
                  </Tag>
                )}
              </Space>
            </Space>
          )
        },
        {
          title: t('presale.table.skuColumns.price'),
          dataIndex: 'price',
          render: (value?: number) => formatPrice(value)
        },
        {
          title: t('presale.table.skuColumns.stock'),
          dataIndex: 'stock',
          render: (value?: number) => (value === undefined ? '--' : value)
        },
        {
          title: t('presale.table.skuColumns.points'),
          dataIndex: 'points',
          render: (value?: number) =>
            value === undefined
              ? '--'
              : t('presale.specifications.points', { points: value })
        },
        {
          title: t('presale.table.skuColumns.shipDays'),
          dataIndex: 'shipDays',
          render: (value?: number) =>
            value === undefined
              ? '--'
              : t('presale.specifications.shipDays', { days: value })
        },
        {
          title: t('presale.table.skuColumns.image'),
          dataIndex: 'image',
          render: (value?: string) =>
            value ? <Image width={60} src={value} alt={value} /> : '--'
        }
      ]

      return (
        <Table
          size="small"
          rowKey={(sku) => sku.id ?? `${sku.skuCode}-${sku.ticketType}`}
          columns={skuColumns}
          dataSource={record.specifications ?? []}
          pagination={false}
        />
      )
    }

    const columns: TableColumnsType<PresaleTicket> = [
      {
        title: t('presale.table.product'),
        key: 'product',
        fixed: 'left' as const,
        render: (_: unknown, record: PresaleTicket) => {
          const gallery = record.gallery ?? []
          const secondaryImages = gallery.slice(1, 4)
          const status = formatSaleStatus(record)
          return (
            <Space align="start" size={16}>
              {record.cover ? (
                <Image
                  width={64}
                  height={96}
                  src={record.cover}
                  alt={record.title}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 96,
                    background: '#f5f5f5',
                    borderRadius: 8
                  }}
                />
              )}
              <Space direction="vertical" size={6}>
                <Typography.Text strong>{record.title || '--'}</Typography.Text>
                <Typography.Text type="secondary">
                  {record.code}
                </Typography.Text>
                <Space size={[4, 4]} wrap>
                  <Tag color="blue">
                    {t(`presale.mubitikeType.${record.mubitikeType}`)}
                  </Tag>
                  <Tag color={status.color}>{status.label}</Tag>
                  {gallery.length > 1 && (
                    <Tag color="volcano">
                      {t('presale.table.galleryCount', {
                        count: gallery.length
                      })}
                    </Tag>
                  )}
                </Space>
                {secondaryImages.length > 0 && (
                  <Space size={6} wrap>
                    {secondaryImages.map((url, index) => (
                      <Image
                        key={`${record.id}-thumb-${index}`}
                        src={url}
                        alt={`${record.title}-${index + 2}`}
                        width={48}
                        height={68}
                        style={{ objectFit: 'cover', borderRadius: 6 }}
                      />
                    ))}
                    {gallery.length > 4 && (
                      <Tag>
                        {t('presale.table.galleryMore', {
                          count: gallery.length - 4
                        })}
                      </Tag>
                    )}
                  </Space>
                )}
              </Space>
            </Space>
          )
        }
      },
      {
        title: t('presale.table.salePeriod'),
        key: 'salePeriod',
        render: (_: unknown, record: PresaleTicket) =>
          formatDateRange(record.launchTime, record.endTime, true)
      },
      {
        title: t('presale.table.usageWindow'),
        key: 'usageWindow',
        render: (_: unknown, record: PresaleTicket) =>
          formatDateRange(record.usageStart, record.usageEnd, true)
      },
      {
        title: t('presale.table.deliveryType'),
        key: 'deliveryType',
        render: (_: unknown, record: PresaleTicket) =>
          renderDeliveryTags(record)
      },
      {
        title: t('presale.table.quantity'),
        dataIndex: 'totalQuantity'
      },
      {
        title: t('presale.table.perUserLimit'),
        dataIndex: 'perUserLimit'
      },
      {
        title: t('presale.table.movies'),
        dataIndex: 'movieNames',
        render: (value?: string[]) => value?.join('、') || '--'
      },
      {
        title: t('presale.table.benefits'),
        dataIndex: 'benefits',
        render: (value?: string[]) =>
          value && value.length > 0 ? (
            <Space direction="vertical" size={4}>
              {value.map((item, index) => (
                <span key={index}>{item}</span>
              ))}
            </Space>
          ) : (
            '--'
          )
      },
      {
        title: t('presale.table.bonus'),
        key: 'bonus',
        render: (_: unknown, record: PresaleTicket) => renderBonus(record)
      },
      {
        title: t('presale.table.pickupNotes'),
        dataIndex: 'pickupNotes',
        render: (value?: string) => value || '--'
      },
      {
        title: t('presale.table.description'),
        dataIndex: 'description',
        render: (value?: string) => value || '--'
      },
      {
        title: t('presale.table.remark'),
        dataIndex: 'remark',
        render: (value?: string) => value || '--'
      },
      {
        title: common('table.action'),
        key: 'action',
        width: 150,
        fixed: 'right' as const,
        render: (_: unknown, record: PresaleTicket) => (
          <Space>
            <Button
              size="small"
              type="primary"
              onClick={() => handleEdit(record.id)}
            >
              {common('button.edit')}
            </Button>
            <Button
              size="small"
              danger
              onClick={() => {
                Modal.confirm({
                  title: common('button.remove'),
                  content: t('presale.message.deleteConfirm'),
                  onOk: () => {
                    removePresale(record.id)
                    message.success(t('presale.message.deleteSuccess'))
                  }
                })
              }}
            >
              {common('button.remove')}
            </Button>
          </Space>
        )
      }
    ]

    return { columns, expandedRowRender }
  }, [common, formatDateRange, formatPrice, formatSaleStatus, removePresale, t])

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <Title level={3} style={{ marginBottom: 12 }}>
          {t('tabs.presale')}
        </Title>
      </header>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>
          {common('button.add')}
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={presales}
        pagination={false}
        size="middle"
        scroll={{ x: 'max-content', y: 520 }}
        style={{ background: '#fff', borderRadius: 8 }}
        locale={{ emptyText: t('empty') }}
        expandable={{ expandedRowRender }}
      />
    </section>
  )
}
