'use client'

import React, { useCallback, useMemo, useState } from 'react'
import {
  Button,
  Flex,
  Input,
  Modal,
  Select,
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
import type { PresaleTicket, PresaleSpecification } from '@/store/usePricingStrategyStore'
import { useRouter } from 'next/navigation'
import { processPath } from '@/config/router'
import { getPresaleList, removePresaleApi } from '@/api/request/presale'
import { showTotal } from '@/utils/pagination'
import { CustomAntImage } from '@/components/CustomAntImage'
import { MovieModal } from '@/dialog/movieModal'
import type { Movie } from '@/type/api'
import { Query, QueryItem } from '@/components/query'

const { Title } = Typography

interface PresaleFilters {
  title?: string
  movieId?: number
  mubitikeType?: number
}

const MUBITIKE_TYPE_OPTIONS = [
  { value: 1, key: 'online' },
  { value: 2, key: 'card' },
] as const

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

  const [presales, setPresales] = useState<PresaleTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<PresaleFilters>({})
  const [movieModalOpen, setMovieModalOpen] = useState(false)
  const [filterMovie, setFilterMovie] = useState<{ id: number; name: string } | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const fetchList = useCallback(
    async (page = 1, pageSize = 10, activeFilters: PresaleFilters = filters) => {
      setLoading(true)
      try {
        const res = await getPresaleList({
          page,
          pageSize,
          title: activeFilters.title?.trim() || undefined,
          movieId: activeFilters.movieId,
          mubitikeType: activeFilters.mubitikeType
        })
        setPresales(res.list)
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize,
          total: res.total
        }))
      } catch {
        setPresales([])
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  React.useEffect(() => {
    fetchList(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const searchWithFilters = (next: PresaleFilters) => {
    setFilters(next)
    fetchList(1, pagination.pageSize, next)
  }

  const handleSearch = () => {
    fetchList(1, pagination.pageSize, filters)
  }

  const handleReset = () => {
    setFilterMovie(null)
    setFilters({})
    fetchList(1, pagination.pageSize, {})
  }

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

    return (
      <Space direction="vertical" size={4} align="center">
        <Typography.Text>{startText}</Typography.Text>
        <Typography.Text>~</Typography.Text>
        <Typography.Text>{endText}</Typography.Text>
      </Space>
    )
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

    const expandedRowRender = (record: PresaleTicket) => {
      const skuColumns: TableColumnsType<PresaleSpecification> = [
        {
          title: t('presale.table.skuColumns.image'),
          dataIndex: 'image',
          width: 110,
          render: (_: unknown, sku) => {
            const src = sku.images?.[0]
            return src ? (
              <CustomAntImage
                width={84}
                height={126}
                src={src}
                alt={sku.name ?? ''}
                style={{ objectFit: 'cover', borderRadius: 6 }}
              />
            ) : (
              '--'
            )
          }
        },
        {
          title: t('presale.table.skuColumns.name'),
          dataIndex: 'name',
          width: 220,
          render: (value: string | undefined, sku) => (
            <Space direction="vertical" size={4}>
              <Typography.Text strong>
                {value || t('presale.table.skuColumns.untitled')}
              </Typography.Text>
              <Space size={[4, 4]} wrap>
                {sku.ticketType && (
                  <Tag color="geekblue">
                    {t(`presale.mubitikeType.${sku.ticketType}`)}
                  </Tag>
                )}
              </Space>
            </Space>
          )
        },
        {
          title: t('presale.table.skuColumns.price'),
          dataIndex: 'price',
          width: 120,
          render: (_: unknown, sku) => {
            const items = sku.priceItems
            if (items?.length) {
              return (
                <Space direction="vertical" size={2}>
                  {items.map((item, i) => (
                    <Typography.Text key={i}>
                      {item.label}: {formatPrice(item.price)}
                    </Typography.Text>
                  ))}
                </Space>
              )
            }
            return formatPrice(
              sku.price ?? (sku.priceItems?.[0] ? sku.priceItems[0].price : undefined)
            )
          }
        },
        {
          title: t('presale.table.skuColumns.stock'),
          dataIndex: 'stock',
          width: 80,
          align: 'center',
          render: (value?: number) => (value === undefined ? '--' : value)
        },
        {
          title: t('presale.table.skuColumns.points'),
          dataIndex: 'points',
          width: 80,
          align: 'center',
          render: (value?: number) =>
            value != null && value > 0 ? value : '--'
        },
        {
          title: t('presale.table.skuColumns.shipDays'),
          dataIndex: 'shipDays',
          width: 100,
          align: 'center',
          render: (value?: number) => {
            if (value == null) return '--'
            return t('presale.specifications.shipDays', { days: value })
          }
        },
        {
          title: t('presale.table.bonus'),
          key: 'bonus',
          width: 260,
          render: (_: unknown, sku: PresaleSpecification) => {
            const bonusImages = sku.bonusImages?.filter(Boolean) ?? []
            if (
              !sku.bonusIncluded &&
              !sku.bonusTitle &&
              !sku.bonusDescription &&
              bonusImages.length === 0
            ) {
              return '--'
            }
            return (
              <Space direction="vertical" size={6} style={{ maxWidth: 260 }}>
                {bonusImages.length > 0 && (
                  <Space size={6} wrap>
                    {bonusImages.map((src, i) => (
                      <CustomAntImage
                        key={`${src}-${i}`}
                        width={48}
                        height={72}
                        src={src}
                        alt={sku.bonusTitle ?? ''}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                    ))}
                  </Space>
                )}
                {sku.bonusIncluded !== false && (sku.bonusTitle || sku.bonusDescription) && (
                  <>
                    {sku.bonusTitle && (
                      <Typography.Text ellipsis={{ tooltip: sku.bonusTitle }}>
                        {sku.bonusTitle}
                      </Typography.Text>
                    )}
                    {sku.bonusQuantity != null && (
                      <Tag color="magenta">×{sku.bonusQuantity}</Tag>
                    )}
                    {sku.bonusDescription && (
                      <Typography.Text
                        type="secondary"
                        ellipsis={{ tooltip: sku.bonusDescription }}
                        style={{ display: 'block', fontSize: 12 }}
                      >
                        {sku.bonusDescription}
                      </Typography.Text>
                    )}
                  </>
                )}
                {sku.bonusIncluded === false && (
                  <Typography.Text type="secondary">
                    {t('presale.form.specifications.bonus.no')}
                  </Typography.Text>
                )}
              </Space>
            )
          }
        }
      ]

      const specs = record.specifications ?? []
      if (specs.length === 0) {
        return (
          <div style={{ marginLeft: 24, padding: '12px 16px', color: '#8c8c8c' }}>
            <Typography.Text type="secondary">
              {t('presale.table.noSpecifications')}
            </Typography.Text>
          </div>
        )
      }

      return (
        <div
          style={{
            marginLeft: 24,
            padding: '12px 16px',
            background: '#fafafa',
            borderRadius: 8,
            border: '1px solid #f0f0f0'
          }}
        >
          <Table
            size="small"
            rowKey={(sku) => String(sku.id ?? sku.skuCode ?? Math.random())}
            columns={skuColumns}
            dataSource={specs}
            pagination={false}
            showHeader
          />
        </div>
      )
    }

    const columns: TableColumnsType<PresaleTicket> = [
      {
        title: t('presale.table.product'),
        key: 'product',
        render: (_: unknown, record: PresaleTicket) => {
          const status = formatSaleStatus(record)
          return (
            <Space align="start" size={16}>
              {record.cover ? (
                <CustomAntImage
                  width={96}
                  height={144}
                  src={record.cover}
                  alt={record.title}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 144,
                    background: '#f5f5f5',
                    borderRadius: 8
                  }}
                />
              )}
              <Space direction="vertical" size={6} style={{ maxWidth: 280 }}>
                <Typography.Text
                  strong
                  ellipsis={{ tooltip: record.title }}
                  style={{ maxWidth: 280 }}
                >
                  {record.title || '--'}
                </Typography.Text>
                <Space size={[4, 4]} wrap>
                  <Tag color="blue">
                    {t(`presale.mubitikeType.${record.mubitikeType}`)}
                  </Tag>
                  <Tag color={status.color}>{status.label}</Tag>
                </Space>
              </Space>
            </Space>
          )
        }
      },
      {
        title: t('presale.table.salePeriod'),
        key: 'salePeriod',
        width: 150,
        render: (_: unknown, record: PresaleTicket) =>
          formatDateRange(record.launchTime, record.endTime, true)
      },
      {
        title: t('presale.table.usageWindow'),
        key: 'usageWindow',
        width: 150,
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
        width: 150,
        dataIndex: 'totalQuantity'
      },
      {
        title: t('presale.table.perUserLimit'),
        width: 150,
        dataIndex: 'perUserLimit',
        render: (value?: number) =>
          value && value > 0 ? value : t('presale.table.perUserLimitUnlimited')
      },
      {
        title: t('presale.table.movies'),
        width: 200,
        dataIndex: 'movieNames',
        render: (value?: string[]) => value?.join('、') || '--'
      },
      {
        title: common('table.action'),
        key: 'action',
        width: 150,
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
                  onOk: async () => {
                    try {
                      await removePresaleApi(record.id)
                      message.success(t('presale.message.deleteSuccess'))
                      await fetchList(pagination.current, pagination.pageSize)
                    } catch {
                      // error already shown by http interceptor
                    }
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
  }, [common, fetchList, formatDateRange, formatPrice, formatSaleStatus, pagination.current, pagination.pageSize, t])

  return (
    <section style={{ padding: '0 24px 24px', maxWidth: 1600, margin: '0 auto' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          {t('tabs.presale')}
        </Title>
        <Button type="primary" onClick={handleAdd}>
          {common('button.add')}
        </Button>
      </Flex>
      <Flex vertical gap={24}>
      <Query
        initialValues={{}}
        showClear
        onSearch={handleSearch}
        onClear={handleReset}
      >
        <QueryItem label={t('presale.filter.title')}>
          <Input
            value={filters.title}
            allowClear
            placeholder={t('presale.filter.titlePlaceholder')}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                title: e.target.value
              }))
            }}
          />
        </QueryItem>
        <QueryItem label={t('presale.filter.movie')}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              readOnly
              value={filterMovie?.name ?? ''}
              placeholder={t('presale.filter.moviePlaceholder')}
              allowClear
              onChange={(e) => {
                if (!e.target.value) {
                  setFilterMovie(null)
                  const next: PresaleFilters = { ...filters }
                  delete next.movieId
                  searchWithFilters(next)
                }
              }}
            />
            <Button onClick={() => setMovieModalOpen(true)}>
              {t('presale.filter.select')}
            </Button>
          </Space.Compact>
        </QueryItem>
        <QueryItem label={t('presale.filter.mubitikeType')}>
          <Select
            value={filters.mubitikeType}
            allowClear
            placeholder={t('presale.filter.mubitikeTypePlaceholder')}
            onChange={(value) => {
              const next: PresaleFilters = {
                ...filters,
                mubitikeType: value,
                movieId: filterMovie?.id
              }
              searchWithFilters(next)
            }}
            options={MUBITIKE_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: t(`presale.mubitikeType.${o.key}`)
            }))}
          />
        </QueryItem>
      </Query>
      <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={presales}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal,
            position: ['bottomCenter'],
            onChange: (page, pageSize) => fetchList(page, pageSize ?? 10)
          }}
          size="middle"
          locale={{ emptyText: t('empty') }}
          expandable={{ expandedRowRender }}
        />
      </Flex>
      <MovieModal
        show={movieModalOpen}
        data={{}}
        initialMovieId={filterMovie?.id}
        onCancel={() => setMovieModalOpen(false)}
        onConfirm={(movie: Movie) => {
          if (!movie?.id) return
          setMovieModalOpen(false)
          const movieName = movie.name || movie.originalName || `${movie.id}`
          setFilterMovie({
            id: movie.id,
            name: movieName
          })
          searchWithFilters({
            ...filters,
            movieId: movie.id
          })
        }}
      />
    </section>
  )
}
