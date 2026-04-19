'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  message,
  Form,
  Flex
} from 'antd'

import type { TableColumnsType } from 'antd'
import { notFoundImage } from '@/config/index'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { Cinema, theaterHall } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import { showTotal } from '@/utils/pagination'
import { CheckPermission } from '@/components/checkPermission'
import { DictSelect } from '@/components/DictSelect'
import { DictCode } from '@/enum/dict'
import { Dict } from '@/components/dict'
import { OrderState } from '@/config/enum'
import { RangePicker, dateValue } from '@/components/rangePicker'
import { CustomAntImage } from '@/components/CustomAntImage'

/** 与后端 OrderState 编码一致，用于 Tag 颜色 */
function orderStateTagColor(code: number | undefined): string {
  if (code == null) return 'default'
  switch (code) {
    case 2:
      return 'success'
    case 3:
      return 'error'
    case 5:
      return 'warning'
    case 4:
      return 'default'
    default:
      return 'processing'
  }
}

/** 与后端 PayState 编码一致，用于 Tag 颜色（与订单状态色系区分） */
function payStateTagColor(code: number | undefined): string {
  if (code == null) return 'default'
  switch (code) {
    case 3:
      return 'success'
    case 4:
      return 'error'
    case 5:
      return 'default'
    case 2:
      return 'processing'
    default:
      return 'warning'
  }
}

interface Query {
  orderNumber?: string
  movieId: number
  cinemaId: number
  theaterHallId: number
  orderState: number
  payState: number
  orderTime: any[]
}

export default function MoviePage({ params: { lng } }: PageProps) {
  // const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'order')
  const { t: common } = useTranslation(lng, 'common')
  const [movieData, setMovieData] = useState([])
  const [cinemaData, setCinemaData] = useState<Cinema[]>([])
  const [theaterHallData, setTheaterHallData] = useState<theaterHall[]>([])
  const [updateOrderStateModal, setUpdateOrderStateModal] = useState({
    show: false,
    form: Form.useForm(),
    data: {
      id: 0,
      orderState: 0,
      payState: 0
    }
  })
  const [QRcodeModal, setQRcodeModal] = useState<{
    show: boolean
    data: string
  }>({
    show: false,
    data: ''
  })
  const [orderDate, setOrderDate] = useState<dateValue>({
    start: null,
    end: null
  })
  /** 与后端 MovieOrderListQuery.sortField 白名单一致 */
  const [sortField, setSortField] = useState<string>('orderTime')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const getData = (
    page = 1,
    sf: string = sortField,
    so: 'asc' | 'desc' = sortOrder
  ) => {
    http({
      url: 'admin/movieOrder/list',
      method: 'post',
      data: {
        page,
        pageSize: 10,
        ...query,
        orderStartTime: orderDate.start?.format('YYYY-MM-DD HH:mm:ss'),
        orderEndTime: orderDate.end?.format('YYYY-MM-DD HH:mm:ss'),
        sortField: sf,
        sortOrder: so
      }
    }).then((res) => {
      setData(res.data.list)
      setPage(page)
      setTotal(res.data.total)
    })
  }

  const specNamesText = (row: { specName?: string; specNames?: string[] }) => {
    if (row.specNames && row.specNames.length > 0) {
      return row.specNames.join('、')
    }
    return row.specName ?? ''
  }
  const getMovieData = (name: string = '') => {
    http({
      url: 'movie/list',
      method: 'post',
      data: {
        name,
        // 上映中
        releaseStatus: 2,
        page: 1,
        pageSize: 10
      }
    }).then((res) => {
      console.log(res.data.list)
      // eslint-disable-next-line no-unsafe-optional-chaining
      setMovieData(res.data?.list || [])
    })
  }
  const getTheaterHallData = (id: number) => {
    http({
      url: 'theater/hall/list',
      method: 'post',
      data: {
        cinemaId: id,
        page: 1,
        pageSize: 100
      }
    }).then((res) => {
      setTheaterHallData(res.data.list || [])
    })
  }
  const getCinemaData = (name: string = '') => {
    http({
      url: 'cinema/list',
      method: 'post',
      data: {
        name,
        page: 1,
        pageSize: 10
      }
    }).then((res) => {
      setCinemaData(res.data.list || [])
    })
  }
  useEffect(() => {
    getMovieData()
    getCinemaData()
  }, [])

  useEffect(() => {
    getData()
  }, [])

  const columns: TableColumnsType = [
    {
      title: t('table.orderNumber'),
      key: 'orderNumber',
      dataIndex: 'orderNumber',
      width: 140,
      fixed: 'left'
    },
    {
      title: t('table.name'),
      dataIndex: 'name',
      width: 350,
      render(_: any, row) {
        return (
          <Space align="start">
            <CustomAntImage
              width={100}
              src={row.moviePoster}
              alt="poster"
              fallback={notFoundImage}
              placeholder={true}
              style={{
                borderRadius: ' 4px'
              }}
            ></CustomAntImage>
            <Space direction="vertical">
              <span>{row.movieName}</span>
              <span>
                {t('table.cinemaName')}：{row.cinemaName}
              </span>
              <span>
                {t('table.theaterHallName')}：{row.theaterHallName}
              </span>
              <span>
                {t('table.specName')}：{specNamesText(row)}
              </span>
            </Space>
          </Space>
        )
      }
    },
    {
      title: t('table.showTime'),
      key: 'startTime',
      columnKey: 'startTime',
      width: 180,
      sorter: true,
      sortOrder:
        sortField === 'startTime'
          ? sortOrder === 'asc'
            ? 'ascend'
            : 'descend'
          : null,
      render(_, row) {
        return (
          <Space direction="vertical">
            {row.startTime}
            {row.endTime}
          </Space>
        )
      }
    },
    {
      title: t('table.seatNumber'),
      width: 250,
      render(_, row) {
        return (
          <Space direction="vertical">
            {row.seat.map(
              (
                item: {
                  seatName: string
                  movieTicketTypeName: string
                  areaName: string
                },
                index: number
              ) => {
                return (
                  <Tag key={index}>
                    {item.areaName} {item.seatName}（{item.movieTicketTypeName}
                    ）
                  </Tag>
                )
              }
            )}
          </Space>
        )
      }
    },
    {
      title: t('table.orderTotal'),
      key: 'orderTotal',
      columnKey: 'orderTotal',
      width: 100,
      dataIndex: 'orderTotal',
      sorter: true,
      sortOrder:
        sortField === 'orderTotal'
          ? sortOrder === 'asc'
            ? 'ascend'
            : 'descend'
          : null
    },
    {
      title: t('table.orderTime'),
      key: 'orderTime',
      columnKey: 'orderTime',
      width: 120,
      dataIndex: 'orderTime',
      sorter: true,
      sortOrder:
        sortField === 'orderTime'
          ? sortOrder === 'asc'
            ? 'ascend'
            : 'descend'
          : null
    },
    {
      title: t('table.orderState'),
      width: 100,
      render(_, row) {
        return (
          <Tag color={orderStateTagColor(row.orderState)} style={{ margin: 0 }}>
            <Dict code={row.orderState} name={'orderState'}></Dict>
          </Tag>
        )
      },
      dataIndex: 'orderState'
    },
    {
      title: t('table.payTotal'),
      key: 'payTotal',
      columnKey: 'payTotal',
      width: 150,
      dataIndex: 'payTotal',
      sorter: true,
      sortOrder:
        sortField === 'payTotal'
          ? sortOrder === 'asc'
            ? 'ascend'
            : 'descend'
          : null,
      render(val: number | string | null | undefined) {
        if (val === null || val === undefined || val === '') return '—'
        return String(val)
      }
    },
    {
      title: t('table.payTime'),
      key: 'payTime',
      columnKey: 'payTime',
      width: 150,
      dataIndex: 'payTime',
      sorter: true,
      sortOrder:
        sortField === 'payTime'
          ? sortOrder === 'asc'
            ? 'ascend'
            : 'descend'
          : null
    },
    {
      title: t('table.payState'),
      width: 150,
      render(_, row) {
        return (
          <Tag color={payStateTagColor(row.payState)} style={{ margin: 0 }}>
            <Dict code={row.payState} name={'payState'}></Dict>
          </Tag>
        )
      },
      dataIndex: 'payState'
    },
    {
      title: t('table.payMethod'),
      width: 150,
      dataIndex: 'payMethod'
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      align: 'center',
      width: 160,
      render: (_, row) => {
        return (
          <CheckPermission code="movieOrder.updateOrderState">
            <Space direction="vertical" align="center">
              {row.orderState === OrderState.order_succeed ? (
                <Button
                  type="primary"
                  onClick={() => {
                    http({
                      url: 'movieOrder/generatorQRcode',
                      method: 'get',
                      responseType: 'blob'
                    }).then((res: any) => {
                      console.log(res)
                      setQRcodeModal({
                        show: true,
                        data: URL.createObjectURL(res)
                      })
                    })
                  }}
                >
                  {common('button.order.generateQRcode')}
                </Button>
              ) : null}

              <Button
                type="primary"
                danger
                onClick={() => {
                  Modal.confirm({
                    title: common('button.remove'),
                    content: t('message.remove.content'),
                    onCancel() {
                      console.log('Cancel')
                    },
                    onOk() {
                      return new Promise((resolve, reject) => {
                        http({
                          url: 'admin/movieOrder/remove',
                          method: 'delete',
                          params: {
                            id: row.id
                          }
                        })
                          .then((res) => {
                            message.success(res.message)
                            getData()
                            resolve(true)
                          })
                          .catch(reject)
                      })
                    }
                  })
                }}
              >
                {common('button.remove')}
              </Button>
            </Space>
          </CheckPermission>
        )
      }
    }
  ]

  return (
    <section>
      <Flex vertical gap={30}>
        <Query
          model={query}
          onSearch={() => {
            console.log(query)
            getData()
          }}
          onClear={(obj) => {
            setQuery({ ...obj })
          }}
        >
          <QueryItem label={t('search.id')}>
            <Input
              value={query.orderNumber}
              allowClear
              onChange={(e) => {
                setQuery({
                  ...query,
                  orderNumber: e.target.value
                })
              }}
            ></Input>
          </QueryItem>
          <QueryItem label={t('search.orderTime')} column={2}>
            <RangePicker
              value={orderDate}
              onChange={(date) => {
                setOrderDate({ ...date })
              }}
            ></RangePicker>
          </QueryItem>
          <QueryItem label={t('table.name')}>
            <Select
              showSearch
              allowClear
              value={query.movieId}
              filterOption={false}
              onChange={(val) => {
                setQuery({
                  ...query,
                  movieId: val
                })
              }}
              onSearch={getMovieData}
            >
              {movieData.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
          </QueryItem>

          <QueryItem label={t('search.cinema')} column={1}>
            <Select
              showSearch
              allowClear
              onChange={(val) => {
                getTheaterHallData(val)
                setQuery({
                  ...query,
                  cinemaId: val,
                  theaterHallId: undefined
                })
              }}
              value={query.cinemaId}
              onSearch={getCinemaData}
            >
              {cinemaData.map((item) => (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </QueryItem>
          <QueryItem label={t('search.theaterHall')} column={1}>
            <Select
              value={query.theaterHallId}
              showSearch
              onChange={(val) => {
                setQuery({
                  ...query,
                  theaterHallId: val
                })
              }}
            >
              {theaterHallData.map((item) => (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}（{item.cinemaSpecName}）
                </Select.Option>
              ))}
            </Select>
          </QueryItem>

          <QueryItem label={t('search.orderState')}>
            <DictSelect
              code={DictCode.ORDER_STATE}
              value={query.orderState}
              onChange={(val) => {
                setQuery({
                  ...query,
                  orderState: val
                })
              }}
            ></DictSelect>
          </QueryItem>
          <QueryItem label={t('search.payState')}>
            <DictSelect
              code={DictCode.PAY_STATE}
              value={query.payState}
              onChange={(val) => {
                setQuery({
                  ...query,
                  payState: val
                })
              }}
            ></DictSelect>
          </QueryItem>
        </Query>

        <Table
          columns={columns}
          dataSource={data}
          bordered={true}
          sticky={{ offsetHeader: -20 }}
          scroll={{
            x: columns.reduce(
              (total, current) => total + (current.width as number),
              0
            )
          }}
          onChange={(pagination, _filters, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter
            let nextSF = sortField
            let nextSO = sortOrder
            if (s && typeof s === 'object' && s.columnKey != null) {
              const key = String(s.columnKey)
              if (s.order === 'ascend') {
                nextSF = key
                nextSO = 'asc'
              } else if (s.order === 'descend') {
                nextSF = key
                nextSO = 'desc'
              } else {
                nextSF = 'orderTime'
                nextSO = 'desc'
              }
            }
            setSortField(nextSF)
            setSortOrder(nextSO)
            getData(pagination.current ?? 1, nextSF, nextSO)
          }}
          pagination={{
            pageSize: 10,
            current: page,
            total,
            showTotal,
            position: ['bottomCenter']
          }}
        />
      </Flex>
      <Modal
        title={t('updateOrderStateModal.title')}
        open={updateOrderStateModal.show}
        maskClosable={false}
        onOk={() => {
          updateOrderStateModal.form[0].validateFields().then(() => {
            http({
              url: 'admin/movieOrder/updateOrderState',
              method: 'post',
              data: {
                ...updateOrderStateModal.data
              }
            }).then(() => {
              setUpdateOrderStateModal({
                ...updateOrderStateModal,
                show: false
              })
              getData()
            })
          })
        }}
        onCancel={() => {
          setUpdateOrderStateModal({
            ...updateOrderStateModal,
            show: false
          })
        }}
      >
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          form={updateOrderStateModal.form[0]}
        >
          <Form.Item
            label={t('updateOrderStateModal.form.orderState.label')}
            name="orderState"
            rules={[
              {
                required: true,
                message: t('updateOrderStateModal.form.payState.required')
              }
            ]}
          >
            <DictSelect
              code={DictCode.ORDER_STATE}
              value={updateOrderStateModal.data.orderState}
              onChange={(val) => {
                // updateOrderStateModal.form[0].setFieldValue('orderState', val)
                setUpdateOrderStateModal({
                  ...updateOrderStateModal,
                  data: {
                    ...updateOrderStateModal.data,
                    orderState: val
                  }
                })
              }}
            ></DictSelect>
          </Form.Item>
          {/* <Form.Item
            label={t('updateOrderStateModal.form.payState.label')}
            name="payState"
            rules={[
              {
                required: true,
                message: t('updateOrderStateModal.form.payState.required')
              }
            ]}
          >
            <DictSelect
              code={DictCode.PAY_STATE}
              value={updateOrderStateModal.data.payState}
              onChange={(val) => {
                updateOrderStateModal.form[0].setFieldValue('payState', val)
                // setQuery({
                //   ...query,
                //   payState: val
                // })
              }}
            ></DictSelect>
          </Form.Item> */}
        </Form>
      </Modal>
      <Modal
        title={t('QRcodeModal.title')}
        open={QRcodeModal.show}
        onOk={() => {
          setQRcodeModal({
            ...QRcodeModal,
            show: false
          })
        }}
        onCancel={() => {
          setQRcodeModal({
            ...QRcodeModal,
            show: false
          })
        }}
      >
        <Flex justify="center">
          <CustomAntImage
            src={QRcodeModal.data}
            preview={false}
            alt="qrCode"
          ></CustomAntImage>
        </Flex>
      </Modal>
    </section>
  )
}
