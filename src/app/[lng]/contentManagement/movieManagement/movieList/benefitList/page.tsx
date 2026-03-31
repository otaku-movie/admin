'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Button,
  Space,
  Row,
  Input,
  Select,
  Modal,
  message,
  Flex,
  Form,
  DatePicker,
  Tabs,
  Cascader,
  Tooltip
} from 'antd'
import type { TableColumnsType } from 'antd'
import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageProps } from '@/app/[lng]/layout'
import { CheckPermission } from '@/components/checkPermission'
import { showTotal } from '@/utils/pagination'
import { formatNumber } from '@/utils'
import { MovieModal } from '@/dialog/movieModal'
import { Dict } from '@/components/dict'
import { DictCode } from '@/enum/dict'
import dayjs from 'dayjs'
import { processPath } from '@/config/router'
import { CustomAntImage } from '@/components/CustomAntImage'
import {
  getAddressTreeList,
  type AddressTreeListResponse
} from '@/api/request/cinema'

interface BenefitListItem {
  id: number
  movieId: number
  movieName?: string
  /** 电影封面（列表接口返回） */
  movieCover?: string
  name: string
  description?: string
  /** 列表首图（后端可能返回 imageUrls 或 images，这里只取第一张做封面） */
  imageUrls?: string[]
  images?: string[]
  startDate: string
  endDate: string
  orderNum?: number
  quantity?: number
  remaining?: number | null
  /** 阶段状态：字典 benefitPhaseStatus 1=之前 2=进行中 3=已结束 */
  status?: number
}

interface QueryState {
  name?: string
  [key: string]: unknown
}

export default function Page ({ params: { lng } }: Readonly<PageProps>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const movieIdFromUrl = searchParams.get('id')
  const movieId = movieIdFromUrl ? parseInt(movieIdFromUrl, 10) : null
  const tabFromUrl = searchParams.get('tab')
  const cinemaIdFromUrl = searchParams.get('cinemaId')
  const [data, setData] = useState<BenefitListItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [query, setQuery] = useState<QueryState>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [movieModalOpen, setMovieModalOpen] = useState(false)
  const [selectedMovieForForm, setSelectedMovieForForm] = useState<{
    id: number
    name: string
  } | null>(null)
  const [modalType, setModalType] = useState<'create' | 'edit'>('create')
  const [, setEditingRecord] = useState<BenefitListItem | null>(null)
  const [form] = Form.useForm()
  const { t: common } = useTranslation(lng, 'common')
  const { t: tCinemaDetail } = useTranslation(lng, 'cinemaDetail')

  // 影院库存 Tab（支持 URL ?tab=stock&cinemaId=xx 从影院侧跳转过来）
  const [activeTab, setActiveTab] = useState<'phase' | 'stock'>(() =>
    tabFromUrl === 'stock' ? 'stock' : 'phase'
  )
  const [stockList, setStockList] = useState<any[]>([])
  const [stockPage, setStockPage] = useState(1)
  const [stockTotal, setStockTotal] = useState(0)
  const [stockPageSize, setStockPageSize] = useState(10)
  const [stockQuery, setStockQuery] = useState<{
    benefitId?: number
    cinemaId?: number
  }>({})
  const [cinemaOptions, setCinemaOptions] = useState<
    { id: number; name: string }[]
  >([])
  const [benefitOptionsForStock, setBenefitOptionsForStock] = useState<
    BenefitListItem[]
  >([])
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockForm] = Form.useForm()
  const [movieModalFor, setMovieModalFor] = useState<'phase' | 'stock' | null>(
    null
  )
  const [stockSelectedMovie, setStockSelectedMovie] = useState<{
    id: number
    name: string
  } | null>(null)
  const [addressTreeListForStock, setAddressTreeListForStock] = useState<
    AddressTreeListResponse[]
  >([])
  const [stockAreaId, setStockAreaId] = useState<number[]>([])

  const benefitOptionsForStockMemo = useMemo(
    () =>
      benefitOptionsForStock.map(b => ({
        value: b.id,
        label: `${b.name}${b.movieName ? ` (${b.movieName})` : ''}`
      })),
    [benefitOptionsForStock]
  )
  const cinemaOptionsMemo = useMemo(
    () => cinemaOptions.map(c => ({ value: c.id, label: c.name })),
    [cinemaOptions]
  )

  const getData = (p = 1, size = 10) => {
    http({
      url: 'admin/benefit/list',
      method: 'post',
      data: {
        page: p,
        pageSize: size,
        ...(movieId != null && !Number.isNaN(movieId) ? { movieId } : {}),
        ...query
      }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d
        const totalCount =
          typeof d.total === 'number'
            ? d.total
            : Array.isArray(list)
            ? list.length
            : 0
        setData(Array.isArray(list) ? list : [])
        setPage(p)
        setPageSize(size)
        setTotal(totalCount)
      })
      .catch(() => {
        setData([])
      })
  }

  useEffect(() => {
    getData()
  }, [movieId])

  useEffect(() => {
    if (tabFromUrl === 'stock') setActiveTab('stock')
  }, [tabFromUrl])

  useEffect(() => {
    if (cinemaIdFromUrl != null && cinemaIdFromUrl !== '') {
      const id = Number(cinemaIdFromUrl)
      if (!Number.isNaN(id)) {
        setStockQuery(prev => ({ ...prev, cinemaId: id }))
      }
    }
  }, [cinemaIdFromUrl])

  const loadStockList = (p = 1, size = 10) => {
    http({
      url: 'admin/cinema/benefit/stock/list',
      method: 'post',
      data: { page: p, pageSize: size, ...stockQuery }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d
        setStockList(Array.isArray(list) ? list : [])
        setStockPage(p)
        setStockPageSize(size)
        setStockTotal(typeof d.total === 'number' ? d.total : 0)
      })
      .catch(() => setStockList([]))
  }

  const loadCinemaOptions = (areaIds?: (number | null)[]) => {
    const payload: Record<string, unknown> = { page: 1, pageSize: 2000 }
    if (areaIds?.length) {
      if (areaIds[0] != null) payload.regionId = areaIds[0]
      if (areaIds[1] != null) payload.prefectureId = areaIds[1]
      if (areaIds[2] != null) payload.cityId = areaIds[2]
    }
    http({
      url: 'cinema/list',
      method: 'post',
      data: payload
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setCinemaOptions(
          (Array.isArray(list) ? list : []).map((c: any) => ({
            id: c.id,
            name: c.name || ''
          }))
        )
      })
      .catch(() => setCinemaOptions([]))
  }

  useEffect(() => {
    if (activeTab === 'stock') {
      getAddressTreeList()
        .then(res => {
          setAddressTreeListForStock(
            (res.data as unknown as AddressTreeListResponse[]) ?? []
          )
        })
        .catch(() => setAddressTreeListForStock([]))
      loadStockList(1, stockPageSize)
    }
  }, [activeTab, stockQuery.cinemaId])

  // 仅在选择地区后按地区加载影院，避免与 onStockTabAdd 中的 loadCinemaOptions() 重复调用导致选项刷新、Select 再次弹开
  useEffect(() => {
    if (activeTab === 'stock' && stockAreaId.length > 0) {
      loadCinemaOptions(stockAreaId)
    }
  }, [activeTab, stockAreaId])

  const onStockTabAdd = () => {
    stockForm.resetFields()
    setStockSelectedMovie(null)
    setStockAreaId([])
    setBenefitOptionsForStock([])
    loadCinemaOptions() // 不选地区时先加载全部影院
    if (stockQuery.cinemaId) {
      stockForm.setFieldsValue({ cinemaId: stockQuery.cinemaId })
    }
    setStockModalOpen(true)
  }

  const loadBenefitsByMovieForStock = (movieId: number) => {
    if (!movieId) {
      setBenefitOptionsForStock([])
      return
    }
    http({
      url: 'admin/benefit/list',
      method: 'post',
      data: { page: 1, pageSize: 500, movieId }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setBenefitOptionsForStock(Array.isArray(list) ? list : [])
      })
      .catch(() => setBenefitOptionsForStock([]))
  }

  /** 阶段行操作 */
  const phaseActionRender = (row: BenefitListItem) => (
    <Space size='middle' wrap direction='vertical'>
      {/* <Button
        type='link'
        size='small'
        style={{ padding: 0 }}
        onClick={() =>
          router.push(processPath('benefitDetail', { id: row.id }))
        }
      >
        {common('benefit.button.detail')}
      </Button> */}
      <CheckPermission code='benefit.save'>
        <Button
          type='link'
          size='small'
          style={{ padding: 0 }}
          onClick={() => {
            router.push(processPath('benefitDetail', { id: row.id }))
            // setEditingRecord(row)
            // setModalType('edit')
            // setSelectedMovieForForm({
            //   id: row.movieId,
            //   name: row.movieName ?? ''
            // })
            // form.setFieldsValue({
            //   id: row.id,
            //   movieId: row.movieId,
            //   name: row.name,
            //   startDate: row.startDate ? dayjs(row.startDate) : null,
            //   endDate: row.endDate ? dayjs(row.endDate) : null,
            //   orderNum: row.orderNum ?? 0
            // })
            // setModalOpen(true)
          }}
        >
          {common('button.edit')}
        </Button>
      </CheckPermission>
      <CheckPermission code='benefit.remove'>
        <Button
          type='link'
          size='small'
          danger
          style={{ padding: 0 }}
          onClick={() => {
            Modal.confirm({
              title: common('button.remove'),
              content: common('benefit.message.removeContent'),
              onOk () {
                return http({
                  url: 'admin/benefit/remove',
                  method: 'delete',
                  params: { id: row.id }
                }).then(() => {
                  message.success(common('benefit.message.removeSuccess'))
                  getData(page, pageSize)
                })
              }
            })
          }}
        >
          {common('button.remove')}
        </Button>
      </CheckPermission>
    </Space>
  )

  /** 特典数量单位：亿、万、千 */
  const quantityUnits = [
    { value: 1e8, unit: common('unit.billion') },
    { value: 1e4, unit: common('unit.million') },
    { value: 1e3, unit: common('unit.thousand') }
  ]

  const stockQuotaWatch = Form.useWatch('quota', stockForm)

  const phaseThumbWrap: React.CSSProperties = {
    width: "100%",
    // height: 76,
    margin: '0 auto',
    border: '1px solid #e8e8e8',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#fafafa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  }

  /** 阶段列表列 */
  const phaseColumns: TableColumnsType<BenefitListItem> = [
    {
      title: common('benefit.table.image'),
      dataIndex: 'imageUrls',
      width: 120,
      align: 'center',
      render: (_: unknown, row) => {
        const src =
          (Array.isArray(row.imageUrls) && row.imageUrls[0]) ||
          (Array.isArray(row.images) && row.images[0])
        if (!src) {
          return (
            <div
              style={{
                ...phaseThumbWrap,
                color: '#bfbfbf',
                fontSize: 13
              }}
            >
              —
            </div>
          )
        }
        return (
          <div >
            <CustomAntImage
              // width={180}
              // height={120}
              src={src}
              style={{ objectFit: 'cover', display: 'block' }}
              preview
            />
          </div>
        )
      }
    },
    // {
    //   title: common('benefit.table.movieName'),
    //   dataIndex: 'movieName',
    //   width: 240,
    //   ellipsis: true,
    //   render: (_: unknown, row) => {
    //     const name = row.movieName ?? '—'
    //     if (!row.movieCover) return name
    //     const posterBox: React.CSSProperties = {
    //       width: 52,
    //       height: 74,
    //       flexShrink: 0,
    //       border: '1px solid #e8e8e8',
    //       borderRadius: 8,
    //       overflow: 'hidden',
    //       background: '#fafafa',
    //       boxSizing: 'border-box'
    //     }
    //     return (
    //       <Flex gap={12} align='center' style={{ minWidth: 0 }}>
    //         <div style={posterBox}>
    //           <CustomAntImage
    //             src={row.movieCover}
    //             width={52}
    //             height={74}
    //             style={{ objectFit: 'cover', display: 'block' }}
    //             preview
    //           />
    //         </div>
    //         <Tooltip title={typeof name === 'string' ? name : undefined}>
    //           <span
    //             style={{
    //               minWidth: 0,
    //               overflow: 'hidden',
    //               textOverflow: 'ellipsis',
    //               whiteSpace: 'nowrap',
    //               lineHeight: 1.5
    //             }}
    //           >
    //             {name}
    //           </span>
    //         </Tooltip>
    //       </Flex>
    //     )
    //   }
    // },
    {
      title: common('benefit.table.name'),
      dataIndex: 'name',
      width: 140,
    },
    {
      title: common('benefit.table.startDate'),
      dataIndex: 'startDate',
      width: 110
    },
    {
      title: common('benefit.table.endDate'),
      dataIndex: 'endDate',
      width: 110
    },
    {
      title: common('benefit.table.status'),
      dataIndex: 'status',
      width: 88,
      align: 'center',
      render: (v: number | null | undefined) =>
        v != null ? <Dict name={DictCode.BENEFIT_PHASE_STATUS} code={v} /> : '—'
    },
    {
      title: common('benefit.detail.quantity'),
      dataIndex: 'quantity',
      width: 90,
      align: 'center',
      render: (v: number) =>
        v != null ? formatNumber(Number(v), quantityUnits) : '—'
    },
    {
      title: common('benefit.table.remaining'),
      dataIndex: 'remaining',
      width: 90,
      align: 'center',
      render: (v: number | null | undefined) =>
        v != null
          ? formatNumber(Number(v), quantityUnits)
          : common('benefit.table.unknown')
    },
    {
      title: common('benefit.table.orderNum'),
      dataIndex: 'orderNum',
      width: 70,
      align: 'center',
      render: (v: number) => (v != null ? v : '—')
    },
    {
      title: common('table.action'),
      key: 'action',
      width: 60,
      fixed: 'right',
      render: (_, row) => phaseActionRender(row)
    }
  ]

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const payload = {
        id: values.id,
        movieId: values.movieId,
        name: values.name,
        startDate: values.startDate
          ? dayjs(values.startDate).format('YYYY-MM-DD')
          : '',
        endDate: values.endDate
          ? dayjs(values.endDate).format('YYYY-MM-DD')
          : '',
        orderNum: values.orderNum ?? 0
      }
      http({
        url: 'admin/benefit/save',
        method: 'post',
        data: payload
      }).then(() => {
        message.success(common('message.save'))
        setModalOpen(false)
        form.resetFields()
        setEditingRecord(null)
        setSelectedMovieForForm(null)
        getData(page, pageSize)
      })
    })
  }

  const handleModalCancel = () => {
    setModalOpen(false)
    form.resetFields()
    setEditingRecord(null)
    setSelectedMovieForForm(null)
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as 'phase' | 'stock')}
        items={[
          {
            key: 'phase',
            label: common('benefit.tab.phase'),
            children: (
              <>
                <Query
                  model={query}
                  onSearch={() => getData(1, pageSize)}
                  onClear={obj => {
                    setQuery((obj || {}) as QueryState)
                    getData(1, pageSize)
                  }}
                >
                  <QueryItem label={common('benefit.table.name')}>
                    <Input
                      allowClear
                      placeholder={common('benefit.form.namePlaceholder')}
                      value={query.name}
                      onChange={e =>
                        setQuery({ ...query, name: e.target.value })
                      }
                    />
                  </QueryItem>
                  <QueryItem label=' ' colon={false}>
                    <CheckPermission code='benefit.save'>
                      <Button
                        type='primary'
                        onClick={() => {
                          const path = processPath('benefitDetail', { movieId })
                          router.push(path)
                        }}
                      >
                        {common('benefit.button.addBenefit')}
                      </Button>
                    </CheckPermission>
                  </QueryItem>
                </Query>
                <div style={{ marginTop: 20 }}>
                  <Table
                    size='middle'
                    columns={phaseColumns}
                    dataSource={data}
                    rowKey='id'
                    bordered
                    scroll={{ x: 1120 }}
                    pagination={{
                      current: page,
                      pageSize,
                      total,
                      showTotal,
                      onChange: (p, size) =>
                        getData(p, (size as number) || pageSize),
                      position: ['bottomCenter']
                    }}
                  />
                </div>
              </>
            )
          },
          {
            key: 'stock',
            label: common('benefit.tab.stock'),
            children: (
              <Space direction='vertical' size={16}>
                <Row justify='space-between' align='middle'>
                  <Space wrap>
                    <Select
                      allowClear
                      placeholder={common('benefit.table.benefitName')}
                      style={{ minWidth: 160 }}
                      showSearch
                      optionFilterProp='label'
                      options={benefitOptionsForStock.map(b => ({
                        value: b.id,
                        label: `${b.name}${
                          b.movieName ? ` (${b.movieName})` : ''
                        }`
                      }))}
                      value={stockQuery.benefitId}
                      onChange={v => {
                        setStockQuery({ ...stockQuery, benefitId: v })
                        loadStockList(1, stockPageSize)
                      }}
                    />
                    <Select
                      allowClear
                      placeholder={common('benefit.table.cinemaName')}
                      style={{ minWidth: 200 }}
                      showSearch
                      optionFilterProp='label'
                      filterOption={(input, opt) =>
                        (opt?.label ?? '')
                          .toString()
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={cinemaOptions.map(c => ({
                        value: c.id,
                        label: c.name
                      }))}
                      value={stockQuery.cinemaId}
                      onChange={v => {
                        setStockQuery({ ...stockQuery, cinemaId: v })
                        loadStockList(1, stockPageSize)
                      }}
                    />
                    <Button onClick={() => loadStockList(1, stockPageSize)}>
                      搜索
                    </Button>
                  </Space>
                  <Button type='primary' onClick={onStockTabAdd}>
                    {common('benefit.button.addStock')}
                  </Button>
                </Row>
                <Table
                  size='small'
                  rowKey='id'
                  dataSource={stockList}
                  locale={{
                    emptyText: (
                      <div style={{ padding: '24px 0', textAlign: 'center' }}>
                        <p style={{ marginBottom: 12, color: 'rgba(0,0,0,0.45)' }}>
                          {common('benefit.cinema.stockEmptyHint')}
                        </p>
                        <Button type='primary' onClick={onStockTabAdd}>
                          {common('benefit.button.addStock')}
                        </Button>
                      </div>
                    )
                  }}
                  columns={[
                    {
                      title: common('benefit.table.cinemaName'),
                      dataIndex: 'cinemaName',
                      width: 160,
                      ellipsis: true
                    },
                    {
                      title: common('benefit.table.benefitName'),
                      dataIndex: 'benefitName',
                      width: 120
                    },
                    {
                      title: common('benefit.table.quota'),
                      dataIndex: 'quota',
                      width: 80,
                      align: 'right',
                      render: (val: number | null) =>
                        val != null
                          ? String(val)
                          : common('benefit.table.unknown')
                    },
                    {
                      title: common('benefit.table.remaining'),
                      dataIndex: 'remaining',
                      width: 80,
                      align: 'right',
                      render: (val: number | null) =>
                        val != null
                          ? String(val)
                          : common('benefit.table.unknown')
                    },
                    {
                      title: common('table.action'),
                      width: 80,
                      render: (_, row) => (
                        <CheckPermission code='benefit.stock.save'>
                          <Button
                            type='link'
                            size='small'
                            onClick={() => {
                              stockForm.setFieldsValue({
                                id: row.id,
                                cinemaId: row.cinemaId,
                                benefitId: row.benefitId,
                                quota: row.quota,
                                remaining: row.remaining
                              })
                              setStockModalOpen(true)
                            }}
                          >
                            {common('button.edit')}
                          </Button>
                        </CheckPermission>
                      )
                    }
                  ]}
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
              </Space>
            )
          }
        ]}
      />

      <Modal
        title={
          modalType === 'create'
            ? common('benefit.button.addBenefit')
            : common('button.edit')
        }
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        maskClosable={false}
        width={480}
      >
        <Form form={form} layout='vertical' preserve={false}>
          <Form.Item name='id' hidden>
            <Input type='hidden' />
          </Form.Item>
          <Form.Item
            name='movieId'
            label={common('benefit.table.movieName')}
            rules={[{ required: true, message: '请选择作品' }]}
          >
            <Flex align='center' gap={8}>
              <span
                style={{
                  flex: 1,
                  color: selectedMovieForForm ? undefined : 'rgba(0,0,0,0.25)'
                }}
              >
                {selectedMovieForForm?.name ?? common('benefit.form.selectMoviePlaceholder')}
              </span>
              <Button
                type='primary'
                disabled={modalType === 'edit'}
                onClick={() => {
                  setMovieModalFor('phase')
                  setMovieModalOpen(true)
                }}
              >
                {common('benefit.button.selectMovie')}
              </Button>
            </Flex>
          </Form.Item>
          <Form.Item
            name='name'
            label={common('benefit.table.name')}
            rules={[{ required: true, message: common('benefit.form.nameRequired') }]}
          >
            <Input placeholder={common('benefit.form.nameExample')} />
          </Form.Item>
          <Flex gap={16}>
            <Form.Item
              name='startDate'
              label={common('benefit.table.startDate')}
              rules={[{ required: true, message: common('benefit.form.startDateRequired') }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name='endDate'
              label={common('benefit.table.endDate')}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Flex>
          <Form.Item name='orderNum' label={common('benefit.table.orderNum')} initialValue={0}>
            <Input type='number' min={0} />
          </Form.Item>
        </Form>
      </Modal>

      <MovieModal
        show={movieModalOpen}
        zIndex={1100}
        initialMovieId={
          movieModalFor === 'phase'
            ? form.getFieldValue('movieId') || undefined
            : stockSelectedMovie?.id ?? stockForm.getFieldValue('movieId') ?? undefined
        }
        onConfirm={movie => {
          if (movieModalFor === 'phase') {
            form.setFieldValue('movieId', movie.id)
            setSelectedMovieForForm({ id: movie.id, name: movie.name })
          } else {
            stockForm.setFieldsValue({ movieId: movie.id, benefitId: undefined })
            setStockSelectedMovie({ id: movie.id, name: movie.name })
            loadBenefitsByMovieForStock(movie.id)
          }
          setMovieModalOpen(false)
          setMovieModalFor(null)
        }}
        onCancel={() => {
          setMovieModalOpen(false)
          setMovieModalFor(null)
        }}
      />

      <Modal
        title={common('benefit.button.addStock')}
        open={stockModalOpen}
        maskClosable={false}
        onOk={() => {
          stockForm.validateFields().then(v => {
            const quota =
              v.quota === '' || v.quota == null ? null : Number(v.quota)
            const remaining =
              v.remaining === '' || v.remaining == null ? null : Number(v.remaining)
            http({
              url: 'admin/cinema/benefit/stock/save',
              method: 'post',
              data: {
                id: v.id,
                movieId: v.movieId,
                benefitId: v.benefitId,
                cinemaId: v.cinemaId,
                quota,
                remaining: remaining ?? quota
              }
            }).then(() => {
              message.success(common('message.save'))
              setStockModalOpen(false)
              stockForm.resetFields()
              setStockSelectedMovie(null)
              setStockAreaId([])
              setBenefitOptionsForStock([])
              loadStockList(stockPage, stockPageSize)
            })
          })
        }}
        onCancel={() => {
          setStockModalOpen(false)
          stockForm.resetFields()
          setStockSelectedMovie(null)
          setStockAreaId([])
          setBenefitOptionsForStock([])
        }}
        width={480}
      >
        <Form form={stockForm} layout='vertical' preserve={false}>
          <Form.Item name='id' hidden>
            <Input type='hidden' />
          </Form.Item>
          {!stockForm.getFieldValue('id') && (
            <>
              <div style={{ marginBottom: 16, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                {common('benefit.form.stockStepTip')}
              </div>
              <Form.Item
                name='movieId'
                label={common('benefit.table.movieName')}
                rules={[{ required: true, message: common('benefit.form.selectMovieRequired') }]}
              >
                <Flex align='center' gap={8}>
                  <span
                    style={{
                      flex: 1,
                      color: stockSelectedMovie
                        ? undefined
                        : 'rgba(0,0,0,0.25)'
                    }}
                  >
                    {stockSelectedMovie?.name ?? common('benefit.form.selectMoviePlaceholder')}
                  </span>
                  <Button
                    type='primary'
                    onClick={() => {
                      setMovieModalFor('stock')
                      setMovieModalOpen(true)
                    }}
                  >
                    {common('benefit.button.selectMovie')}
                  </Button>
                </Flex>
              </Form.Item>
              <Form.Item
                name='benefitId'
                label={common('benefit.table.benefitName')}
                rules={[{ required: true, message: '请选择特典阶段' }]}
                extra={
                  benefitOptionsForStock.length === 0 && stockForm.getFieldValue('movieId')
                    ? '加载中…'
                    : undefined
                }
              >
                <Select
                  allowClear
                  showSearch
                  placeholder={common('benefit.placeholder.searchPhase')}
                  optionFilterProp='label'
                  filterOption={(input, opt) =>
                    (opt?.label ?? '')
                      .toString()
                      .toLowerCase()
                      .includes((input || '').trim().toLowerCase())
                  }
                  options={benefitOptionsForStockMemo}
                  notFoundContent={
                    benefitOptionsForStock.length === 0
                      ? common('benefit.empty.selectMovieFirst')
                      : common('benefit.empty.noPhase')
                  }
                  listHeight={320}
                  getPopupContainer={node => node?.parentElement ?? document.body}
                  disabled={benefitOptionsForStock.length === 0}
                />
              </Form.Item>
              <Form.Item label={common('benefit.table.area')}>
                <Cascader
                  fieldNames={{ label: 'name', value: 'id' }}
                  options={addressTreeListForStock}
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
              <Form.Item
                name='cinemaId'
                label={common('benefit.table.cinemaName')}
                rules={[{ required: true, message: common('benefit.form.selectCinemaRequired') }]}
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
                  options={cinemaOptionsMemo}
                  notFoundContent={
                    cinemaOptions.length === 0
                      ? common('benefit.empty.loading')
                      : common('benefit.empty.noCinema')
                  }
                  listHeight={320}
                  getPopupContainer={node => node?.parentElement ?? document.body}
                />
              </Form.Item>
            </>
          )}
          <Form.Item
            name='quota'
            label={common('benefit.detail.quantity')}
            rules={[{ required: true, message: common('benefit.form.quotaRequired') }]}
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
              placeholder={common('benefit.form.quotaPlaceholder')}
            />
          </Form.Item>
          {stockForm.getFieldValue('id') && (
            <Form.Item name='remaining' label={common('benefit.table.remaining')}>
              <Input
                type='number'
                min={0}
                placeholder={common('benefit.table.stockUnknownPlaceholder')}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </section>
  )
}
