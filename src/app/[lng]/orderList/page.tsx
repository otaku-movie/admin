'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Row,
  Image,
  Tag,
  Input,
  Select,
  Modal,
  message,
  DatePicker
} from 'antd'

import type { TableColumnsType } from 'antd'
import { status, notFoundImage } from '@/config/index'
import { useRouter } from 'next/navigation'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import {
  Cinema,
  Movie,
  paginationResponse,
  response,
  theaterHall
} from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import { showTotal } from '@/utils/pagination'
import { CheckPermission } from '@/components/checkPermission'

interface Query {
  id: number
  movieId: number
  cinemaId: number
  theaterHallId: number
  orderState: number
  payState: number
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

  const getData = (page = 1) => {
    http({
      url: 'order/list',
      method: 'post',
      data: {
        page,
        pageSize: 10
      }
    }).then((res) => {
      setData(res.data.list)
      setPage(page)
      setTotal(res.data.total)
    })
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

  useEffect(() => {}, [query, setQuery])

  const columns: TableColumnsType = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      width: 400,
      fixed: 'left',
      render(_: any, row) {
        return (
          <Space align="start">
            <Image
              width={100}
              src={row.moviePoster}
              alt="poster"
              fallback={notFoundImage}
              placeholder={true}
              style={{
                borderRadius: ' 4px'
              }}
            ></Image>
            <Space direction="vertical">
              <span>{row.movieName}</span>
              <span>
                {t('table.cinemaName')}：{row.cinemaName}
              </span>
              <span>
                {t('table.theaterHallName')}：{row.theaterHallName}
              </span>
              <span>
                {t('table.specName')}：{row.theaterHallSpecName}
              </span>
            </Space>
          </Space>
        )
      }
    },
    {
      title: t('table.showTime'),
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
      render(_, row) {
        return (
          <Space direction="vertical">
            {row.seat.map(
              (item: { seatX: number; seatY: number }, index: number) => {
                return (
                  <Tag key={index}>
                    {item.seatX}排{item.seatY}座
                  </Tag>
                )
              }
            )}
          </Space>
        )
      }
    },

    {
      title: t('table.orderNumber'),
      dataIndex: 'id'
    },
    {
      title: t('table.orderTotal'),
      dataIndex: 'orderTotal'
    },
    {
      title: t('table.orderTime'),
      dataIndex: 'orderTime'
    },
    {
      title: t('table.orderState'),
      render(_, row) {
        return <span>订单已创建</span>
      },
      dataIndex: 'orderState'
    },
    {
      title: t('table.payTotal'),
      dataIndex: 'payTotal'
    },
    {
      title: t('table.payTime'),
      dataIndex: 'payTime'
    },
    {
      title: t('table.payState'),
      render(_, row) {
        return <span>待支付</span>
      },
      dataIndex: 'payState'
    },
    {
      title: t('table.payMethod'),
      dataIndex: 'payMethod'
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      // width: 100,
      render: (_, row) => {
        return (
          <CheckPermission code="movieOrder.remove">
            <Space>
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
                          url: 'movieOrder/remove',
                          method: 'delete',
                          params: {
                            id: row.id
                          }
                        })
                          .then(() => {
                            message.success(t('message.remove.success'))
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
      <Space direction="vertical" size={30}>
        <Query
          model={query}
          onSearch={() => {
            console.log(query)
          }}
          onClear={(obj) => {
            setQuery({ ...obj })
          }}
        >
          <QueryItem label={t('search.id')}>
            <Input
              value={query.id}
              onChange={(e) => {
                setQuery({
                  ...query,
                  id: e.target.value
                })
              }}
            ></Input>
          </QueryItem>
          <QueryItem label={t('search.orderTime')}>
            <DatePicker.RangePicker
              showTime
              value={query.orderTime}
              onChange={(_, val) => {
                console.log(val)
                setQuery({
                  ...query,
                  orderTime: val
                })
              }}
            ></DatePicker.RangePicker>
          </QueryItem>
          <QueryItem label={t('table.name')}>
            <Select
              showSearch
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
              {JSON.stringify(movieData)}
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
            <Select
              value={query.orderState}
              onChange={(val) => {
                setQuery({
                  ...query,
                  orderState: val
                })
              }}
              // onSearch={getMovieData}
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
          <QueryItem label={t('search.payState')}>
            <Select
              // showSearch
              value={query.movieId}
              onChange={(val) => {
                setQuery({
                  ...query,
                  movieId: val
                })
              }}
              // onSearch={getMovieData}
            >
              {JSON.stringify(movieData)}
              {movieData.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
          </QueryItem>
        </Query>

        <Table
          columns={columns}
          dataSource={data}
          bordered={true}
          pagination={{
            pageSize: 10,
            current: page,
            total,
            showTotal,
            onChange(page) {
              getData(page)
            },
            position: ['bottomCenter']
          }}
        />
      </Space>
    </section>
  )
}
