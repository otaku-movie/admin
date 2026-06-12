'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  message,
  Select,
  Cascader,
  Form,
  Space,
  Switch,
  Transfer,
  Badge,
  Spin
} from 'antd'
import type { TableColumnsType } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageProps } from '@/app/[lng]/layout'
import { CheckPermission } from '@/components/checkPermission'
import { Query, QueryItem } from '@/components/query'
import { showTotal } from '@/utils/pagination'
import { formatNumber } from '@/utils'
import {
  getAddressTreeList,
  type AddressTreeListResponse
} from '@/api/request/cinema'

interface StockRow {
  id: number
  cinemaId: number
  cinemaName?: string
  benefitId: number
  benefitName?: string
  quota?: number | null
  remaining?: number | null
  manualSoldOut?: number
}

interface FeedbackRow {
  id: number
  cinemaId: number
  cinemaName?: string
  benefitId: number
  benefitName?: string
  feedbackType?: number
  createTime?: string
}

export default function Page ({ params: { lng } }: Readonly<PageProps>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const benefitId = Number(searchParams.get('id'))
  const movieId = Number(searchParams.get('movieId'))
  const benefitName = searchParams.get('name') ?? ''
  const { t: common } = useTranslation(lng, 'common')
  const { t: tCinemaDetail } = useTranslation(lng, 'cinemaDetail')

  const [stockList, setStockList] = useState<StockRow[]>([])
  const [stockKeyword, setStockKeyword] = useState('')
  const [stockPage, setStockPage] = useState(1)
  const [stockTotal, setStockTotal] = useState(0)
  const [stockPageSize, setStockPageSize] = useState(10)
  const [stockFormOpen, setStockFormOpen] = useState(false)
  const [stockForm] = Form.useForm()
  const [stockEditing, setStockEditing] = useState<StockRow | null>(null)
  // 用户反馈（按当前特典阶段 benefitId 查看）
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [feedbackList, setFeedbackList] = useState<FeedbackRow[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackPage, setFeedbackPage] = useState(1)
  const [feedbackTotal, setFeedbackTotal] = useState(0)
  const [feedbackPageSize, setFeedbackPageSize] = useState(10)
  // 未读反馈数（按钮角标）
  const [feedbackUnread, setFeedbackUnread] = useState(0)
  const [addressTree, setAddressTree] = useState<AddressTreeListResponse[]>([])
  const [stockAreaId, setStockAreaId] = useState<number[]>([])
  const [stockCinemaOptions, setStockCinemaOptions] = useState<
    { id: number; name: string }[]
  >([])
  // 该特典下所有已分配库存的影院 id（用于在分配下拉里标记/禁用已分配的影院）
  const [allocatedCinemaIds, setAllocatedCinemaIds] = useState<number[]>([])
  // 影院限定：cinemaLimitType=1 且名单非空时，库存只能从名单内影院选择
  const [cinemaLimitType, setCinemaLimitType] = useState(0)
  const [limitCinemaIds, setLimitCinemaIds] = useState<number[]>([])
  const stockQuotaWatch = Form.useWatch('quota', stockForm)

  const isCinemaLimited = cinemaLimitType === 1 && limitCinemaIds.length > 0

  // 「管理影院限定」弹窗
  const [limitModalOpen, setLimitModalOpen] = useState(false)
  const [limitModalSelected, setLimitModalSelected] = useState<number[]>([])
  const [limitModalList, setLimitModalList] = useState<
    { id: number; name: string }[]
  >([])
  const [limitModalKeyword, setLimitModalKeyword] = useState('')
  const [limitModalLoading, setLimitModalLoading] = useState(false)
  const [limitModalAreaId, setLimitModalAreaId] = useState<number[]>([])
  const [limitModalSpecId, setLimitModalSpecId] = useState<number>()
  const [limitModalBrandId, setLimitModalBrandId] = useState<number>()
  const [limitSaving, setLimitSaving] = useState(false)
  const [specOptions, setSpecOptions] = useState<{ id: number; name: string }[]>(
    []
  )
  const [brandOptions, setBrandOptions] = useState<
    { id: number; name: string }[]
  >([])
  const [cinemaNameMap, setCinemaNameMap] = useState<Record<number, string>>({})

  const quantityUnits = [
    { value: 1e8, unit: common('unit.billion') },
    { value: 1e4, unit: common('unit.million') },
    { value: 1e3, unit: common('unit.thousand') }
  ]

  const loadStockList = (p = 1, size = 10, keyword = stockKeyword) => {
    if (!benefitId || Number.isNaN(benefitId)) return
    http({
      url: 'admin/cinema/benefit/stock/list',
      method: 'post',
      data: {
        page: p,
        pageSize: size,
        benefitId,
        cinemaName: keyword?.trim() ? keyword.trim() : undefined
      }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setStockList(Array.isArray(list) ? list : [])
        setStockPage(p)
        setStockPageSize(size)
        setStockTotal(typeof d.total === 'number' ? d.total : 0)
      })
      .catch(() => setStockList([]))
  }

  const loadAllocatedCinemaIds = () => {
    if (!benefitId || Number.isNaN(benefitId)) return
    http({
      url: 'admin/cinema/benefit/stock/list',
      method: 'post',
      data: { page: 1, pageSize: 2000, benefitId }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setAllocatedCinemaIds(
          (Array.isArray(list) ? list : []).map((s: any) => s.cinemaId)
        )
      })
      .catch(() => setAllocatedCinemaIds([]))
  }

  const loadFeedbackList = (p = 1, size = feedbackPageSize) => {
    if (!benefitId || Number.isNaN(benefitId)) return
    setFeedbackLoading(true)
    http({
      url: 'admin/cinema/benefit/feedback/list',
      method: 'post',
      data: { page: p, pageSize: size, benefitId }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setFeedbackList(Array.isArray(list) ? list : [])
        setFeedbackPage(p)
        setFeedbackPageSize(size)
        setFeedbackTotal(typeof d.total === 'number' ? d.total : 0)
      })
      .catch(() => setFeedbackList([]))
      .finally(() => setFeedbackLoading(false))
  }

  // 仅用于按钮角标：拉取未读反馈数，不影响弹窗分页状态
  const loadFeedbackUnread = () => {
    if (!benefitId || Number.isNaN(benefitId)) return
    http({
      url: 'admin/cinema/benefit/feedback/list',
      method: 'post',
      data: { page: 1, pageSize: 1, benefitId, isRead: 0 }
    })
      .then((res: any) => {
        const d = res.data ?? res
        setFeedbackUnread(typeof d.total === 'number' ? d.total : 0)
      })
      .catch(() => {})
  }

  const openFeedbackModal = () => {
    setFeedbackModalOpen(true)
    loadFeedbackList(1, feedbackPageSize)
    // 查看即标记该特典下未读反馈为已读，并清空角标
    if (benefitId && !Number.isNaN(benefitId) && feedbackUnread > 0) {
      http({
        url: 'admin/cinema/benefit/feedback/read',
        method: 'post',
        data: { benefitId }
      })
        .then(() => setFeedbackUnread(0))
        .catch(() => {})
    }
  }

  const loadStockCinemaOptions = (areaIds?: (number | null)[]) => {
    const payload: Record<string, unknown> = { page: 1, pageSize: 2000 }
    if (areaIds?.length) {
      if (areaIds[0] != null) payload.regionId = areaIds[0]
      if (areaIds[1] != null) payload.prefectureId = areaIds[1]
      if (areaIds[2] != null) payload.cityId = areaIds[2]
    }
    http({ url: 'cinema/list', method: 'post', data: payload })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setStockCinemaOptions(
          (Array.isArray(list) ? list : []).map((c: any) => ({
            id: c.id,
            name: c.name || ''
          }))
        )
      })
      .catch(() => setStockCinemaOptions([]))
  }

  // 限定模式下：加载全部影院后过滤为白名单内影院作为可选项
  const loadLimitedCinemaOptions = (whitelist: number[]) => {
    if (!whitelist.length) {
      setStockCinemaOptions([])
      return
    }
    http({ url: 'cinema/list', method: 'post', data: { page: 1, pageSize: 2000 } })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setStockCinemaOptions(
          (Array.isArray(list) ? list : [])
            .filter((c: any) => whitelist.includes(c.id))
            .map((c: any) => ({ id: c.id, name: c.name || '' }))
        )
      })
      .catch(() => setStockCinemaOptions([]))
  }

  useEffect(() => {
    loadStockList(1, stockPageSize)
    loadAllocatedCinemaIds()
    loadFeedbackUnread()
    getAddressTreeList()
      .then(res => {
        setAddressTree((res.data as unknown as AddressTreeListResponse[]) ?? [])
      })
      .catch(() => setAddressTree([]))
    if (benefitId && !Number.isNaN(benefitId)) {
      http({ url: 'admin/benefit/detail', method: 'get', params: { id: benefitId } })
        .then((res: any) => {
          const d = res.data ?? res
          setCinemaLimitType(Number(d?.cinemaLimitType) || 0)
          setLimitCinemaIds(
            Array.isArray(d?.cinemaIds)
              ? d.cinemaIds
              : Array.isArray(d?.cinemaLimitIds)
              ? d.cinemaLimitIds
              : []
          )
        })
        .catch(() => {
          setCinemaLimitType(0)
          setLimitCinemaIds([])
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benefitId])

  useEffect(() => {
    if (!isCinemaLimited && stockAreaId.length > 0) {
      loadStockCinemaOptions(stockAreaId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockAreaId])

  useEffect(() => {
    http({ url: 'cinema/spec/list', method: 'post', data: { page: 1, pageSize: 200 } })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setSpecOptions(
          (Array.isArray(list) ? list : []).map((s: any) => ({
            id: s.id,
            name: s.name || ''
          }))
        )
      })
      .catch(() => setSpecOptions([]))
    http({ url: 'brand/list', method: 'post', data: { page: 1, pageSize: 200 } })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setBrandOptions(
          (Array.isArray(list) ? list : []).map((b: any) => ({
            id: b.id,
            name: b.name || ''
          }))
        )
      })
      .catch(() => setBrandOptions([]))
  }, [])

  const openAddStock = () => {
    setStockEditing(null)
    stockForm.resetFields()
    setStockAreaId([])
    loadAllocatedCinemaIds()
    if (isCinemaLimited) {
      loadLimitedCinemaOptions(limitCinemaIds)
    } else {
      loadStockCinemaOptions()
    }
    setStockFormOpen(true)
  }

  const openEditStock = (row: StockRow) => {
    setStockEditing(row)
    setStockAreaId([])
    stockForm.setFieldsValue({
      id: row.id,
      cinemaId: row.cinemaId,
      quota: row.quota ?? undefined,
      remaining: row.remaining ?? undefined,
      manualSoldOut: row.manualSoldOut === 1
    })
    setStockFormOpen(true)
  }

  const handleSaveStock = () => {
    if (!benefitId) return
    stockForm.validateFields().then(v => {
      const quota = v.quota === '' || v.quota == null ? null : Number(v.quota)
      const remaining =
        v.remaining === '' || v.remaining == null ? null : Number(v.remaining)
      http({
        url: 'admin/cinema/benefit/stock/save',
        method: 'post',
        data: {
          id: stockEditing?.id,
          movieId: Number.isNaN(movieId) ? undefined : movieId,
          benefitId,
          cinemaId: v.cinemaId,
          quota,
          remaining: stockEditing ? remaining : quota,
          ...(stockEditing ? { manualSoldOut: v.manualSoldOut ? 1 : 0 } : {})
        }
      }).then(() => {
        message.success(common('message.save'))
        setStockFormOpen(false)
        stockForm.resetFields()
        setStockEditing(null)
        setStockAreaId([])
        loadStockList(stockPage, stockPageSize)
        loadAllocatedCinemaIds()
      })
    })
  }

  const toggleSoldOut = (row: StockRow) => {
    const next = row.manualSoldOut === 1 ? 0 : 1
    http({
      url: 'admin/cinema/benefit/stock/save',
      method: 'post',
      data: { id: row.id, benefitId, manualSoldOut: next }
    }).then(() => {
      message.success(common('message.save'))
      loadStockList(stockPage, stockPageSize)
    })
  }

  const loadLimitModalList = (
    areaIds?: (number | null)[],
    specId?: number,
    keyword?: string,
    brandId?: number
  ) => {
    const payload: Record<string, unknown> = { page: 1, pageSize: 2000 }
    if (areaIds?.length) {
      if (areaIds[0] != null) payload.regionId = areaIds[0]
      if (areaIds[1] != null) payload.prefectureId = areaIds[1]
      if (areaIds[2] != null) payload.cityId = areaIds[2]
    }
    if (specId != null) payload.specId = specId
    if (brandId != null) payload.brandId = brandId
    if (keyword?.trim()) payload.name = keyword.trim()
    setLimitModalLoading(true)
    http({ url: 'cinema/list', method: 'post', data: payload })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        const mapped = (Array.isArray(list) ? list : []).map((c: any) => ({
          id: c.id,
          name: c.name || ''
        }))
        setLimitModalList(mapped)
        setCinemaNameMap(prev => {
          const next = { ...prev }
          mapped.forEach(c => {
            next[c.id] = c.name
          })
          return next
        })
      })
      .catch(() => setLimitModalList([]))
      .finally(() => setLimitModalLoading(false))
  }

  const openLimitModal = () => {
    setLimitModalSelected(limitCinemaIds)
    setLimitModalKeyword('')
    setLimitModalAreaId([])
    setLimitModalSpecId(undefined)
    setLimitModalBrandId(undefined)
    loadLimitModalList()
    setLimitModalOpen(true)
  }

  const handleSaveLimit = () => {
    if (!benefitId) return
    setLimitSaving(true)
    http({
      url: 'admin/benefit/cinemaLimit/save',
      method: 'post',
      data: { benefitId, cinemaLimitIds: limitModalSelected }
    })
      .then(() => {
        message.success(common('message.save'))
        setCinemaLimitType(limitModalSelected.length > 0 ? 1 : 0)
        setLimitCinemaIds(limitModalSelected)
        setLimitModalOpen(false)
      })
      .finally(() => setLimitSaving(false))
  }

  const limitTransferData = useMemo(() => {
    const map = new Map<number, string>()
    limitModalList.forEach(c => map.set(c.id, c.name))
    limitModalSelected.forEach(id => {
      if (!map.has(id)) map.set(id, cinemaNameMap[id] ?? `#${id}`)
    })
    return Array.from(map, ([id, name]) => ({ key: String(id), title: name }))
  }, [limitModalList, limitModalSelected, cinemaNameMap])

  const stockColumns: TableColumnsType<StockRow> = [
    {
      title: common('benefit.table.cinemaName'),
      dataIndex: 'cinemaName',
      ellipsis: true
    },
    {
      title: common('benefit.table.quota'),
      dataIndex: 'quota',
      width: 120,
      align: 'right',
      render: (val: number | null) =>
        val != null ? String(val) : common('benefit.table.unknown')
    },
    {
      title: common('benefit.table.remaining'),
      dataIndex: 'remaining',
      width: 120,
      align: 'right',
      render: (val: number | null) =>
        val != null ? String(val) : common('benefit.table.unknown')
    },
    {
      title: common('benefit.status.soldOut'),
      width: 120,
      align: 'center',
      render: (_, row) => (
        <CheckPermission code='benefit.stock.save'>
          <Switch
            checked={row.manualSoldOut === 1}
            onChange={() => toggleSoldOut(row)}
          />
        </CheckPermission>
      )
    },
    {
      title: common('table.action'),
      width: 100,
      render: (_, row) => (
        <CheckPermission code='benefit.stock.save'>
          <Button
            type='link'
            size='small'
            style={{ padding: 0 }}
            onClick={() => openEditStock(row)}
          >
            {common('button.edit')}
          </Button>
        </CheckPermission>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Button
        type='text'
        icon={<LeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        {common('benefit.form.backToList')}
      </Button>
      <Card
        title={
          benefitName
            ? `${common('benefit.tab.stock')} - ${benefitName}`
            : common('benefit.tab.stock')
        }
        extra={
          <Space>
            <Badge count={feedbackUnread} size='small' offset={[-4, 2]}>
              <Button onClick={openFeedbackModal}>
                {common('benefit.cinema.tabFeedback') ?? '用户反馈'}
              </Button>
            </Badge>
            <CheckPermission code='benefit.save'>
              <Button onClick={openLimitModal}>
                {common('benefit.button.manageCinemaLimit')}
              </Button>
            </CheckPermission>
            <CheckPermission code='benefit.stock.save'>
              <Button type='primary' onClick={openAddStock}>
                {common('benefit.button.addStock')}
              </Button>
            </CheckPermission>
          </Space>
        }
      >
        <Query
          showClear
          onSearch={() => loadStockList(1, stockPageSize, stockKeyword)}
          onClear={() => {
            setStockKeyword('')
            loadStockList(1, stockPageSize, '')
          }}
        >
          <QueryItem label={common('benefit.table.cinemaName')}>
            <Input
              allowClear
              placeholder={common('benefit.placeholder.searchCinema')}
              value={stockKeyword}
              onChange={e => setStockKeyword(e.target.value)}
            />
          </QueryItem>
        </Query>
        <Table<StockRow>
          size='middle'
          rowKey='id'
          bordered
          dataSource={stockList}
          columns={stockColumns}
          locale={{
            emptyText: (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p style={{ marginBottom: 12, color: 'rgba(0,0,0,0.45)' }}>
                  {common('benefit.cinema.stockEmptyHint')}
                </p>
                <CheckPermission code='benefit.stock.save'>
                  <Button type='primary' onClick={openAddStock}>
                    {common('benefit.button.addStock')}
                  </Button>
                </CheckPermission>
              </div>
            )
          }}
          pagination={{
            current: stockPage,
            pageSize: stockPageSize,
            total: stockTotal,
            showTotal,
            onChange: (p, size) =>
              loadStockList(p, (size as number) || stockPageSize),
            position: ['bottomCenter']
          }}
        />
      </Card>

      <Modal
        title={common('benefit.button.addStock')}
        open={stockFormOpen}
        maskClosable={false}
        destroyOnClose
        onOk={handleSaveStock}
        onCancel={() => {
          setStockFormOpen(false)
          stockForm.resetFields()
          setStockEditing(null)
          setStockAreaId([])
        }}
        width={600}
      >
        <Form form={stockForm} layout='vertical' preserve={false}>
          <Form.Item name='id' hidden>
            <Input type='hidden' />
          </Form.Item>
          {stockEditing ? (
            <Form.Item label={common('benefit.table.cinemaName')}>
              <Input value={stockEditing.cinemaName} disabled />
            </Form.Item>
          ) : (
            <>
              {isCinemaLimited ? (
                <div
                  style={{
                    marginBottom: 16,
                    color: 'rgba(0,0,0,0.45)',
                    fontSize: 12
                  }}
                >
                  {common('benefit.cinema.limitedStockTip')}
                </div>
              ) : (
                <Form.Item label={common('benefit.table.area')}>
                  <Cascader
                    fieldNames={{ label: 'name', value: 'id' }}
                    options={addressTree}
                    value={stockAreaId.length ? stockAreaId : undefined}
                    onChange={(value: (number | null)[] | undefined) => {
                      const ids = (value ?? []).filter(
                        (v): v is number => v != null
                      )
                      setStockAreaId(ids)
                      stockForm.setFieldsValue({ cinemaId: undefined })
                    }}
                    placeholder={tCinemaDetail('form.areaId.required')}
                    style={{ width: '100%' }}
                    allowClear
                  />
                </Form.Item>
              )}
              <Form.Item
                name='cinemaId'
                label={common('benefit.table.cinemaName')}
                extra={
                  allocatedCinemaIds.length > 0
                    ? common('benefit.cinema.appendTip')
                    : undefined
                }
                rules={[
                  {
                    required: true,
                    message: common('benefit.form.selectCinemaRequired')
                  }
                ]}
              >
                <Select
                  allowClear
                  showSearch
                  placeholder={common('benefit.placeholder.searchCinema')}
                  optionFilterProp='label'
                  filterOption={(input, opt) =>
                    (opt?.label ?? '')
                      .toString()
                      .toLowerCase()
                      .includes((input || '').trim().toLowerCase())
                  }
                  options={stockCinemaOptions.map(c => {
                    const allocated = allocatedCinemaIds.includes(c.id)
                    return {
                      value: c.id,
                      label: allocated
                        ? `${c.name}（${common('benefit.cinema.allocated')}）`
                        : c.name
                    }
                  })}
                  notFoundContent={
                    stockCinemaOptions.length === 0
                      ? common('benefit.empty.loading')
                      : common('benefit.empty.noCinema')
                  }
                  listHeight={320}
                  getPopupContainer={node =>
                    node?.parentElement ?? document.body
                  }
                />
              </Form.Item>
            </>
          )}
          <Form.Item
            name='quota'
            label={common('benefit.detail.quantity')}
            extra={
              stockQuotaWatch != null &&
              stockQuotaWatch !== '' &&
              !Number.isNaN(Number(stockQuotaWatch)) ? (
                <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                  约 {formatNumber(Number(stockQuotaWatch), quantityUnits)}
                </span>
              ) : null
            }
          >
            <Input
              type='number'
              min={0}
              placeholder={common('benefit.table.stockUnknownPlaceholder')}
            />
          </Form.Item>
          {stockEditing && (
            <Form.Item name='remaining' label={common('benefit.table.remaining')}>
              <Input
                type='number'
                min={0}
                placeholder={common('benefit.table.stockUnknownPlaceholder')}
              />
            </Form.Item>
          )}
          {stockEditing && (
            <Form.Item
              name='manualSoldOut'
              label={common('benefit.status.soldOut')}
              valuePropName='checked'
            >
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={common('benefit.button.manageCinemaLimit')}
        open={limitModalOpen}
        maskClosable={false}
        destroyOnClose
        onOk={handleSaveLimit}
        confirmLoading={limitSaving}
        onCancel={() => setLimitModalOpen(false)}
        width={800}
      >
        <div style={{ marginBottom: 12, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
          {common('benefit.cinema.manageLimitTip')}
        </div>
        {limitModalOpen ? (
          <>
            <Query
              showClear
              onSearch={() =>
                loadLimitModalList(
                  limitModalAreaId,
                  limitModalSpecId,
                  limitModalKeyword,
                  limitModalBrandId
                )
              }
              onClear={() => {
                setLimitModalAreaId([])
                setLimitModalSpecId(undefined)
                setLimitModalBrandId(undefined)
                setLimitModalKeyword('')
                loadLimitModalList([], undefined, '', undefined)
              }}
            >
              <QueryItem label={common('benefit.table.area')}>
                <Cascader
                  fieldNames={{ label: 'name', value: 'id' }}
                  options={addressTree}
                  value={limitModalAreaId.length ? limitModalAreaId : undefined}
                  onChange={(value: (number | null)[] | undefined) => {
                    const ids = (value ?? []).filter((v): v is number => v != null)
                    setLimitModalAreaId(ids)
                  }}
                  placeholder={tCinemaDetail('form.areaId.required')}
                  style={{ width: '100%' }}
                  allowClear
                />
              </QueryItem>
              <QueryItem label={common('benefit.table.brand')}>
                <Select
                  allowClear
                  placeholder={common('benefit.placeholder.selectBrand')}
                  value={limitModalBrandId}
                  onChange={(value: number | undefined) =>
                    setLimitModalBrandId(value)
                  }
                  options={brandOptions.map(b => ({
                    value: b.id,
                    label: b.name
                  }))}
                  style={{ width: '100%' }}
                />
              </QueryItem>
              <QueryItem label={common('benefit.limit.spec')}>
                <Select
                  allowClear
                  placeholder={common('benefit.placeholder.selectSpec')}
                  value={limitModalSpecId}
                  onChange={(value: number | undefined) =>
                    setLimitModalSpecId(value)
                  }
                  options={specOptions.map(s => ({ value: s.id, label: s.name }))}
                  style={{ width: '100%' }}
                />
              </QueryItem>
            </Query>
            <Spin spinning={limitModalLoading}>
              <Transfer
                dataSource={limitTransferData}
                titles={[
                  common('benefit.transfer.available'),
                  common('benefit.transfer.selected')
                ]}
                showSearch
                filterOption={(input, item) =>
                  (item.title ?? '')
                    .toLowerCase()
                    .includes(input.trim().toLowerCase())
                }
                targetKeys={limitModalSelected.map(String)}
                onChange={keys =>
                  setLimitModalSelected((keys as string[]).map(Number))
                }
                render={item => item.title ?? ''}
                listStyle={{ width: '50%', height: 360 }}
              />
            </Spin>
          </>
        ) : null}
      </Modal>

      <Modal
        title={`${common('benefit.cinema.tabFeedback') ?? '用户反馈'}${
          benefitName ? ` - ${benefitName}` : ''
        }`}
        open={feedbackModalOpen}
        footer={null}
        onCancel={() => setFeedbackModalOpen(false)}
        width={720}
      >
        <Table<FeedbackRow>
          size='small'
          rowKey='id'
          loading={feedbackLoading}
          dataSource={feedbackList}
          columns={[
            {
              title: common('benefit.table.cinemaName'),
              dataIndex: 'cinemaName',
              ellipsis: true
            },
            {
              title: common('benefit.table.feedbackType') ?? '类型',
              dataIndex: 'feedbackType',
              width: 120,
              render: (t: number) =>
                t === 1
                  ? common('benefit.detail.soldOut') ?? '已领完'
                  : String(t ?? '')
            },
            {
              title: common('benefit.table.createTime') ?? '反馈时间',
              dataIndex: 'createTime',
              width: 180
            }
          ]}
          pagination={{
            current: feedbackPage,
            pageSize: feedbackPageSize,
            total: feedbackTotal,
            showTotal,
            onChange: (p, size) =>
              loadFeedbackList(p, (size as number) || feedbackPageSize),
            position: ['bottomCenter']
          }}
        />
      </Modal>
    </div>
  )
}
